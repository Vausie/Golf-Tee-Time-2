
/**
 * CCJ GOLF BOOKING AUTOMATION AGENT
 * This script runs in a Node.js environment (e.g., GitHub Actions).
 * It uses Playwright to simulate a real user booking a tee time.
 */

const { chromium } = require('playwright');
const fs = require('fs');

const CONFIG = {
  username: process.env.CCJ_USER || 'Vausie',
  password: process.env.CCJ_PASS || 'Harry2011',
  website: 'https://members.thecountryclub.co.za/TeeTimes/TeeSheet.aspx',
  courses: ['Woodmead', 'Rocklands'],
  players: ['MR GRANT TORLAGE', 'MR ROSCOE DEKKER', 'MR DANIEL KLEYNHANS'],
  timeWindow: { start: 7, end: 8 }, // 7 AM to 8 AM
  notifyEmail: 'richard@syndev.co.za'
};

async function runAutomation() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('--- Starting CCJ Automation ---');
  
  try {
    // 1. Login
    await page.goto(CONFIG.website);
    await page.fill('#txtUsername', CONFIG.username);
    await page.fill('#txtPassword', CONFIG.password);
    await page.click('#btnLogin');
    await page.waitForNavigation();
    console.log('Logged in successfully.');

    // 2. Calculate Target Date (2 Saturdays ahead)
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + daysUntilSaturday + 14); // 2 Saturdays ahead
    const dateStr = targetDate.toISOString().split('T')[0];
    console.log(`Targeting Date: ${dateStr}`);

    // 3. Scan Courses
    let bookingFound = false;
    for (const course of CONFIG.courses) {
      if (bookingFound) break;
      console.log(`Checking ${course}...`);
      
      // Navigate to course/date (Specific URL structure depends on CCJ's internal routing)
      // This is a simplified representation of the interaction logic:
      await page.selectOption('#ddlCourse', course);
      await page.fill('#txtDate', dateStr);
      await page.click('#btnFindTeeTimes');
      await page.waitForLoadState('networkidle');

      // 4. Find Available Slots
      const slots = await page.$$('.tee-time-slot.available');
      for (const slot of slots) {
        const timeText = await slot.innerText(); // e.g., "07:12"
        const hour = parseInt(timeText.split(':')[0]);
        
        if (hour >= CONFIG.timeWindow.start && hour < CONFIG.timeWindow.end) {
          console.log(`Found slot: ${timeText} on ${course}. Booking...`);
          await slot.click();
          
          // 5. Fill Player Names
          for (let i = 0; i < CONFIG.players.length; i++) {
            await page.fill(`#player_${i+1}`, CONFIG.players[i]);
          }
          
          await page.click('#btnConfirmBooking');
          console.log(`CONFIRMED: ${timeText} @ ${course}`);
          bookingFound = true;
          updateLogs('SUCCESS', `Booked ${timeText} on ${course} for ${dateStr}`);
          break;
        }
      }
    }

    if (!bookingFound) {
      console.log('No slots found in window.');
      updateLogs('FAILED', 'No available slots found between 07:00 and 08:00');
    }

  } catch (err) {
    console.error('Automation Error:', err);
    updateLogs('FAILED', `Critical Error: ${err.message}`);
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
    logs = JSON.parse(fs.readFileSync('logs.json', 'utf8'));
  } catch (e) {}
  
  logs.unshift(logEntry);
  fs.writeFileSync('logs.json', JSON.stringify(logs.slice(0, 20), null, 2));
}

runAutomation();
