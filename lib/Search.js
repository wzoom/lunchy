import ZomatoService from '../lib/ZomatoService'
import Conversation from 'hubot-conversation'
import StorageService from '../lib/StorageService'
import redisClient from '../lib/RedisClient'
import _ from 'lodash'

class Search {

  constructor(robot) {
    this.robot = robot;
    this.teamId = this._getTeamId();
    console.log('Creating Search for Team', this.teamId);

    this.conversation = new Conversation(robot);
    this.store = new StorageService(redisClient, this.teamId);
  }

  list(response) {
    const self = this;

    self.store.listTeamPlaces().then((placeIds) => {
      return Promise.all(
        placeIds.map((id) => ZomatoService.getDailyMenu(id))
      );
    }).then(
      (menus) => {
        console.log('Got ALL Menus now! Menus:', menus);
        const formatedMenus = self._formatMenus(menus);
        //console.log('Formated Menus:', formatedMenus)
        response.reply(formatedMenus.join('\n'))
      },
      (err) => console.log('Cannot download all daily menus. Err:', err)
    );
  }

  removePlace(response) {
    const self = this;

    const query = response.match[1] && response.match[1].trim()
    if (!query) {
      return response.reply('Try typing what you are looking for. Eg. `remove burger` to find all places with *burger* in name.')
    }

    response.reply('Searching for: '+ query)
    ZomatoService.search(query, 100)
      .catch((err) => {
        response.send('Ooops! Search failed with error:' + err)
      })

      .then((restaurants) => {
        let pairs = {}

        if (restaurants && restaurants.length) {
          restaurants.forEach(({restaurant}) => pairs[restaurant.id] = restaurant.name)
        }
        return pairs;
      }).then(
        (pairs) => {
          console.log('Pairs:', pairs);


          //response.reply(formatedMenus.join('\n'))
        }
        //,(err) => console.log('Cannot download all daily menus. Err:', err)
      )
  }


  respond(response) {
    const self = this;

    const query = response.match[1] && response.match[1].trim()
    if (!query) {
      return response.reply('Try typing what you are looking for. Eg. `search burger` :hamburger:')
    }

    response.reply('Searching for: '+ query)

    ZomatoService.search(query, 10)
      .catch((err) => {
        response.send('Ooops! Search failed with error:' + err)
      })

      .then((restaurants) => {
        console.log('Zomato.search Data:', restaurants);

        if (!restaurants || !restaurants.length) {
          response.reply('Funny. No such place was found. Did you just made this up?')
          return [];//Promise.reject('No place found');
        }

        return restaurants.map(r => r.restaurant);
      })

      .then((restaurants) => self._handleFoundRestaurantsDialog(response, restaurants))

  }

  _getTeamId() {
    return _.get(this.robot, 'adapter.client.team.team_id', 'shell');
  }

  _formatMenus(menus) {
    if (!menus || !menus.length) {
      return ['There are no daily menus online yet.', ':notes: No Lunch Today, My Love has Gone Away! :notes:']
    }

    const filledMenus = menus.filter(({dishes}) => dishes && dishes.length).map(({daily_menu_id, start_date, end_date, name, dishes}) => {
      dishes = dishes.map(({dish}, i) => {
        return `${i + 1}) ${dish.name || ''} *${dish.price || ''}*`
      })
      return `\n*${name}*\n${dishes.join('\n')}`
    })

    const emptyMenusRestaurants = menus.filter(({dishes}) => !dishes || !dishes.length).map(({name}) => name);
    const noMenuRestaurants = ':knife_fork_plate: *' + emptyMenusRestaurants.join(', ') + '* has no daily menu available!'
    return [...filledMenus, '', noMenuRestaurants]
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
