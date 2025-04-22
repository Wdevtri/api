const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeMatches() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // These arguments bypass sandboxing in CI/CD environments
  });
  const page = await browser.newPage();
  const url = 'https://1wywg.com/v3/3991/landing-betting-india?lang=en&bonus=hi&subid=%7Bsub1%7D&payout=%7Bamount%7D&p=zgpn&sub1=14t2n34f8hpef';

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    const extractMatches = async () => {
      await page.waitForSelector('.calendar-card');
      return await page.evaluate(() => {
        const matches = [];
        const cards = document.querySelectorAll('.calendar-card');
        
        cards.forEach(card => {
          const date = card.querySelector('.calendar-card__date')?.innerText.trim() || '';
          const title = card.querySelector('.calendar-card__title')?.innerText.trim() || '';
          const bets = [];
          const betItems = card.querySelectorAll('.calendar-card__bet-item');
          betItems.forEach(bet => {
            const team = bet.querySelector('.calendar-card__bet-name')?.innerText.trim() || '';
            const odds = bet.querySelector('.calendar-card__bet-coef')?.innerText.trim() || '';
            bets.push({ team, odds });
          });

          if (title && bets.length) {
            matches.push({ date, title, bets });
          }
        });

        return matches;
      });
    };

    // Scrape Prematch
    const prematchData = await extractMatches();
    fs.writeFileSync('prematch.json', JSON.stringify(prematchData, null, 2), 'utf-8');
    console.log('✅ Updated prematch.json');

    // Click "Live" tab
    const liveTabSelector = '.calendar-switcher__item:nth-child(2)';
    await page.waitForSelector(liveTabSelector);
    await page.click(liveTabSelector);
    await page.waitForTimeout(3000);  // Wait 3 seconds for live matches to load

    const liveData = await extractMatches();
    fs.writeFileSync('live.json', JSON.stringify(liveData, null, 2), 'utf-8');
    console.log('✅ Updated live.json');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

scrapeMatches();
