import ZomatoService from '../lib/ZomatoService'
import Conversation from 'hubot-conversation'
import StorageService from '../lib/StorageService'
import redisClient from '../lib/RedisClient'

class Search {

  constructor(robot) {
    this.robot = robot;
    console.log('Adapter:', robot.adapter);
    console.log('Client:', robot.adapter && robot.adapter.client);
    console.log('Team:', robot.adapter && robot.adapter.client && robot.adapter.client.team);
    this.conversation = new Conversation(robot);
  }

  _initStore(response) {
    //console.log('Response Message:', JSON.stringify(response.message));
    console.log('Initializing Store.');

    const team = response.message.room === 'Shell' ? 'Shell' : response.message.user.slack && response.message.user.slack.team_id;
    if (!team) {
      console.log('Cannot find user.slack.team_id in Response Message:', JSON.stringify(response.message));
      response.reply(':confused: I cannot find what team you belong to.');
      return false;
    }

    this.store = new StorageService(redisClient);

    return true;
  }

  list(response) {
    const self = this;
    if (!self._initStore(response)) return;

    self.store.listTeamPlaces().then((placeIds) => {
      return Promise.all(
        placeIds.map((id) => ZomatoService.getDailyMenu(id))
      );
    }).then(
      (menus) => {
        console.log('Got ALL Menus now! Menus:', menus);
        response.reply(self._formatMenus(menus))
      },
      (err) => console.log('Cannot download all daily menus. Err:', err)
    );
  }

  _formatMenus(menus) {
    return menus.map((menu) => {
      menu.dishes = menu.dishes.map((dish, i) => {
        return `${i + 1}) ${dish.name || ''} *${dish.price || ''}*`
      });
      return `*${menu.name}*\n${menu.dishes.join('\n')}`
    }) || 'There are no daily menus online yet.\n:notes: No Lunch Today, My Love has Gone Away! :notes:'
  }


  respond(response) {
    const self = this;
    if (!self._initStore(response)) return;

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

        dialog.resetChoices();
      } else {
        response.reply("Are these numbers? I don't think so. Try again.");
      }


    });
    dialog.dialogTimeout = (timeoutRes) => response.reply('No answer? I guess you changed your mind. Don\'t worry, you can still add more places later.');


  }

}

export default Search;
