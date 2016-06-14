# Lunchy the Lunch Bot

## Lunchy sends daily menus of your favorite restaurants into  ![](https://cdn-images-1.medium.com/fit/c/32/32/1*TiKyhAN2gx4PpbOsiBhYcw.png) Slack.

![Sample List of Daily Menus by: @lunchy list](../docs/images/slack-screenshot.png)

## Hello! Talk to me...


1. First **Add Favorite Restaurants** by searching it's name of meal

	```java
    @lunchy add burger
    ```
    
2. Then **List Daily Menus** from your Favorites

	```java
	@lunchy list
    ```
    
3. **Remove Restaurant** from your Favorites

	```java
	@lunchy remove Worst Restaurant Ever
    ```

I know, I know, I'm not the smartest AI you've ever met :)

## Deployment Requirements

1. **Git**
1. **Heroku** or similar cloud platform
2. **Redis** data store
3. **Zomato API key**
4. **Slack**


## Quickstart Guide

Full setup can be done in **10 min**! And it's **FREE**.

### 1. Download Lunchy

	% git clone https://github.com/wzoom/lunchy.git


### 2. Deploy to Heroku

Login and create Heroku app first. If you don't have Heroku account, please see the detailed how-to: [deploy Hubot to Heroku](https://github.com/github/hubot/blob/master/docs/deploying/heroku.md)

    % heroku login
    % heroku create lunchy-for-myteam
:blue_book: Instead of *lunchy-for-myteam* you can choose whatever name you like. Just leave it out, if you don't care, the heroku subdomain name will be auto-generated.

	% git push heroku master


    
### 3. Add Redis data store 

Redis is a crucial part of Lunchy, as it stores all downloaded daily menus and team's favorite restaurants. @Lunchy can quickly access desired information this way.

	% heroku addons:create rediscloud:free
    
:blue_book: *Note: `REDISCLOUD_URL` environment variable is created and set on heroku at this point.*
    
### 4. Obtain Zomato API key
You have to login to Zomato with your account and then [create API key](https://developers.zomato.com/api). Finally fill the environment variable `ZOMATO_TOKEN` with the key.

    % heroku config:add ZOMATO_TOKEN=...


### 5. Integrate with Slack ![](https://cdn-images-1.medium.com/fit/c/32/32/1*TiKyhAN2gx4PpbOsiBhYcw.png)
We are almost there...
1. Add [Add Hubot App Integration](https://slack.com/apps/A0F7XDU93-hubot) to your Slack account. :blue_book: *Note: **Hubot** is a bot framework that Lunchy is built on.*    
2. Choose username: **lunchy**
3. Copy the API Token
4. Set the API Token to environment variable `HUBOT_SLACK_TOKEN`:

		% heroku config:add HUBOT_SLACK_TOKEN=...


### 6. Keep Lunchy alive (*optional*)
:construction: TODO: More description will be added...

You can keep Lunchy online during the usual workday of your team, or just during the lunch-time.

```bash
% heroku addons:create scheduler
% heroku config:set HUBOT_HEROKU_KEEPALIVE_URL=... # "Web URL" from: heroku apps:info
% heroku config:set TZ=Europe/Prague  # Following times are coupled with the Timezone
% heroku config:set HUBOT_HEROKU_WAKEUP_TIME=9:00
% heroku config:set HUBOT_HEROKU_SLEEP_TIME=17:00
```


## Help me / Feedback
Do you have something to say? I'm all yours! Let me know what you think, eg. [file Feature Request or a Bug](issues/new).


### Running lunchy Locally

You can test your hubot by running the following, however some plugins will not
behave as expected unless the [environment variables](#configuration) they rely
upon have been set.

You can start lunchy locally by running:

    % bin/hubot

You'll see some start up output and a prompt:
	
	[Sat Feb 28 2015 12:38:27 GMT+0000 (GMT)] INFO Using default redis on localhost:6379
    lunchy>

Then you can interact with lunchy by typing `lunchy help`.

    lunchy> lunchy help
    lunchy lunchy add <restaurant>
    lunchy help - Displays all of the help commands that lunchy knows about.
    ...


## Restart the bot

You may want to get comfortable with `heroku logs` and `heroku restart` if
you're having issues.
