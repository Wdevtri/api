const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function scrapeMatches() {
  const isGithubCI = process.env.GITHUB_ACTIONS === 'true';

  const executablePath = isGithubCI
    ? '/usr/bin/google-chrome-stable'
    : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set a common desktop user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
  );

  const url = 'https://1wywg.com/v3/3991/landing-betting-india?lang=en&bonus=hi&subid={sub1}&payout={amount}&p=zgpn&sub1=14t2n34f8hpef';

  try {
    console.log('⏳ Navigating to page...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('✅ Page loaded. Waiting for .calendar-card...');
    await page.waitForSelector('.calendar-card', { timeout: 15000 });

    console.log('🔍 Extracting prematch data...');
    const prematchData = await page.evaluate(() => {
      const matches = [];
      document.querySelectorAll('.calendar-card').forEach(card => {
        const date = card.querySelector('.calendar-card__date')?.innerText.trim() || '';
        const title = card.querySelector('.calendar-card__title')?.innerText.trim() || '';
        const bets = [];
        card.querySelectorAll('.calendar-card__bet-item').forEach(bet => {
          const team = bet.querySelector('.calendar-card__bet-name')?.innerText.trim() || '';
          const odds = bet.querySelector('.calendar-card__bet-coef')?.innerText.trim() || '';
          if (team && odds) bets.push({ team, odds });
        });
        if (title && bets.length > 0) matches.push({ date, title, bets });
      });
      return matches;
    });

    if (prematchData.length === 0) {
      throw new Error('No prematch data found');
    }

    fs.writeFileSync(path.resolve(__dirname, 'prematch.json'), JSON.stringify(prematchData, null, 2));
    console.log(`✅ Saved prematch.json with ${prematchData.length} entries`);

    // Click on "Live" tab
    console.log('🎯 Clicking Live tab...');
    const clicked = await page.evaluate(() => {
      const tab = document.querySelector('.calendar-switcher__item:nth-child(2)');
      if (tab) {
        tab.click();
        return true;
      }
      return false;
    });

    if (!clicked) {
      throw new Error('Live tab not found');
    }

    console.log('⏳ Waiting for live tab content to load...');
    await page.waitForFunction(() => {
      return document.querySelectorAll('.calendar-card').length > 0;
    }, { timeout: 15000 });

    console.log('🔍 Extracting live match data...');
    const liveData = await page.evaluate(() => {
      const matches = [];
      document.querySelectorAll('.calendar-card').forEach(card => {
        const date = card.querySelector('.calendar-card__date')?.innerText.trim() || '';
        const title = card.querySelector('.calendar-card__title')?.innerText.trim() || '';
        const bets = [];
        card.querySelectorAll('.calendar-card__bet-item').forEach(bet => {
          const team = bet.querySelector('.calendar-card__bet-name')?.innerText.trim() || '';
          const odds = bet.querySelector('.calendar-card__bet-coef')?.innerText.trim() || '';
          if (team && odds) bets.push({ team, odds });
        });
        if (title && bets.length > 0) matches.push({ date, title, bets });
      });
      return matches;
    });

    if (liveData.length === 0) {
      throw new Error('No live data found');
    }

    fs.writeFileSync(path.resolve(__dirname, 'live.json'), JSON.stringify(liveData, null, 2));
    console.log(`✅ Saved live.json with ${liveData.length} entries`);

  } catch (err) {
    console.error('❌ Scraping error:', err.message);
    try {
      const html = await page.content();
      fs.writeFileSync(path.resolve(__dirname, 'debug.html'), html);
      await page.screenshot({ path: path.resolve(__dirname, 'final-screenshot.png') });
      console.log('🧾 Saved debug.html and final-screenshot.png');
    } catch (e) {
      console.error('⚠️ Failed to save debug info:', e.message);
    }

  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

scrapeMatches();
