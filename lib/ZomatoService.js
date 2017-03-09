import Eu from 'eu';
import moment from 'moment';
import _ from 'lodash';

import redisClient from '../lib/RedisClient';


class ZomatoService {

  constructor() {
    if (!process.env.ZOMATO_TOKEN) throw new Error('Missing ZOMATO_TOKEN. Please check your environment variables.');

    this.DEFAULT_LOCATION_ID = 84;  // Prague - Zomato's Location ID
    this.DEFAULT_CACHE_TTL_MILLIS_FN = () => moment(24, 'HH').diff() * 1000;
    this.CACHE_PREFIX = 'ZomatoCache:';

    this.store = new Eu.RedisStore(redisClient);
    this.cache = new Eu.Cache(this.store, this.CACHE_PREFIX, null, this.DEFAULT_CACHE_TTL_MILLIS_FN);
    this.eu = new Eu(this.cache);
  }

  /**
   * Helper method to wrap GET /search call for easier calling
   *
   * @param params
   * @returns {Promise}
   * @private
   */
  _search(params) {
    return this._getCached(`/search${this._query(params)}`);
  }

  searchCities(query, maxCount = 10) {
    const params = {
      q: query,
      count: Math.min(maxCount, 20),
    };

    return this._getCached(`/cities${this._query(params)}`)
      .then(({ location_suggestions = {} }) => location_suggestions);
  }

  searchRestaurants(query, maxCount = 10, locationId = this.DEFAULT_LOCATION_ID) {
    const promises = [];
    const params = {
      q: query,
      entity_id: locationId,
      entity_type: 'city',
      count: Math.min(maxCount, 20),
      start: 0
    };

    while (params.start + params.count <= maxCount) {
      //console.log('Adding Promise with params: START=',params.start, 'COUNT=', params.count)
      promises.push(this._search(params));
      params.start += params.count;
    }

    return Promise.all(promises).then((results) => {
      const restaurants = results.map((result) =>
        result.restaurants && result.restaurants.map((rest) => rest.restaurant));
      return restaurants.reduce((all, r) => all.concat(r), []); // Flatten: [[a,b], [c], [d]] => [a,b,c,d]
    })
  }


  /**
   * Returns:
   * DailyMenuCategory {
   *     daily_menu_id (integer, optional): ID of the restaurant ,
   *     name (string, optional): Name of the restaurant ,
   *     start_date (string, optional): Daily Menu start timestamp ,
   *     end_date (string, optional): Daily Menu end timestamp ,
   *     dishes (Array[DailyMenuItem], optional): Menu item in the category
   * }
   *     DailyMenuItem {
   *        dish_id (integer, optional): Menu Item ID ,
   *        name (string, optional): Menu Item Title ,
   *        price (string, optional): Menu Item Price
   *     }
   *
   *
   * @param restaurantId
   * @returns {Promise.<TResult>}
     */
  getDailyMenu(restaurantId) {
    return this._getCached('/dailymenu' + this._query({
        res_id: restaurantId
      }))
      .then((obj) => {
        if (_.isEmpty(obj.daily_menus)) {
          const emptyMenuRestaurant = {
            name: '',
            dishes: []
          };
          return emptyMenuRestaurant;
          //throw new Error('There is no daily_menu in the response for restaurantId ' + restaurantId);
        }

        return obj.daily_menus[0].daily_menu;
      })
      .then((menu) => {
        console.log('Restaurant', restaurantId, 'Menu:', JSON.stringify(menu));
        //if (menu.name) return menu;

        return this.getRestaurant(restaurantId).then(
          (restaurant) => Object.assign({}, menu, {name: restaurant.name, restaurant: restaurant}),
          (err) => menu
        );
    });
  }

  getRestaurant(restaurantId) {
    return this._getCached('/restaurant' + this._query({
      res_id: restaurantId
    }), {
      expiryTimeMillis: () => moment().add(7, 'days').valueOf() * 1000
    });
  }



  // ----- PRIVATE METHODS ----------------------------------------------------------------

  _query(obj) {
    return '?' + Object.keys(obj).map((key) =>
      [key, obj[key]].map(encodeURIComponent).join("="))
      .join("&");
  }


  /*
   _flushCacheKey(key) {
   this.store.flush(this.CACHE_PREFIX + key, (err, res) => {
   !err && console.log('Cache flushed for:', key);
   });
   }
   */

  /**
   * HTTP GET Cached to Redis (only for HTTP response codes 200-299).
   *
   * @param uri
   * @param options
   * @returns {Promise}
   */
  _getCached(uri, options) {
    if (!uri) throw new Error('Define URI to call get().');

    
    const url = 'https://developers.zomato.com/api/v2.1/' + uri.replace(new RegExp('^/'), '');

    if (!options) options = {};
    Object.assign(options, {
      headers: {
        'Accept': 'application/json',
        'user-key': process.env.ZOMATO_TOKEN
      },
      json: true
    });

    return new Promise((resolve, reject) => {
      this.eu.get(url, options, (err, res, body) => {
        if (err) {
          console.log('getCached(', url, '): Err:', err, 'Body:', body);
          //if (body.code === 400) this._flushCacheKey(url);
          reject(err);
        } else {
          //console.log('getCached(', url, '):Body:', body);
          resolve(body);
        }

      })
    })
  }
}

export default new ZomatoService();
