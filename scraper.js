const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function scrapeMatches() {
  const isGithubCI = process.env.GITHUB_ACTIONS === 'true';

  const executablePath = isGithubCI
    ? '/usr/bin/google-chrome'
    : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Fake user agent to mimic browser
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
  );

  const url = 'https://1wywg.com/v3/3991/landing-betting-india?lang=en&bonus=hi&subid={sub1}&payout={amount}&p=zgpn&sub1=14t2n34f8hpef';

  try {
    console.log('⏳ Loading page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });

    // Give time to render
    await new Promise(res => setTimeout(res, 5000));

    console.log('⏳ Scraping prematch data...');
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

        if (title && bets.length) matches.push({ date, title, bets });
      });
      return matches;
    });

    fs.writeFileSync('prematch.json', JSON.stringify(prematchData, null, 2), 'utf-8');
    console.log('✅ Updated prematch.json');

    // Switch to live tab
    await page.evaluate(() => {
      const liveTab = document.querySelector('.calendar-switcher__item:nth-child(2)');
      if (liveTab) liveTab.click();
    });

    // Wait for live data to load
    await new Promise(res => setTimeout(res, 5000));

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

        if (title && bets.length) matches.push({ date, title, bets });
      });
      return matches;
    });

    fs.writeFileSync('live.json', JSON.stringify(liveData, null, 2), 'utf-8');
    console.log('✅ Updated live.json');

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Save the page for debugging in GitHub Actions
    try {
      fs.writeFileSync('debug.html', await page.content(), 'utf-8');
    } catch (e) {
      console.error('Failed to save debug HTML:', e.message);
    }

  } finally {
    await browser.close();
  }
}

scrapeMatches();
