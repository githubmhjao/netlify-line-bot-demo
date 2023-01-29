const fetch = require('node-fetch');
const cheerio = require('cheerio');

const defaultTalk = () => {
  const response = {
    type: 'text',
    text: '而 Netlify 的回音盪漾～',
  };
  return response
};

const decodeTalk = (event) => {
  const encodeText = encodeURI(event.message.text);
  console.log(encodeText);
  const response = { 'type': 'text', 'text': replyText };
  
  return response
};

const dictTalk = async (event) => {
  // fetch data
  const targetWord = event.message.text.trim().toLowerCase();
  const url = `https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/${targetWord}`;
  console.log('url:', url);
  const res = await fetch(url);
  const text = await res.text();

  // parse HTML
  const $ = cheerio.load(text);

  // get definition
  const posHeader = $(".pos-header");
  const posBody = $(".pos-body");

  const definitionArr = posHeader.map((idx, el) => ({
    title: $(el).find(".di-title").text(),
    pos: $(el).find(".pos").text(),
    def: [...$(posBody[idx]).find(".def-block").map((_, d) => $(d).find(".def").text())],
    tran: [...$(posBody[idx]).find(".def-block").map((_, d) => $(d).find("span.trans:first-child").text())]
  }));

  const objToText = (obj) => {
    const defText = obj.def.map((x, i) => `${i + 1}. ${x}\n# ${obj.tran[i]}`);
    return `[ ${obj.title} ]\n( ${obj.pos} )\n${defText.join("\n")}`
  };

  const replyText = [...definitionArr].map(objToText).join("\n\n");
  console.log('replyText:', replyText);
  const response = { 'type': 'text', 'text': replyText };

  return response
};
module.exports = { defaultTalk, dictTalk };
