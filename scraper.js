const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function scrapeMatches() {
  const isGithubCI = process.env.GITHUB_ACTIONS === 'true';

  // Define the executable path based on environment
  const executablePath = isGithubCI
    ? '/usr/bin/google-chrome'
    : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  // Launch Puppeteer with the required options
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
    // Wait for the specific element to be loaded
    await page.waitForSelector('.calendar-card', { timeout: 120000 }); // Wait for the calendar card to load

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
    // Use waitForSelector to ensure the live data is loaded before scraping
    await page.waitForSelector('.calendar-card', { timeout: 120000 });  // Wait for the live calendar cards

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
