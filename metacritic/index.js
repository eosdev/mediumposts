
const cheerio = require("cheerio");
const crypto = require('crypto');
const fs = require('fs');
const instancePlaywright = require('./browser/instancePlaywright');
const myIP = require("./browser/network");



async function nextPage (page, start_selector, end_selector=null) {

    try {
        if (end_selector && await page.$(end_selector)) {
            console.log("end page!");
            return false;
        }

        const button = await page.$(start_selector);
        if (!button) {
            console.log("Next page button not found");
            return false;
        }

        await button.click();
        console.log("next page");
        await page.waitForTimeout(15000);
        return true;

    } catch (error) {
        console.log(`An error occurred: ${error.message}`);
        return false;
    }
}


async function closePopup(page, selector) {
    try {
        const popup = await page.$(selector);
        if (popup) {
            await popup.click();
            console.log("closed");
        }
    } catch (error) {
        console.log("`Failed to close the popup: ${error.message}`");
    }
}

function hashID(strings) {
    hash = crypto.getHashes();
    hashPwd = crypto.createHash('sha1')
            .update(strings).digest('hex');
    
    return hashPwd;
}


function appendToJsonFile(data, filename="data.json") {
    let jsonData = [];
    
    // Verifique se o arquivo já existe
    if (fs.existsSync(filename)) {
        const fileContents = fs.readFileSync(filename, 'utf8');

        // Tente analisar o conteúdo do arquivo, mas capture erros
        try {
            if (fileContents.trim() !== "") {
                jsonData = JSON.parse(fileContents);
            } else {
                console.warn("File exists but it's empty.");
            }
        } catch (error) {
            console.error("Error parsing JSON from file:", error);
            // No caso de um erro, você pode optar por sair da função ou continuar
            // e sobrescrever o arquivo. Neste exemplo, optei por continuar.
        }
    }
    
    // Anexar novos dados ao array
    jsonData.push(...data);
    
    // Salvar o array atualizado de volta ao arquivo
    fs.writeFileSync(filename, JSON.stringify(jsonData, null, 2));
    console.log(`Data appended to ${filename}`);
}

async function scraper(url) {
    const instance = await instancePlaywright(url, true);
    const listings = [];

    let continueScraping = true;
    while (continueScraping) {

        await closePopup(instance.page, "div#onetrust-close-btn-container");

        const html = await instance.page.content();
        const $ = cheerio.load(html);

        const currentURL = await instance.page.url();
        console.log("Current URL:", currentURL);


        const currentPageListings = $("td.clamp-summary-wrap")
            .map((index, element) => {
                const titleElement = $(element).find("a.title");
                const dateElement = $(element).find("div.clamp-details > span");
                const platformElement = $(element).find("div > span.data");
                const scoreElement = $(element).find("div.clamp-score-wrap");
                const summaryElement = $(element).find("div.summary")
                const title = $(titleElement).text();
                const url = $(titleElement).attr("href");
                const date = $(dateElement).text();
                const platform = $(platformElement).text().replace(/\s+/g, '').trim();
                const score = $(scoreElement).text().replace(/\s+/g, '').trim();
                const summary = $(summaryElement).text().trim();
                const ids = hashID(url);
                return { title, url, date, platform, score, summary, ids };
            })
            .get();

        listings.push(...currentPageListings);
        
        myIP();
        //console.log(listings[0]);
        //console.log(currentPageListings);
        //console.log("First item on this page:", currentPageListings[0]);
        
        continueScraping = await nextPage(instance.page, 'div.page_flipper > span.flipper.next > a');

        appendToJsonFile(currentPageListings);
    }

    await instance.browser.close();
    return listings;
}


async function main() {
    const startTime = performance.now();

    const url = "https://www.metacritic.com/browse/games/score/metascore/all/all?page=0";
    const results = await scraper(url);
    //const listpage = await scrapeDescription(results);

    const endTime = performance.now();
    console.log(`Time Execution ${endTime - startTime} milliseconds`)
    
}

main()//.catch(console.error);
