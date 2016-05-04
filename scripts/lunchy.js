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

import Search from '../lib/Search'

module.exports = (robot) => {

  let search = new Search(robot);

  robot.respond(/search(.*)/i, search.respond.bind(search))
  robot.respond(/list/i, search.list.bind(search))
  robot.respond(/remove(.*)/i, search.removePlace.bind(search))
}
