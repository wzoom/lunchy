import { Keys } from './model';


class StorageService {

  constructor(redisClient, teamId) {
    this.client = redisClient;
    this.teamId = teamId;
  }

  addTeamPlaces(placesIds) {
    let self = this;
    if (!placesIds || !placesIds.length) throw new Error('Cannot addTeamPlaces with empty placeIds arguments!');

    const idsWithScores = placesIds.reduce((places, id) => [...places, 0, id], []);

    return new Promise((resolve, reject) => {
      console.log('Adding Team', self.teamId, 'Place(s):', placesIds.join(', '));
      this.client.ZADD(rk(Keys.TeamPlaces, self.teamId), idsWithScores, (err, addedCount) => {
        if (err) return reject(err);

        console.log('Added '+addedCount+' items.');

        resolve(addedCount);
      });
    });
  }

  removeTeamPlaces(placesIds) {
    let self = this;
    if (!placesIds || !placesIds.length) throw new Error('Cannot removeTeamPlaces with empty placeIds arguments!');

    return new Promise((resolve, reject) => {
      console.log('Removing Team', self.teamId, 'Place(s):', placesIds.join(', '));
      this.client.ZREM(rk(Keys.TeamPlaces, self.teamId), placesIds, (err, removedCount) => {
        if (err) return reject(err);

        console.log('Removed '+removedCount+' items.');

        resolve(removedCount);
      });
    });
  }

  listTeamPlaces() {
    let self = this;
    return new Promise((resolve, reject) => {
      console.log('Getting Places for Team:', self.teamId);
      this.client.ZREVRANGE(rk(Keys.TeamPlaces, self.teamId), [0, -1], (err, placeIds) => {
        if (err) {
          console.log('List Team "' +self.teamId+ '" Error:', err);
          reject(err);
        } else {
          console.log('List Team "' +self.teamId+ '" Places:', placeIds);
          resolve(placeIds);
        }
      });
    });
  }


}

function rk() {
  return Array.prototype.slice.call(arguments).join(':');
}


export default StorageService;
