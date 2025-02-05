const express = require("express");
const dotenv = require('dotenv');
const errorHandler = require('./middleware/error.middleware');
const routes = require('./routes');
const InterviewService = require('./services/interview.service');
const WhatsAppService = require('./services/whatsapp.service');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Initialize services
const interviewService = new InterviewService();
const whatsappService = new WhatsAppService(interviewService);

// Make WhatsApp client globally available
global.whatsappClient = whatsappService.getClient();

// Routes
app.use('/', routes);

// Error handling
app.use(errorHandler);

module.exports = { app, whatsappService }; 