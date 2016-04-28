import { Keys } from './model';


class StorageService {

  constructor(redisClient) {
    this.client = redisClient;
  }

  setTeamId(teamId) {
    this.teamId = teamId;
  }


  addTeamPlaces(placesIds) {
    let self = this;
    if (!placesIds || !placesIds.length) throw new Error('Cannot addTeamPlaces with empty placeIds arguments!');

    const idsWithScores = placesIds.reduce((places, id) => places.concat([0, id]), []);

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
      this.client.ZREVRANGE(rk(Keys.TeamPlaces, self.teamId), [-1, -1], (err, placeIds) => {
        console.log('listTeamPlaces Error:', err, 'PlaceIds:', placeIds)

        if (err) return reject(err);

        console.log('Team', self.teamId, 'Places:', placeIds);

        resolve(placeIds);
      });
    });
  }


}

function rk() {
  return Array.prototype.slice.call(arguments).join(':');
}


export default StorageService;
