# 🤖 WhatsApp AI Interview Bot

<p align="center">
  <img src="docs/banner.png" alt="WhatsApp Interview Bot Banner" width="800"/>
</p>
<p align="center">
  <em>Transform your recruitment process with AI-powered WhatsApp interviews</em>
</p>

---

<p align="center">
  <a href="#features"><strong>Features</strong></a> •
  <a href="#quick-start"><strong>Quick Start</strong></a> •
  <a href="#usage"><strong>Usage</strong></a> •
  <a href="#configuration"><strong>Configuration</strong></a> •
  <a href="#architecture"><strong>Architecture</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen" alt="Node.js Version"/>
  <img src="https://img.shields.io/badge/WhatsApp-Ready-25D366?logo=whatsapp&logoColor=white" alt="WhatsApp Ready"/>
  <img src="https://img.shields.io/badge/AI-Powered-FF6B6B" alt="AI Powered"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License"/>
</p>

---

## 🌟 Overview

Transform your recruitment process with our AI-powered WhatsApp Interview Bot. Conduct initial screenings, technical assessments, and HR interviews automatically through WhatsApp, powered by advanced AI for natural conversations and intelligent candidate evaluation.

---

## ✨ Features

- 🤖 **Natural Conversations**: AI-powered chat that feels human and engaging.
- 🎯 **Multi-stage Interviews**: 
  - Initial screening
  - Technical assessment
  - HR interview
- 📊 **Smart Evaluation**: Real-time scoring and feedback.
- 📅 **Auto Scheduling**: Google Calendar integration for successful candidates.
- ⚡ **Quick Setup**: Up and running in minutes.
- 🔄 **Session Management**: Robust handling of multiple interviews.
- 🌐 **Bahasa Indonesia**: Fully supports Indonesian language.

---

## 🚀 Quick Start

### Prerequisites

Before you start, ensure you have the following:

- Node.js >= 16.0.0
- npm or yarn
- A WhatsApp account
- Groq AI API key
- Google Calendar API credentials (optional)

### Step-by-Step Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/whatsapp-interview-bot.git
   cd whatsapp-interview-bot
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   ```bash
   cp .env.example .env
   ```
   Edit your `.env` file with the following values:

   ```env
   GROQ_API_KEY=your_groq_api_key
   PORT=3000
   ```

   Optional (for Google Calendar integration):

   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REFRESH_TOKEN=your_google_refresh_token
   HR_EMAIL=hr@company.com
   ```

4. **Start the Application**

   ```bash
   npm start
   ```

5. **Connect WhatsApp**
   - Scan the QR code shown in the terminal with WhatsApp
   - Wait for the "WhatsApp bot is ready!" message

---

## 💡 Usage Guide

### Starting an Interview

To initiate an interview, candidates should send:

> **Hi, saya tertarik dengan posisi Operation Staff - Worldcoin Project**

### Interview Process Breakdown

1. **Registration Phase**
   - Collects email address
   - Requests candidate’s full name
   - Validates contact info

2. **Initial Screening**
   - Experience assessment
   - Availability check
   - Basic qualifications

3. **Technical Assessment**
   - Product knowledge evaluation
   - Process understanding
   - Technical capabilities

4. **HR Interview**
   - Soft skills evaluation
   - Cultural fit
   - Work style analysis

5. **Q&A Opportunities**
   - Interactions between stages for questions on:
     - Company overview
     - Role clarification

### Evaluation System

Candidates are scored on:

- **Response relevance** (1-10)
- **Communication clarity** (1-10)
- **Technical understanding** (1-10)
- **Overall fit** (1-10)

---

## ⚙️ Advanced Configuration

### Customizing Interview Stages

You can customize your interview stages by modifying the `interview.js` file:

```javascript
// src/config/interview.js
const STAGES = {
  initial: {
    questions: [
      "Apakah Anda memiliki pengalaman sebelumnya sebagai sales promoter?",
      "Apakah Anda bersedia bekerja dalam shift 12 jam?",
      // Add more questions
    ],
    agent: 'recruiter'
  },
  technical: {
    questions: [
      "Apa yang Anda ketahui tentang Worldcoin?",
      // Add more questions
    ],
    agent: 'technicalExpert'
  }
};
```

### AI Agent Personalities

Define your AI personality in the `agents.js` file:

```javascript
const AGENTS = {
  recruiter: {
    name: "Recruiter Sarah",
    role: "HR Recruiter",
    systemPrompt: "You are Sarah, a friendly and professional HR recruiter. Your goal is to make candidates comfortable while evaluating their potential. Communicate in Bahasa Indonesia with a warm, encouraging tone."
  }
};
```

### Company Information

Add your company’s details to the `company.js` file:

```javascript
const COMPANY = {
  industry: "Technology & Digital Identity Services",
  headquarters: "South Tangerang, Banten, Indonesia",
  overview: "Your company overview here",
  // Add more company details
};
```

---

## 🔧 Maintenance

### Session Management

The bot automatically manages interview sessions:

- 30-minute timeout for inactive sessions
- Automatic cleanup of expired sessions
- Robust error handling

### Error Handling

The bot handles common scenarios, such as:

- Network interruptions
- Invalid responses
- Timeout management
- API failures

### Monitoring

Monitor your bot's performance:

- Console logs for important events
- Error tracking
- Session statistics

---

## 🛡️ Security Best Practices

1. **Data Protection**
   - No permanent storage of candidate data
   - End-to-end encrypted WhatsApp messages
   - Secure credential management

2. **Session Security**
   - Memory-based session storage
   - Automatic session expiration
   - Secure state management

3. **API Security**
   - Rate limiting
   - Input validation
   - Secure environment variables

---

## 🔍 Troubleshooting

### Common Issues

1. **QR Code Scanning Failed**

   ```bash
   # Clear WhatsApp session
   rm -rf .wwebjs_auth
   # Restart the application
   npm start
   ```

2. **Bot Not Responding**
   - Check internet connection
   - Verify WhatsApp connection
   - Check API key validity

3. **Calendar Integration Issues**
   - Verify Google Calendar credentials
   - Check timezone settings
   - Validate email configurations

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the Repository**
2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Commit Changes**

   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

4. **Push to Branch**

   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open a Pull Request**

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [WhatsApp Web.js](https://wwebjs.dev/) for WhatsApp integration
- [Groq AI](https://groq.com/) for natural language processing
- [Google Calendar API](https://developers.google.com/calendar) for scheduling

---

<p align="center">
  Made by <a href="https://github.com/MuhammadAinurR">Rofiq</a>
  <br>
  <sub>Empowering better recruitment through technology</sub>
</p>
