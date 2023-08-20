const cheerio = require("cheerio");
const instancePlaywright = require('./instancePlaywright');

async function getIP(){
    const url = "https://api.ipify.org/?format=json";
    const instance = await instancePlaywright(url, true);
    const html = instance.html;
    const $ = cheerio.load(html);
    const ip = $('pre').text();
    await instance.browser.close();
    return ip;
}

async function viewIP(){
    const ip = await getIP();
    console.log('IP:', ip);
}

module.exports = viewIP;
//viewIP().catch(console.error);
