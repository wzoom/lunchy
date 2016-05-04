import Eu from 'eu'
import redisClient from '../lib/RedisClient'
import moment from 'moment'
import _ from 'lodash'

//request.debug = true

class ZomatoService {

  constructor() {
    if (!process.env.ZOMATO_TOKEN) throw new Error('Missing ZOMATO_TOKEN. Please check your environment variables.');
    //console.log('ZOMATO_TOKEN = ', process.env.ZOMATO_TOKEN);

    this.DEFAULT_LOCATION_ID = 84  // Prague - Zomato's Location ID
    this.DEFAULT_CACHE_TTL_MILLIS_FN = () => moment(24, 'HH').diff() * 1000;
    this.CACHE_PREFIX = 'ZomatoCache:'

    this.store = new Eu.RedisStore(redisClient);
    this.cache = new Eu.Cache(this.store, this.CACHE_PREFIX, null, this.DEFAULT_CACHE_TTL_MILLIS_FN);
    this.eu = new Eu(this.cache);

  }

  search(query, locationId = this.DEFAULT_LOCATION_ID) {
    return this._getCached('/search' + this._query({
      q: query,
      entity_id: locationId,
      entity_type: 'city',
      count: 10
    }));
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
    const self = this;

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
        if (menu.name) {
          return menu;
        }

        // Name still not there. Get It!
        return self.getRestaurant(restaurantId).then(
          (restaurant) => Object.assign({}, menu, {name: restaurant.name}),
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
    return '?' + Object.keys(obj).map(function(key) {
      return [key, obj[key]].map(encodeURIComponent).join("=");
    }).join("&");
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
    if (!uri) throw new Error('Define URI to call get().')

    const self = this
    const url = 'https://developers.zomato.com/api/v2.1/' + uri.replace(new RegExp('^/'), '')

    if (!options) options = {};
    Object.assign(options, {
      headers: {
        'Accept': 'application/json',
        'user-key': process.env.ZOMATO_TOKEN
      },
      json: true
    })

    return new Promise((resolve, reject) => {
      this.eu.get(url, options, (err, res, body) => {
        if (err) {
          console.log('getCached(', url, '): Err:', err, 'Body:', body);
          //if (body.code === 400) self._flushCacheKey(url);
          reject(err)
        } else {
          //console.log('getCached(', url, '):Body:', body);
          resolve(body)
        }

      })
    })
  }


}


export default new ZomatoService();
