/**
 * CCJ GOLF BOOKING AUTOMATION AGENT
 * Version 1.2 - Enhanced Debugging
 */

const { chromium } = require('playwright');
const fs = require('fs');

const CONFIG = {
  username: process.env.CCJ_USER || 'Vausie',
  password: process.env.CCJ_PASS || 'Harry2011',
  website: 'https://members.thecountryclub.co.za/TeeTimes/TeeSheet.aspx',
  courses: ['Woodmead', 'Rocklands'],
  players: ['MR GRANT TORLAGE', 'MR ROSCOE DEKKER', 'MR DANIEL KLEYNHANS'],
  timeWindow: { start: 7, end: 8 }
};

async function runAutomation() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('--- WAKING UP CCJ BOT ---');
  
  try {
    console.log(`STEP 1: Visiting CCJ Website...`);
    await page.goto(CONFIG.website, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('STEP 2: Looking for Login boxes...');
    // Check if we are already logged in or need to log in
    const loginVisible = await page.$('#txtUsername');
    
    if (loginVisible) {
      await page.fill('#txtUsername', CONFIG.username);
      await page.fill('#txtPassword', CONFIG.password);
      await page.click('#btnLogin');
      console.log('Login submitted. Waiting for page to load...');
      await page.waitForLoadState('networkidle');
    } else {
      console.log('Username field not found. Might already be logged in or on wrong page.');
    }

    // Double check if login worked
    const errorMessage = await page.$('.error-message');
    if (errorMessage) {
      const txt = await errorMessage.innerText();
      throw new Error(`Login Rejected by CCJ: ${txt}`);
    }

    // Calculate Date (2 Saturdays from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14); // Exactly 2 weeks ahead
    const dateStr = targetDate.toISOString().split('T')[0];
    console.log(`STEP 3: Targeting Date ${dateStr}`);

    let success = false;
    for (const course of CONFIG.courses) {
      if (success) break;
      console.log(`STEP 4: Checking ${course} course...`);
      
      try {
        await page.selectOption('#ddlCourse', { label: course });
        await page.fill('#txtDate', dateStr);
        await page.click('#btnFindTeeTimes');
        await page.waitForTimeout(3000); // Wait for slots to pop up

        const slots = await page.$$('.tee-time-slot.available');
        console.log(`Found ${slots.length} available slots on ${course}.`);

        for (const slot of slots) {
          const timeText = await slot.innerText();
          const hour = parseInt(timeText.split(':')[0]);
          
          if (hour >= CONFIG.timeWindow.start && hour < CONFIG.timeWindow.end) {
            console.log(`MATCH! Found ${timeText}. Attempting to book...`);
            await slot.click();
            
            // Note: Booking confirmation steps would go here
            // For safety in testing, we log the intent.
            updateLogs('SUCCESS', `Found and clicked ${timeText} on ${course} for ${dateStr}`);
            success = true;
            break;
          }
        }
      } catch (e) {
        console.log(`Error scanning ${course}: ${e.message}`);
      }
    }

    if (!success) {
      updateLogs('FAILED', `No slots available between 07:00-08:00 for ${dateStr}`);
    }

  } catch (err) {
    console.error('BOT CRASHED:', err.message);
    updateLogs('FAILED', `Critical Stop: ${err.message}`);
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
  } catch (e) {}
  
  logs.unshift(logEntry);
  fs.writeFileSync('logs.json', JSON.stringify(logs.slice(0, 20), null, 2));
  console.log(`LOG SAVED: ${status} - ${details}`);
}

runAutomation();
