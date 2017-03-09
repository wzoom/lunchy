//
// Description:
//   Zomato script to work with daily menus
//
// Configuration:
//
// Commands:
//   hubot location <city> - Search and set your location.
//   hubot search <restaurant> - Add Restaurant(s) by Searching and choosing from list.
//   hubot list - List Daily Menus of added restaurants
//   hubot remove <restaurant> - Search for restaurant to remove and asks for removal.
//


import _ from 'lodash';
import TeamPlace from '../lib/TeamPlace';

module.exports = (robot) => {

  let teamPlace = new TeamPlace(robot);

  //console.log('ROBOT:', robot.adapterName, 'MAP:', _.flatMap(robot));

  robot.respond(/(search|add)(.*)/i, teamPlace.searchRestaurants.bind(teamPlace));
  robot.respond(/(location)(.*)/i, teamPlace.searchCities.bind(teamPlace));
  robot.respond(/list/i, teamPlace.list.bind(teamPlace));
  robot.respond(/remove(.*)/i, teamPlace.removePlace.bind(teamPlace));
};
