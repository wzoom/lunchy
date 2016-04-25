import redis from 'redis';
import { Keys } from './model';



class StorageService {

  constructor() {
    const url = process.env.REDIS_URL || process.env.REDISCLOUD_URL;
    if (!url) throw new Error('Missing REDIS_URL or REDISCLOUD_URL. Please check your environment variables.');

    this.client = redis.createClient(url);

    this.client.on('error', (err) => console.log('Redis Client Error:', err));
    this.client.on('ready', () => console.log('Redis Client Successfully Connected!'));
  }

  destroy() {
    this.client.quit();
  }

  addTeamPlaces(teamId, placesIds) {
    if (!teamId || !placesIds || !placesIds.length) throw new Error('Cannot addTeamPlaces with empty teamId or placeIds arguments!');

    const idsWithScores = placesIds.reduce((places, id) => places.concat([0, id]), []);

    return new Promise((resolve, reject) => {
      console.log('Adding Team', teamId, 'Place(s):', placesIds.join(', '));
      this.client.ZADD(rk(Keys.TeamPlaces, teamId), idsWithScores, (err, addedCount) => {
        if (err) return reject(err);

        console.log('Added '+addedCount+' items.');

        resolve(addedCount);
      });
    });
  }

  removeTeamPlaces(teamId, placesIds) {
    if (!teamId || !placesIds || !placesIds.length) throw new Error('Cannot removeTeamPlaces with empty teamId or placeIds arguments!');

    return new Promise((resolve, reject) => {
      console.log('Removing Team', teamId, 'Place(s):', placesIds.join(', '));
      this.client.ZREM(rk(Keys.TeamPlaces, teamId), placesIds, (err, removedCount) => {
        if (err) return reject(err);

        console.log('Removed '+removedCount+' items.');

        resolve(removedCount);
      });
    });
  }

  listTeamPlaces(teamId) {
    if (!teamId) throw new Error('Cannot listTeamPlaces with empty teamId argument!');

    return new Promise((resolve, reject) => {
      console.log('Getting Places for Team:', teamId);
      this.client.ZREVRANGE(rk(Keys.TeamPlaces, teamId), ['+inf', '-inf'], (err, placeIds) => {
        if (err) return reject(err);

        console.log('Team', teamId, 'Places:', placeIds);

        resolve(placeIds);
      });
    });
  }


}

function rk() {
  return Array.prototype.slice.call(arguments).join(':');
}


export default StorageService;
