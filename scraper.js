const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

async function scrapeMatches() {
  const isGithubCI = process.env.GITHUB_ACTIONS === 'true';
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || (isGithubCI
    ? '/usr/bin/google-chrome-stable'
    : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set a realistic user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
  );

  const url = 'https://1wywg.com/v3/3991/landing-betting-india?lang=en&bonus=hi&subid={sub1}&payout={amount}&p=zgpn&sub1=14t2n34f8hpef';

  try {
    console.log('⏳ Navigating to page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✅ Page loaded. Waiting for .calendar-card...');

    // Scroll to load all dynamic content
    await autoScroll(page);

    // Wait for calendar cards or capture page body if failed
    await page.waitForFunction(() => {
      return document.querySelectorAll('.calendar-card').length > 0;
    }, { timeout: 30000 }).catch(async () => {
      const bodyText = await page.evaluate(() => document.body.innerText);
      fs.writeFileSync('body-text.txt', bodyText);
      throw new Error('Waiting failed: .calendar-card not found');
    });

    // Scrape prematch data
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

    // Click Live tab
    await page.evaluate(() => {
      const liveTab = document.querySelector('.calendar-switcher__item:nth-child(2)');
      if (liveTab) liveTab.click();
    });

    console.log('⏳ Waiting for live tab content...');
    await new Promise(res => setTimeout(res, 5000));
    await autoScroll(page);

    // Scrape live data
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
      fs.writeFileSync('debug.html', await page.content());
      await page.screenshot({ path: 'final-screenshot.png' });
      console.log('🧾 Saved final screenshot and debug.html');
    } catch (e) {
      console.error('⚠️ Could not save debug info:', e.message);
    }

  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

scrapeMatches();
