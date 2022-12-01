// 載入所需模組 
const line = require('@line/bot-sdk');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const bubble = ({bubbleTitle, bubbleHref, bubbleImg}) => ({
  type: 'bubble',
  hero: {
    type: 'image',
    url: bubbleImg,
    size: 'full',
    aspectRatio: '20:13',
    aspectMode: 'cover',
  },
  body: {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'text',
        text: bubbleTitle,
        weight: 'bold',
        size: 'xl'
      }
    ]
  },
  footer: {
    type: 'box',
    layout: 'vertical',
    spacing: 'sm',
    contents: [
      {
        type: 'button',
        style: 'link',
        height: 'sm',
        action: {
          type: 'uri',
          label: 'WEBSITE',
          uri: bubbleHref
        }
      }
    ],
    flex: 0
  }
});

const carousel = (bubbleArray) => ({
  type: 'carousel',
  contents: bubbleArray
});

// Netlify Functions 的起點
const handler = async (event) => {
  // 取得環境變數
  const clientConfig = {
    channelAccessToken: process.env.TOY_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.TOY_CHANNEL_SECRET,
  };
  // 用 CHANNEL_ACCESS_TOKEN 和 CHANNEL_SECRET 初始化 Line Bot
  const client = new line.Client(clientConfig);

  // 為 Webhook 驗證做準備
  const signature = event.headers['x-line-signature'];
  const body = event.body;

  // Line Bot 運作邏輯
  const handleEvent = async (event) => {

    const { replyToken } = event;
    const keyWord = "poke";
    let response;
    
    if (event.type !== 'message' || event.message.type !== 'text' || !event.message.text.includes(keyWord)) {
      response = {
        type: 'text',
        text: "pokepoke",
      };
    } else  {
      const url = "https://www.pokebeach.com/";
      const res = await fetch(url);
      const text = await res.text();

      const $ = cheerio.load(text);

      const pokeArray = $('.media__container').map((i, el) => ({
        bubbleTitle: $(el).find('h2').text(),
        bubbleHref: $(el).find('h2 a').attr('href'),
        bubbleImg: $(el).find('img').attr('src')
      }));
      
      const pokeBubbleArray = [...pokeArray].map(poke => bubble(poke));
      console.log(pokeBubbleArray);

      // Create a new message.
      response = {
        type: 'flex',
        altText: "Flex",
        contents: carousel(pokeBubbleArray)
      };
    }   

    await client.replyMessage(replyToken, response)
  }

  try {
    // 用 CHANNEL_SECRET 來驗證 Line Bot 身分
    if (!line.validateSignature(body, clientConfig.channelSecret, signature)) {
      throw new line.exceptions.SignatureValidationFailed("signature validation failed", signature)
    }

    // 將 JSON 轉為 JavaScript 物件
    const objBody = JSON.parse(body);
    // 將觸發事件交給 Line Bot 做處理
    await Promise.all(objBody.events.map(handleEvent))

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Hello from Netlify" }),
    }
  } catch (error) {
    console.log(error)
    return { statusCode: 500, body: error.toString() }
  }
}

module.exports = { handler }
