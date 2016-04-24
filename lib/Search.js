import ZomatoService from '../lib/ZomatoService'
import Conversation from 'hubot-conversation'
import _ from 'lodash'

class Search {

  constructor(robot) {
    this.robot = robot;
    this.conversation = new Conversation(robot);
  }

  saveIds(ids) {
    // TODO: Store IDs in Redis
    console.log('TODO: Storing IDs:', ids)
  }

  respond(res) {
    const query = res.match[1]
    const self = this;
    res.reply('Searching for: '+ query)

    ZomatoService.search(query)
      .catch((err) => {
        res.send('Ooops! Search failed with error:' + err)
      })

      .then((data) => {
        //console.log('Zomato.search Data:', data);

        if (!data.results_found) {
          res.reply('Funny. No such place was found. Did you just made this up?')
          return [];//Promise.reject('No place found');
        }

        return data.restaurants.map(r => r.restaurant);
      })

      .then((restaurants) => self._handleFoundRestaurantsDialog(res.reply.bind(res), restaurants))

  }

  _handleFoundRestaurantsDialog(reply, restaurants) {
    if (!restaurants.length) return;

    reply(
      'Found ' + restaurants.length + ' places:\n',
      restaurants.map((rest, index) => `${index+1}) * ${rest.name}* - _${rest.location.address}_`).join('\n')
    )

    reply('Which place(s) you woul\'d you like to add? Type just numbers. Eg. 1, 2, 4');

    let dialog = this.conversation.startDialog(response);
    dialog.addChoice(/(\d+)+\D*/g, (choicesRes) => {
      const choices = choicesRes.match;
      //console.log('Choices Selected:', choices);
      if (choices.length) {
        const places = choices.filter(i => i > 0 && i <= restaurants.length).map(i => restaurants[i-1]);

        reply('Awesome! I\'ll fetch daily menus also for ' + places.map(p => p.name).join(', '));

        const ids = places.map(p => p.id)
        self.saveIds(ids);

        dialog.resetChoices();
      } else {
        reply("Are these numbers? I don't think so. Try again.");
      }


    });
    dialog.timeout = (timeoutRes) => reply('I guess you changed your mind with numbers...');


  }

}

export default Search;
