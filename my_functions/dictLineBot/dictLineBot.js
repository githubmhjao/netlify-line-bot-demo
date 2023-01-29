const line = require('@line/bot-sdk');
const qaisTalk = require('./custom_module/qaisTalk.js');

const handler = async (event) => {
  
  const clientConfig = {
    channelAccessToken: process.env.DICT_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.DICT_CHANNEL_SECRET,
  };

  const client = new line.Client(clientConfig);

  const signature = event.headers['x-line-signature'];
  const body = event.body;

  const handleEvent = async (event) => {

    const { replyToken } = event;
    let response;

    if (event.type !== 'message' || event.message.type !== 'text') {
      response = qaisTalk.defaultTalk();
    } else if (event.message.text.includes('https')) {
      response = qaisTalk.decodeURITalk(event);
    } else {
      response = await qaisTalk.dictTalk(event);
    }
    
    await client.replyMessage(replyToken, response);
  }

  try {
    if (!line.validateSignature(body, clientConfig.channelSecret, signature)) {
      throw new line.exceptions.SignatureValidationFailed("signature validation failed", signature)
    }

    const objBody = JSON.parse(body);
    await Promise.all(objBody.events.map(handleEvent));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Hello from Netlify" }),
    };
  } catch (error) {
    console.log(error);
    return { statusCode: 500, body: error.toString() };
  }
}

module.exports = { handler };
