const puppeteer = require('puppeteer');
const schedule = require('node-schedule');
require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8081;

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/',(req,res) => {
    res.send('hello');
})
// Debugging: Log the username and password
console.log('Username:', process.env.MY_USERNAME);
console.log('Password:', process.env.MY_PASSWORD);

// URL of the portal
const LOGIN_URL = 'https://teamcipl.greythr.com/uas/portal/auth/login';
const HOLIDAY_CALENDAR_URL = 'https://teamcipl.greythr.com/v3/portal/ess/leave/holiday-calendar'; // URL for the holiday calendar

// Function to log in and get the holiday calendar
async function loginAndGetHolidayCalendar() {
    const browser = await puppeteer.launch({ headless: false }); // Set to true for production
    const page = await browser.newPage();
    let holidayCalendar = null; // Variable to hold holiday calendar information

    try {
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

        // Wait for the username input to be available
        await page.waitForSelector('input[name="username"]', { timeout: 20000 });
        await page.type('input[name="username"]', process.env.MY_USERNAME);

        // Wait for the password input to be available
        await page.waitForSelector('input[name="password"]', { timeout: 20000 });
        await page.type('input[name="password"]', process.env.MY_PASSWORD);

        // Submit the form
        await page.click('button[type="submit"]'); // Use the correct button selector here
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        console.log("Logged in successfully at " + new Date().toLocaleTimeString());

        // Navigate to the holiday calendar page
        await page.goto(HOLIDAY_CALENDAR_URL, { waitUntil: 'networkidle2' });

        // Wait for the calendar element to be available
        await page.waitForSelector('.calendar-class', { timeout: 20000 }); // Adjust the selector to match your holiday calendar element
        holidayCalendar = await page.$eval('.calendar-class', el => el.innerHTML); // Extract the HTML content of the calendar

        console.log("Holiday calendar retrieved.");
        return holidayCalendar; // Return the holiday calendar information
    } catch (error) {
        console.error('Login or holiday calendar retrieval failed:', error);
        return null;
    } finally {
        await browser.close();
    }
}

// Define the holiday calendar retrieval endpoint
app.post('/holiday-calendar', async (req, res) => {
    console.log("Attempting to log in and retrieve holiday calendar...");
    const holidayCalendar = await loginAndGetHolidayCalendar();
    if (holidayCalendar) {
        res.send({ message: "Login successful", holidayCalendar: holidayCalendar });
    } else {
        res.send({ message: "Login failed or holiday calendar not retrieved" });
    }
});

// Schedule login and retrieval of the holiday calendar at 2:47 PM
schedule.scheduleJob('38 15 * * *', async () => { // 2:47 PM in 24-hour format
    console.log("Automated login attempt at 2:47 PM...");
    const holidayCalendar = await loginAndGetHolidayCalendar();
    if (holidayCalendar) {
        console.log("Holiday calendar retrieved automatically at 2:47 PM.");
    } else {
        console.log("Failed to retrieve holiday calendar at 2:47 PM.");
    }
});

// Define the logout function (if needed)
async function logout() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(LOGOUT_URL, { waitUntil: 'networkidle2' });
        console.log("Logged out successfully at " + new Date().toLocaleTimeString());
    } catch (error) {
        console.error('Logout failed:', error);
    } finally {
        await browser.close();
    }
}
