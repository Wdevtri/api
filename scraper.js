const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeMatches() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,  // Use the path set in the GitHub Actions environment
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const url = 'https://1wywg.com/v3/3991/landing-betting-india?lang=en&bonus=hi&subid=%7Bsub1%7D&payout=%7Bamount%7D&p=zgpn&sub1=14t2n34f8hpef';

  try {
    console.log('⏳ Loading page...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });  // Increased timeout

    const extractMatches = async () => {
      console.log('⏳ Waiting for calendar cards...');
      await page.waitForSelector('.calendar-card', { timeout: 60000 }); // Increased timeout for waitForSelector
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
    console.log('⏳ Scraping prematch data...');
    const prematchData = await extractMatches();
    fs.writeFileSync('prematch.json', JSON.stringify(prematchData, null, 2), 'utf-8');
    console.log('✅ Updated prematch.json');

    // Click "Live" tab
    const liveTabSelector = '.calendar-switcher__item:nth-child(2)';
    console.log('⏳ Clicking on "Live" tab...');
    await page.waitForSelector(liveTabSelector, { timeout: 60000 });
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
