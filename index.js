import Xray from 'x-ray';
import { champions } from './champions.js';
import fs from 'fs';

const x = Xray();

const scrapeChampionQuotes = async (champion) => {
  return new Promise((resolve, reject) => {
    x(`https://leagueoflegends.fandom.com/wiki/${champion}/LoL/Audio`, {
      quotes: x('.mw-parser-output ul li', [
        {
          skin: x(['.skin-play-button@data-skin']),
          quote: x('i'),
          url: x(['.audio-button audio@src']),
          url2: x(['.ext-audiobutton source@src']),
        },
      ]),
    })((err, obj) => {
      if (err) {
        reject(err);
      } else {
        const quotes = [];
        const seen = new Set();
        for (const q of obj.quotes) {
          const url = q.url.length > 0 ? q.url : q.url2;
          if (url.length === 0) continue;
          const quote = q.quote?.replace(/['"]+/g, '');
          if (quote === 'Sound Effect') continue;
          const skins = q.skin.length > 0 ? q.skin : ['Original'];
          skins.forEach((skin, index) => {
            const key = `${skin}-${quote}`;
            if (seen.has(key)) return;
            seen.add(key);
            quotes.push({
              skin,
              quote,
              url: url[index]?.split('/revision')[0],
            });
          });
        }
        resolve({ name: champion, quotes });
      }
    });
  });
};

const getQuotes = async () => {
  const quotePromises = champions.map(scrapeChampionQuotes);
  return Promise.all(quotePromises);
};

const saveData = async () => {
  const data = await getQuotes();
  await fs.promises.writeFile('data.json', JSON.stringify(data));
  console.log('Data Saved');
};
saveData();
