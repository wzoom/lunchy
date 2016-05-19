/*
 Description:
 Zomato script to work with daily menus

 Configuration:

 Commands:
    * @lunchy search [query] - Add Place(s) by Searching
      - (Query/Name/Address? Hoffa Praha)
      - Found 4 places. (list them)
      - Which places to add? 1, 3
    * @lunchy [list]|short - List Daily Menus of added places (long list only)
    * @lunchy remove [name]
      - (Which Place to Remove? "name")
      - Numbered List of    Found Places / All Places
      - User: 1
      - Place [Full Restaurant Name found by "name"] was removed.
    * @lunchy [vote|(number)] Vote for particular daily menu - showing user face beneath the attachment
 */

import _ from 'lodash'
import TeamPlace from '../lib/TeamPlace'

module.exports = (robot) => {

  let teamPlace = new TeamPlace(robot);

  console.log('ROBOT:', robot.adapterName, 'MAP:', _.flatMap(robot));
  console.log('STRING ROBOT:', JSON.stringify(robot));

  robot.respond(/(search|add)(.*)/i, teamPlace.search.bind(teamPlace))
  robot.respond(/list/i, teamPlace.list.bind(teamPlace))
  robot.respond(/remove(.*)/i, teamPlace.removePlace.bind(teamPlace))
}
