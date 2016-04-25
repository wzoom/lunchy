import ZomatoService from '../lib/ZomatoService'
import Conversation from 'hubot-conversation'
import StorageService from '../lib/StorageService'

class Search {

  constructor(robot) {
    this.robot = robot;
    this.conversation = new Conversation(robot);
  }

  respond(response) {
    const self = this;
    //console.log('Response Message:', JSON.stringify(response.message));

    const team = response.message.room === 'Shell' ? 'Shell' : response.message.user.slack && response.message.user.slack.team_id;
    if (!team) {
      console.log('Cannot find user.slack.team_id in Response Message:', JSON.stringify(response.message));
      return response.reply(':confused: I cannot find what team you belong to.');
    }
    self.store = new StorageService(team);

    const query = response.match[1] && response.match[1].trim()
    if (!query) {
      return response.reply('Try typing what you are looking for. Eg. `search burger` :hamburger:')
    }

    response.reply('Searching for: '+ query)

    ZomatoService.search(query)
      .catch((err) => {
        response.send('Ooops! Search failed with error:' + err)
      })

      .then((data) => {
        //console.log('Zomato.search Data:', data);

        if (!data.results_found) {
          response.reply('Funny. No such place was found. Did you just made this up?')
          return [];//Promise.reject('No place found');
        }

        return data.restaurants.map(r => r.restaurant);
      })

      .then((restaurants) => self._handleFoundRestaurantsDialog(response, restaurants))

  }

  _handleFoundRestaurantsDialog(response, restaurants) {
    if (!restaurants.length) return;
    const self = this;

    response.reply(
      'Found ' + restaurants.length + ' places:\n' +
      restaurants.map((rest, index) => `${index+1}) *${rest.name}* - _${rest.location.address}_ *Rating: ${rest.user_rating.aggregate_rating}* ` + ':star:'.repeat(Math.round(rest.user_rating.aggregate_rating))).join('\n')
    )

    response.reply('Which place(s) you woul\'d you like to add? Type just numbers. Eg. 1, 2, 4');

    let dialog = this.conversation.startDialog(response);
    dialog.addChoice(/(\d+)+\D*/g, (choicesRes) => {
      const choices = choicesRes.match;
      //console.log('Choices Selected:', choices);
      if (choices.length) {
        const places = choices.filter(i => i > 0 && i <= restaurants.length).map(i => restaurants[i-1]);

        response.reply('Awesome! I\'ll fetch daily menus for ' + places.map(p => p.name).join(', '));

        console.log('Places:', places);
        self.store.addTeamPlaces(places.map(p => p.id));
        setTimeout(() => self.store.destroy(), 5000);

        dialog.resetChoices();
      } else {
        response.reply("Are these numbers? I don't think so. Try again.");
      }


    });
    dialog.dialogTimeout = (timeoutRes) => response.reply('No answer? I guess you changed your mind. Don\'t worry, you can still add more places later.');


  }

}

export default Search;
