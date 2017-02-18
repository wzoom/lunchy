import _ from 'lodash'
import Conversation from 'hubot-conversation'

import ZomatoService from '../lib/ZomatoService'
import StorageService from '../lib/StorageService'
import SlackFormatter  from '../lib/SlackFormatter'
import redisClient from '../lib/RedisClient'
import Utils from '../lib/Utils'

class TeamPlace {

  constructor(robot) {
    this.robot = robot;
    this.teamId = this._getTeamId();
    console.log('Creating TeamPlace for Team', this.teamId);

    this.conversation = new Conversation(robot);
    this.store = new StorageService(redisClient, this.teamId);
  }

  list(response) {
    this.store.listTeamPlaces().then((placeIds) => {
      return Promise.all(
        placeIds.map((id) => ZomatoService.getDailyMenu(id))
      );
    }).then(
      (menus) => {
        console.log('Got ALL Menus now! Menus:', menus);
        if (this.robot.adapterName === 'slack') {
          const menusAsAttachments = SlackFormatter.formatMenus(menus);

          console.log('Sending menus to Slack:', menusAsAttachments, 'Channel:', _.get(response, 'envelope.room'));

          this.robot.emit('slack.attachment', {
            channel: _.get(response, 'envelope.room'),
            text: 'Here you go...',
            attachments: menusAsAttachments
          })
        } else {
          const formatedMenus = this._formatMenus(menus);
          //console.log('Formated Menus:', formatedMenus)
          response.reply(formatedMenus.join('\n'))
        }
      },
      (err) => console.log('Cannot download all daily menus. Err:', err)
    );
  }

  removePlace(response) {
    const query = response.match[1] && response.match[1].trim();
    if (!query) {
      return response.reply('Try typing what you are looking for. Eg. `remove burger` to find all places with *burger* in name.')
    }

    response.reply('Searching for: ' + query);

    this.store.listTeamPlaces().then((placeIds) => Promise.all(
      // Fetch All Team Place Restaurants
      placeIds.map((id) => ZomatoService.getRestaurant(id))
    )).then((restaurants) => {
      // Filter restaurant names by `query`
      const regexp = new RegExp(_.escape(query), 'i');

      return [restaurants.filter((rest) => regexp.test(rest.name)), restaurants];
    }).then(([foundRestaurants, allRestaurants]) => {
      const count = foundRestaurants.length;

      if (count === 0) {
        response.reply('Nope. None. Nichts. Rien. Nic. Try something like _' + _.deburr(_.sample(allRestaurants.map((r) => r.name))).toLowerCase() + '_.')
        return
      }

      console.log('Removing Team Places:', ...foundRestaurants.map((r) => [r.id, r.name]));

      if (count === 1) {
        response.reply(`Bye-bye *${foundRestaurants[0].name}* :toilet:`)
        this.store.removeTeamPlaces([foundRestaurants[0].id]);
        return
      }

      // count === 2+

      response.reply([
        `I've found *${count} places*. Which one do you hate most?`,
        ...foundRestaurants.map((r) => r.name).sort().map((name, i) => `${i+1}) _${name}_`)
      ].join('\n'));

      // Start Dialog
      let dialog = this.conversation.startDialog(response);

      // Numeric choices with whatever non-numeric separators
      dialog.addChoice(/(\d+)+\D*/g, (choicesRes) => {
        const choices = choicesRes.match;
        console.log('Choices Selected:', choices);

        if (choices.length) {
          const placesToRemove = choices.filter(i => i > 0 && i <= count).map(i => foundRestaurants[i-1]);

          if (placesToRemove.length === 0) {
            response.reply(`Follow the numbers. Doesn't look like 1-${count}.`);
            return;
          }

          this.store.removeTeamPlaces(placesToRemove.map((p) => p.id));

          if (placesToRemove.length === 1) {
            response.reply(`Life's too short for junk food. I hate *${placesToRemove[0].name}* too!`);
          } else {
            response.reply(`I hate those too. Will make them disappear, I promise. No more *${placesToRemove.map(p => p.name).join('* or *')}*...`);
          }

          dialog.resetChoices();
        } else {
          response.reply("Are these numbers? I don't think so. Try again.");
        }
      });
      dialog.dialogTimeout = (timeoutRes) => response.reply(`You people are so sloooooow! I'm drinking my ${Utils.suffixOrdinal(_.random(0, 9999999999))} :coffee: already.`);
    })

  }

  searchCities(response) {
    const query = response.match[2] && response.match[2].trim();
    if (!query) {
      return response.reply('Enter your city name. Eg. `Melbourne` :hamburger:');
    }

    response.reply('Searching for: '+ query);

    return Promise.resolve(ZomatoService.searchCities(query, 10))
      .catch((err) => response.send('Ooops! Search failed with error:' + err))
      .then((cities) => this._handleFoundCitiesDialog(response, cities));
  }


  searchRestaurants(response) {
    const query = response.match[2] && response.match[2].trim();
    if (!query) {
      return response.reply('Try typing what you are looking for. Eg. `search burger` :hamburger:');
    }

    return this.store.getCity()
      .then(cityId =>
        Promise.all([
          ZomatoService.searchRestaurants(query, 10, cityId),
          this.store.listTeamPlaces()
        ])
      )
      .catch((err) => response.send(`Ooops! ${err}`))
      .then(([restaurants, placeIdsToExclude]) => {
        console.log('Zomato.search Data:', ...restaurants.map((r) => [r.id, r.name]));

        if (!restaurants || !restaurants.length) {
          response.reply('Funny. No such place was found. Did you just made this up?');
          return [];
        }

        const onlyNewRestaurants = restaurants.filter((r) => !_.includes(placeIdsToExclude, Number(r.id)));

        if (!onlyNewRestaurants.length) {
          response.reply('Looks like there are lot of similar places in your list already.');
          return [];
        }

        return onlyNewRestaurants
      })
      .then((restaurants) => this._handleFoundRestaurantsDialog(response, restaurants));
  }

  _getTeamId() {
    //console.log('Team:', _.get(this.robot, 'adapter.client.team', 'NONE! :('));
    return _.get(this.robot, 'adapter.client.team.id', 'shell');
  }

  _formatMenus(menus) {
    if (!menus || !menus.length) {
      return ['There are no daily menus online yet.', ':notes: No Lunch Today, My Love has Gone Away! :notes:'];
    }

    const filledMenus = menus.filter(({dishes}) => dishes && dishes.length).map(({daily_menu_id, start_date, end_date, name, dishes}) => {
      dishes = dishes.map(({dish}, i) => `${i + 1}) ${dish.name || ''} *${dish.price || ''}*`);
      return `\n*${name}*\n${dishes.join('\n')}`;
    });

    const emptyMenusRestaurants = menus.filter(({dishes}) => !dishes || !dishes.length).map(({name}) => name);
    const noMenuRestaurants = `:knife_fork_plate: *${emptyMenusRestaurants.join(', ')}* has no daily menu available!`;
    return [...filledMenus, '', noMenuRestaurants]
  }

  _handleFoundRestaurantsDialog(response, restaurants) {
    if (!restaurants.length) return;

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
        const count = places.length;

        if (count === 0) {
          response.reply('Oh boy, follow the numbers. :hear_no_evil:');
          return
        }

        response.reply('Awesome! I\'ll fetch daily menus for *' + places.map(p => p.name).join(', ') + '*');

        console.log('Adding Places:', ...places.map((r) => [r.id, r.name]));
        this.store.addTeamPlaces(places.map(p => p.id));

      } else {
        response.reply("Are these numbers? I don't think so. Try again.");
      }
    });
    dialog.dialogTimeout = (timeoutRes) => response.reply('No answer? I guess you changed your mind. Don\'t worry, you can still add more places later.');


  }

  _handleFoundCitiesDialog(response, cities) {
    if (!cities.length) return;

    const formattedCities = cities.map((city, index) => `${index+1}) *${city.name}*\n`);
    response.reply(`Found ${cities.length} cities: ${formattedCities}`);
    response.reply('Select your city. Eg. 1, 2, 4');

    let dialog = this.conversation.startDialog(response);
    dialog.addChoice(/(\d+)+\D*/g, (choicesRes) => {
      const choice = choicesRes.match[0];

      if (choice) {
        const city = cities[choice-1];
        response.reply(`Awesome! I'll save your city as *${city.name}*`);
        this.store.addCity(city.id);

      } else {
        response.reply('Please choose from the cities listed. :hear_no_evil:');
      }
    });
    dialog.dialogTimeout = (timeoutRes) => response.reply('Can\'t decide?');


  }
}

export default TeamPlace;
