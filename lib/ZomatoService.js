import request from 'request-promise'

//request.debug = true

class ZomatoService {

  constructor() {
    if (!process.env.ZOMATO_TOKEN) throw new Error('Missing ZOMATO_TOKEN. Please check your environment variables.');

    this.DEFAULT_LOCATION_ID = 84 // Prague - Zomato's Location ID


    console.log('ZOMATO_TOKEN = ', process.env.ZOMATO_TOKEN);

    this.request = request.defaults({
      baseUrl: 'https://developers.zomato.com/api/v2.1/',
      headers: {
        'Accept': 'application/json',
        'user-key': process.env.ZOMATO_TOKEN
      },
      json: true
    });
  }

  search(query, locationId = this.DEFAULT_LOCATION_ID) {
    return this.request.get({
      uri: '/search',
      qs: {
        q: query,
        entity_id: locationId,
        entity_type: 'city',
        count: 10
      }
    });
  }

}


export default new ZomatoService();
