const puppeteer = require('puppeteer-core');
const fs = require('fs');

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

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
  );

  const url = 'https://1wywg.com/v3/3991/landing-betting-india?lang=en&bonus=hi&subid={sub1}&payout={amount}&p=zgpn&sub1=14t2n34f8hpef';

  try {
    console.log('⏳ Navigating to page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.log('✅ Page loaded. Waiting for .calendar-card...');

    await page.waitForFunction(() => {
      return document.querySelectorAll('.calendar-card').length > 0;
    }, { timeout: 30000 });

    console.log('🔍 Scraping prematch data...');
    const prematchData = await page.evaluate(() => {
      const matches = [];
      document.querySelectorAll('.calendar-card').forEach(card => {
        const date = card.querySelector('.calendar-card__date')?.innerText.trim() || '';
        const title = card.querySelector('.calendar-card__title')?.innerText.trim() || '';
        const bets = [];
        card.querySelectorAll('.calendar-card__bet-item').forEach(bet => {
          const team = bet.querySelector('.calendar-card__bet-name')?.innerText.trim() || '';
          const odds = bet.querySelector('.calendar-card__bet-coef')?.innerText.trim() || '';
          bets.push({ team, odds });
        });
        if (title && bets.length) matches.push({ date, title, bets });
      });
      return matches;
    });

    fs.writeFileSync('prematch.json', JSON.stringify(prematchData, null, 2));
    console.log('✅ Saved prematch.json');

    console.log('🔁 Switching to live tab...');
    await page.evaluate(() => {
      const liveTab = document.querySelector('.calendar-switcher__item:nth-child(2)');
      if (liveTab) liveTab.click();
    });

    await page.waitForTimeout(6000);

    console.log('🔍 Scraping live data...');
    const liveData = await page.evaluate(() => {
      const matches = [];
      document.querySelectorAll('.calendar-card').forEach(card => {
        const date = card.querySelector('.calendar-card__date')?.innerText.trim() || '';
        const title = card.querySelector('.calendar-card__title')?.innerText.trim() || '';
        const bets = [];
        card.querySelectorAll('.calendar-card__bet-item').forEach(bet => {
          const team = bet.querySelector('.calendar-card__bet-name')?.innerText.trim() || '';
          const odds = bet.querySelector('.calendar-card__bet-coef')?.innerText.trim() || '';
          bets.push({ team, odds });
        });
        if (title && bets.length) matches.push({ date, title, bets });
      });
      return matches;
    });

    fs.writeFileSync('live.json', JSON.stringify(liveData, null, 2));
    console.log('✅ Saved live.json');

  } catch (err) {
    console.error('❌ Scraping error:', err.message);

    try {
      const html = await page.content();
      fs.writeFileSync('debug.html', html);
      await page.screenshot({ path: 'final-screenshot.png' });
      console.log('🧾 Saved debug.html and final-screenshot.png');
    } catch (innerErr) {
      console.error('⚠️ Could not save debug info:', innerErr.message);
    }

  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

scrapeMatches();
