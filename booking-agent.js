/**
 * CCJ GOLF BOOKING AUTOMATION AGENT
 * Improved version with better error handling and explicit waits.
 */

const { chromium } = require('playwright');
const fs = require('fs');

const CONFIG = {
  username: process.env.CCJ_USER || 'Vausie',
  password: process.env.CCJ_PASS || 'Harry2011',
  website: 'https://members.thecountryclub.co.za/TeeTimes/TeeSheet.aspx',
  courses: ['Woodmead', 'Rocklands'],
  players: ['MR GRANT TORLAGE', 'MR ROSCOE DEKKER', 'MR DANIEL KLEYNHANS'],
  timeWindow: { start: 7, end: 8 },
  notifyEmail: 'richard@syndev.co.za'
};

async function runAutomation() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('--- Starting CCJ Automation ---');
  
  try {
    // 1. Navigation with longer timeout
    console.log(`Navigating to ${CONFIG.website}...`);
    await page.goto(CONFIG.website, { waitUntil: 'networkidle', timeout: 60000 });

    // 2. Login with explicit waits for selectors
    console.log('Attempting login...');
    try {
      await page.waitForSelector('#txtUsername', { timeout: 15000 });
      await page.fill('#txtUsername', CONFIG.username);
      await page.fill('#txtPassword', CONFIG.password);
      await page.click('#btnLogin');
      
      // Wait for navigation after login or check for error message
      await Promise.race([
        page.waitForNavigation({ timeout: 20000 }),
        page.waitForSelector('.error-message', { timeout: 20000 }).then(() => { throw new Error('Invalid Credentials'); })
      ]);
      console.log('Logged in successfully.');
    } catch (loginErr) {
      throw new Error(`Login phase failed: ${loginErr.message}`);
    }

    // 3. Calculate Target Date (2 Saturdays ahead)
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + daysUntilSaturday + 14); 
    const dateStr = targetDate.toISOString().split('T')[0];
    console.log(`Targeting Date: ${dateStr}`);

    // 4. Scan Courses
    let bookingFound = false;
    for (const course of CONFIG.courses) {
      if (bookingFound) break;
      console.log(`Checking ${course}...`);
      
      try {
        await page.waitForSelector('#ddlCourse', { timeout: 10000 });
        await page.selectOption('#ddlCourse', course);
        await page.fill('#txtDate', dateStr);
        await page.click('#btnFindTeeTimes');
        await page.waitForLoadState('networkidle');

        const slots = await page.$$('.tee-time-slot.available');
        for (const slot of slots) {
          const timeText = await slot.innerText();
          const hour = parseInt(timeText.split(':')[0]);
          
          if (hour >= CONFIG.timeWindow.start && hour < CONFIG.timeWindow.end) {
            console.log(`Found slot: ${timeText} on ${course}. Booking...`);
            await slot.click();
            
            // Fill Player Names
            for (let i = 0; i < CONFIG.players.length; i++) {
              const selector = `#player_${i+1}`;
              if (await page.$(selector)) {
                await page.fill(selector, CONFIG.players[i]);
              }
            }
            
            await page.click('#btnConfirmBooking');
            console.log(`CONFIRMED: ${timeText} @ ${course}`);
            bookingFound = true;
            updateLogs('SUCCESS', `Booked ${timeText} on ${course} for ${dateStr}`);
            break;
          }
        }
      } catch (courseErr) {
        console.warn(`Error checking ${course}: ${courseErr.message}`);
      }
    }

    if (!bookingFound) {
      console.log('No slots found in window.');
      updateLogs('FAILED', 'No available slots found between 07:00 and 08:00');
    }

  } catch (err) {
    console.error('Automation Error:', err);
    updateLogs('FAILED', `Critical Error: ${err.message}`);
    // Re-throw to ensure GitHub marks the run as failed so we see the red X correctly 
    // but only after writing logs.
    process.exit(1); 
  } finally {
    await browser.close();
  }
}

function updateLogs(status, details) {
  const logEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    status: status,
    details: details
  };
  
  let logs = [];
  try {
    if (fs.existsSync('logs.json')) {
      logs = JSON.parse(fs.readFileSync('logs.json', 'utf8'));
    }
  } catch (e) {
    console.error('Error reading logs.json', e);
  }
  
  logs.unshift(logEntry);
  fs.writeFileSync('logs.json', JSON.stringify(logs.slice(0, 20), null, 2));
  console.log('Logs updated locally.');
}

runAutomation();
