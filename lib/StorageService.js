import { Keys } from './model';

class StorageService {

  constructor(redisClient, teamId) {
    this.client = redisClient;
    this.teamId = teamId;
  }

  addCity(cityId) {
    if (!cityId) throw new Error('cityId is missing!');

    return new Promise((resolve, reject) =>
      this.client.set(rk(Keys.City, this.teamId), cityId, (err, addedCount) =>
        err ? reject(err) : resolve(addedCount))
    );
  }

  getCity() {
    return new Promise((resolve, reject) =>
      this.client.get(rk(Keys.City, this.teamId), (err, cityId) => {
        if (err) {
          reject(err);
        }
        if (!cityId) {
          reject(`Set your location first! Eg. '@lunchy location Melbourne'`);
        }

        resolve(cityId);
      })
    )
  }

  addTeamPlaces(placesIds) {
    if (!placesIds || !placesIds.length) throw new Error('Cannot addTeamPlaces with empty placeIds arguments!');

    const idsWithScores = placesIds.reduce((places, id) => [...places, 0, id], []);

    return new Promise((resolve, reject) => {
      console.log('Adding Team', this.teamId, 'Place(s):', placesIds.join(', '));
      this.client.ZADD(rk(Keys.TeamPlaces, this.teamId), idsWithScores, (err, addedCount) => {
        if (err) return reject(err);

        console.log('Added '+addedCount+' items.');

        resolve(addedCount);
      });
    });
  }

  removeTeamPlaces(placesIds) {
    if (!placesIds || !placesIds.length) throw new Error('Cannot removeTeamPlaces with empty placeIds arguments!');

    return new Promise((resolve, reject) => {
      console.log('Removing Team', this.teamId, 'Place(s):', placesIds.join(', '));
      this.client.ZREM(rk(Keys.TeamPlaces, this.teamId), placesIds, (err, removedCount) => {
        if (err) return reject(err);

        console.log('Removed '+removedCount+' items.');

        resolve(removedCount);
      });
    });
  }

  listTeamPlaces() {
    return new Promise((resolve, reject) => {
      console.log('Getting Places for Team:', this.teamId);
      this.client.ZREVRANGE(rk(Keys.TeamPlaces, this.teamId), [0, -1], (err, placeIds) => {
        if (err) {
          console.log('List Team "' +this.teamId+ '" Error:', err);
          reject(err);
        } else {
          console.log('List Team "' +this.teamId+ '" Places:', placeIds.join(', '));
          resolve(placeIds.map((id) => parseInt(id, 10)));
        }
      });
    });
  }


}

function rk() {
  return Array.prototype.slice.call(arguments).join(':');
}


export default StorageService;
