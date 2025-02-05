const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const BaseService = require('./base.service');

class CalendarService extends BaseService {
  constructor() {
    super();
    // Check if required env variables exist
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.warn('Google Calendar credentials not found, calendar features will be disabled');
      this.enabled = false;
      return;
    }

    this.enabled = true;
    this.auth = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    
    this.auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    
    this.calendar = google.calendar({ 
      version: 'v3', 
      auth: this.auth 
    });
  }

  /**
   * @param {string} candidateEmail
   * @param {string} candidateName
   * @returns {Promise<string>}
   */
  async scheduleInterview(candidateEmail, candidateName) {
    try {
      if (!this.enabled) {
        throw new Error('Calendar service is not configured');
      }

      const interviewDate = this.getNextAvailableSlot();
      
      const event = {
        summary: `HR Interview - ${candidateName}`,
        description: 'Follow-up interview with HR team',
        start: {
          dateTime: interviewDate,
          timeZone: 'Asia/Jakarta',
        },
        end: {
          dateTime: new Date(interviewDate.getTime() + 60 * 60 * 1000),
          timeZone: 'Asia/Jakarta',
        },
        attendees: [
          { email: candidateEmail },
          { email: process.env.HR_EMAIL }
        ],
        conferenceData: {
          createRequest: {
            requestId: `interview-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all'
      });

      return response.data.htmlLink;
    } catch (error) {
      throw this.handleError(error, 'Calendar Service');
    }
  }

  /**
   * @private
   * @returns {Date}
   */
  getNextAvailableSlot() {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Next day
    date.setHours(10, 0, 0, 0); // 10 AM
    
    // Ensure it's a business day
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }
    
    return date;
  }
}

module.exports = CalendarService; 