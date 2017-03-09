// Description
//   Middleware for Lunchy to Process commands also from Slack attachments
//
// Configuration:
//   Fully Automatic
//
// Commands:
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//

import {TextMessage} from 'hubot';
import _ from 'lodash';

module.exports = (robot) => {

  let isCommand = robot.respondPattern('');
  isCommand = isCommand.test.bind(isCommand);


  const mapSlackAttachments = (context, next, done) => {
    //robot.logger.info('MESSAGE:', context.response.message);
    const attachments = _.get(context.response.message, 'rawMessage.attachments');
    if (!attachments) return next();

    //robot.logger.info('ATTACHMENTS:', attachments);

    const possibleCommand = _.find(attachments, a => isCommand(a.text));
    if (possibleCommand && possibleCommand.text) {
      robot.logger.info('Possible Lunchy command received in Slack Attachment:', possibleCommand.text);
      context.response.message.finish();
      const {user, rawMessage} = context.response.message;

      robot.receive(new TextMessage(user, possibleCommand.text, rawMessage.ts));
    }

    next(done);
  };

  robot.receiveMiddleware(mapSlackAttachments);

  //console.log('ROBOT:', robot.name, 'MAP:', robot);
};
