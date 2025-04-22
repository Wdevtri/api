const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function scrapeMatches() {
  const isGithubCI = process.env.GITHUB_ACTIONS === 'true';

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const url = 'https://1wywg.com/v3/3991/landing-betting-india?lang=en&bonus=hi&subid=%7Bsub1%7D&payout=%7Bamount%7D&p=zgpn&sub1=14t2n34f8hpef';

  try {
    console.log('⏳ Loading page...');
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('⏳ Scraping prematch data...');
    await page.waitForSelector('.calendar-card', { timeout: 60000 });

    const prematchData = await page.evaluate(() => {
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

    fs.writeFileSync('prematch.json', JSON.stringify(prematchData, null, 2), 'utf-8');
    console.log('✅ Updated prematch.json');

    // Click "Live" tab and scrape live data
    await page.click('.calendar-switcher__item:nth-child(2)');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const liveData = await page.evaluate(() => {
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

    fs.writeFileSync('live.json', JSON.stringify(liveData, null, 2), 'utf-8');
    console.log('✅ Updated live.json');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

scrapeMatches();
