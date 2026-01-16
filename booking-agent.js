/**
 * CCJ GOLF BOOKING AUTOMATION AGENT
 * Version 1.3 - Ultra-Resilient Login
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
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log('--- WAKING UP CCJ BOT ---');
  
  try {
    console.log(`STEP 1: Navigating to ${CONFIG.website}...`);
    // Use a long timeout for the initial load
    await page.goto(CONFIG.website, { waitUntil: 'networkidle', timeout: 90000 });

    console.log('STEP 2: Checking for login interface...');
    
    // Check for the username box with a 30 second wait
    try {
      await page.waitForSelector('#txtUsername', { state: 'visible', timeout: 30000 });
      console.log('Login fields found. Entering credentials...');
      
      await page.fill('#txtUsername', CONFIG.username);
      await page.fill('#txtPassword', CONFIG.password);
      
      // Click and wait for navigation
      await Promise.all([
        page.click('#btnLogin'),
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => console.log('Navigation timeout, checking state...'))
      ]);
      
    } catch (e) {
      console.log('Note: #txtUsername not immediately found. Checking if already logged in...');
    }

    // Verify if we are on the Tee Sheet page
    const isOnTeeSheet = await page.$('#ddlCourse');
    if (!isOnTeeSheet) {
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Check for error messages on the page
      const errorMsg = await page.$('.error-message, .alert-danger');
      if (errorMsg) {
        const text = await errorMsg.innerText();
        throw new Error(`CCJ Login Error: ${text}`);
      }
      
      throw new Error('Failed to reach Tee Sheet. Login likely failed or site changed.');
    }

    console.log('Successfully logged in and reached Tee Sheet.');

    // Calculate Date (2 Saturdays from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14); 
    const dateStr = targetDate.toISOString().split('T')[0];
    console.log(`STEP 3: Searching for ${dateStr}`);

    let success = false;
    for (const course of CONFIG.courses) {
      if (success) break;
      console.log(`STEP 4: Checking ${course}...`);
      
      try {
        await page.selectOption('#ddlCourse', { label: course });
        await page.fill('#txtDate', dateStr);
        await page.click('#btnFindTeeTimes');
        
        // Wait for the results table or a "no times" message
        await page.waitForTimeout(4000); 

        const slots = await page.$$('.tee-time-slot.available');
        console.log(`Found ${slots.length} slots.`);

        for (const slot of slots) {
          const timeText = await slot.innerText();
          const hour = parseInt(timeText.split(':')[0]);
          
          if (hour >= CONFIG.timeWindow.start && hour < CONFIG.timeWindow.end) {
            console.log(`MATCH: ${timeText} @ ${course}. Booking...`);
            await slot.click();
            updateLogs('SUCCESS', `Found slot ${timeText} on ${course} for ${dateStr}`);
            success = true;
            break;
          }
        }
      } catch (e) {
        console.log(`Course check failed for ${course}: ${e.message}`);
      }
    }

    if (!success) {
      updateLogs('FAILED', `No slots available for ${dateStr} in window.`);
    }

  } catch (err) {
    console.error('BOT CRASHED:', err.message);
    updateLogs('FAILED', `Bot Error: ${err.message}`);
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
}

runAutomation();
