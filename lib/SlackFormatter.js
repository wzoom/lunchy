import _ from 'lodash'


class SlackFormatter {

  constructor() {
    this.colors = ['#870e0e', '#d08b05', '#ffe900', '#1e7e51', '#805621'];
    this.currentColorIndex = 0;
  }


  formatMenus(menus) {
    let attachments = [];

    if (menus && menus.length) {
      attachments = menus
        .filter(({dishes}) => dishes && dishes.length)
        .map(({daily_menu_id, start_date, end_date, name, dishes}) => this._menuToAttachment(dishes, name));
    }

    return attachments;
  }


  _menuToAttachment(dishes, restaurantName = '', restaurantUrl, restaurantThumb) {
    return {
      title: restaurantName,
      text: dishes.map(({dish}) => `${_.trim(dish.name)} *${_.trim(dish.price)}*`).join('\n'),
      title_link: restaurantUrl,
      thumb_url: restaurantThumb,
      //pretext:  = '',
      mrkdwn_in: ['text', 'pretext'],
      color: this._getNextColor()
    }
  }

  _getNextColor() {
    const color = this.colors[this.currentColorIndex];
    this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length
    return color;
  }

}

export default new SlackFormatter();
