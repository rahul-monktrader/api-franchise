import axios from 'axios';

type SlackMessagePayload = {
  message: string;
  module: string;
  filename: string;
  status: boolean;
};





const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';
/**
 * Sends a message to a Slack channel.
 * @param {SlackMessagePayload} payload - The message payload.
 */
export async function sendSlackMessage(payload: SlackMessagePayload): Promise<void> {
  const { message, module, filename, status } = payload;

  if (!SLACK_WEBHOOK_URL) {
    console.error('Slack Webhook URL is not configured.');
    return;
  }

  const slackMessage = {
    text: status
      ? `:white_check_mark: *Success* in module \`${module}\` at file \`${filename}\`:\n${message}`
      : `:x: *Error* in module \`${module}\` at file \`${filename}\`:\n${message}`,
    username: 'Notifier',
    icon_emoji: status ? ':rocket:' : ':warning:',
  };

  try {
    const response = await axios.post(SLACK_WEBHOOK_URL, slackMessage);
    console.log('Message sent to Slack:', response.status);
  } catch (error) {
    console.error('Error sending message to Slack:', error);
  }



  
}
