"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSlackMessage = sendSlackMessage;
const axios_1 = require("axios");
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';
async function sendSlackMessage(payload) {
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
        const response = await axios_1.default.post(SLACK_WEBHOOK_URL, slackMessage);
        console.log('Message sent to Slack:', response.status);
    }
    catch (error) {
        console.error('Error sending message to Slack:', error);
    }
}
//# sourceMappingURL=slack.util.js.map