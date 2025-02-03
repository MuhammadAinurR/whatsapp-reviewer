const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { Groq } = require("groq-sdk");
const dotenv = require('dotenv');
const qrcode = require('qrcode-terminal');

// Load environment variables
dotenv.config();

// ================ CONFIGURATIONS ================

const INTERVIEW_CONFIG = {
  timeoutMinutes: 30,
  minScoreToPass: 6,
  stages: ['initial', 'technical', 'hr']
};

const AGENT_CONFIG = {
  recruiter: {
    name: "Recruiter Sarah",
    role: "HR Recruiter",
    systemPrompt: `You are Sarah, a friendly and professional HR recruiter for Worldcoin.
    Your goal is to make candidates comfortable while evaluating their potential.
    Communicate in Bahasa Indonesia with a warm, encouraging tone.`
  },
  technicalExpert: {
    name: "Tech Expert Budi",
    role: "Technical Specialist",
    systemPrompt: `You are Budi, a technical expert for Worldcoin operations.
    Evaluate understanding of Worldcoin, World ID, and Orb technology.
    Communicate clearly in Bahasa Indonesia.`
  },
  hrSpecialist: {
    name: "CS Expert Nina",
    role: "HR Specialist",
    systemPrompt: `You are Nina, focusing on soft skills and cultural fit.
    Evaluate communication skills and service orientation.
    Maintain a professional yet friendly tone in Bahasa Indonesia.`
  }
};

const INTERVIEW_STAGES = {
  initial: {
    questions: [
      "Apakah Anda memiliki pengalaman sebelumnya sebagai sales promoter atau di bidang hospitality?",
      "Apakah Anda bersedia bekerja dalam shift 12 jam?",
      "Bagaimana Anda menangani situasi ketika harus menjelaskan konsep yang kompleks kepada pelanggan?"
    ],
    agent: 'recruiter'
  },
  technical: {
    questions: [
      "Apa yang Anda ketahui tentang Worldcoin dan tujuannya?",
      "Bagaimana Anda akan menjelaskan konsep World ID kepada pengguna yang awam dengan teknologi?",
      "Apa yang Anda ketahui tentang proses verifikasi menggunakan Orb?"
    ],
    agent: 'technicalExpert'
  },
  hr: {
    questions: [
      "Bagaimana Anda menangani situasi ketika ada pelanggan yang tidak sabar?",
      "Ceritakan pengalaman Anda bekerja dalam tim dan bagaimana Anda berkontribusi?",
      "Bagaimana Anda menjaga semangat dan energi positif selama shift kerja yang panjang?"
    ],
    agent: 'hrSpecialist'
  }
};

// Add company profile configuration
const COMPANY_PROFILE = {
  industry: "Technology & Digital Identity Services",
  headquarters: "South Tangerang, Banten, Indonesia",
  overview: `Koru Indonesia is a technology-driven company specializing in digital identity verification and operational management. We collaborate with global technology projects to provide seamless onboarding experiences for users. Currently, we are partnering with the Worldcoin Project to facilitate user verification at designated activation sites across Indonesia.`,
  mission: `We aim to revolutionize digital identity verification by delivering secure, efficient, and user-friendly solutions. Our commitment is to provide top-tier operational excellence while ensuring an inclusive and accessible experience for all users.`,
  services: [
    "Operational Management: We manage and oversee Worldcoin verification centers, ensuring smooth daily operations.",
    "User Onboarding: We facilitate the identity verification process, helping users understand and participate in the Worldcoin ecosystem.",
    "Team Development: We train and empower our team members to deliver high-quality customer service and technical support."
  ],
  benefits: [
    "Competitive salary with KPI-based performance bonuses",
    "A dynamic work environment with career growth opportunities",
    "Hands-on experience with cutting-edge technology in digital identity verification",
    "A friendly and professional team committed to excellence"
  ],
  locations: {
    bintaro: {
      name: "World: Pusat Verifikasi (Bintaro)",
      address: "12 Rengas Raya Street, RT.05/RW.09, Rengas, East Ciputat, South Tangerang, Banten 15412, Indonesia",
      maps: "https://maps.app.goo.gl/gNSEdv8nvALKCeEd8"
    },
    gadingSerpong: {
      name: "World: Pusat Verifikasi (Gading Serpong)",
      address: "M9-10 Madison Grande, Boulevard Diponegoro Street, Gading, Serpong, Tangerang, Banten 15334, Indonesia",
      maps: "https://maps.app.goo.gl/yourMapLink"
    }
  }
};

// ================ AI SERVICE ================

class AIService {
  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.cache = new Map(); // Add response caching
  }

  async generateResponse(prompt, systemPrompt) {
    try {
      // Create cache key
      const cacheKey = `${prompt}_${systemPrompt}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 512, // Reduced from 1024 for faster response
        stream: false    // Ensure streaming is off for faster complete response
      });

      const response = completion.choices[0]?.message?.content;
      
      // Cache the response
      this.cache.set(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new Error('Failed to generate AI response');
    }
  }
}

// ================ INTERVIEW SERVICE ================

class InterviewService {
  constructor() {
    this.sessions = new Map();
    this.aiService = new AIService();
    this.questionCollector = new Map(); // Store questions for each user
    this.collectorTimers = new Map();   // Store timers for each user
  }

  async startInterview(userId) {
    const session = this.createSession(userId);
    return await this.generateWelcomeMessage(session);
  }

  async handleResponse(userId, message) {
    const session = this.getSession(userId);
    if (!session) return null;

    if (this.isSessionExpired(session)) {
      this.endSession(userId);
      return "Sesi interview telah berakhir karena timeout. Silakan mulai ulang.";
    }

    return await this.processResponse(session, message);
  }

  createSession(userId) {
    const session = {
      userId,
      stage: 'initial',
      currentQuestion: 0,
      scores: [],
      startTime: Date.now(),
      lastInteraction: Date.now()
    };
    this.sessions.set(userId, session);
    return session;
  }

  async processResponse(session, message) {
    try {
      if (session.inQASection) {
        return await this.collectAndAnswerQuestions(session, message);
      }

      // Regular interview flow
      if (message.toLowerCase() === 'siap' && session.currentQuestion === 0) {
        return await this.getNextQuestion(session);
      }

      const evaluation = await this.evaluateResponse(session, message);
      session.scores.push(evaluation);

      if (this.isStageComplete(session)) {
        return await this.handleStageTransition(session);
      }

      session.currentQuestion++;
      return await this.getNextQuestion(session);

    } catch (error) {
      console.error("Process Response Error:", error);
      return "Maaf, terjadi kesalahan. Silakan coba lagi.";
    }
  }

  async _processResponse(session, message) {
    if (message.toLowerCase() === 'siap' && session.currentQuestion === 0) {
      return await this.getNextQuestion(session);
    }

    const evaluation = await this.evaluateResponse(session, message);
    session.scores.push(evaluation);

    if (this.isStageComplete(session)) {
      return await this.handleStageTransition(session);
    }

    session.currentQuestion++;
    return await this.getNextQuestion(session);
  }

  async evaluateResponse(session, message) {
    const currentStage = INTERVIEW_STAGES[session.stage];
    const agent = AGENT_CONFIG[currentStage.agent];
    const question = currentStage.questions[session.currentQuestion];

    // Optimize prompt to be more concise
    const evaluation = await this.aiService.generateResponse(
      `Q: ${question}\nA: "${message}"\nRate 1-10 & brief feedback.`,
      agent.systemPrompt
    );

    return this.parseEvaluation(evaluation);
  }

  async handleStageTransition(session) {
    const currentStageIndex = INTERVIEW_CONFIG.stages.indexOf(session.stage);
    
    // Add Q&A section between stages
    if (currentStageIndex < INTERVIEW_CONFIG.stages.length - 1) {
      await this.handleQASection(session);
    }
    
    if (currentStageIndex === INTERVIEW_CONFIG.stages.length - 1) {
      return await this.concludeInterview(session);
    }

    session.stage = INTERVIEW_CONFIG.stages[currentStageIndex + 1];
    session.currentQuestion = 0;
    
    return `Bagus! Mari kita lanjut ke tahap ${session.stage}.
            ${INTERVIEW_STAGES[session.stage].questions[0]}`;
  }

  async handleQASection(session) {
    session.inQASection = true;
    // Clear any existing questions for this user
    this.questionCollector.set(session.userId, []);
    
    return `Sebelum kita lanjut ke tahap berikutnya, apakah ada yang ingin Anda tanyakan? 🤔

Anda bisa bertanya tentang:
• Perusahaan dan budaya kerja
• Detail pekerjaan dan tanggung jawab
• Benefit dan pengembangan karir
• Lokasi dan jadwal kerja

Silakan ajukan pertanyaan Anda, atau ketik "LANJUT" jika tidak ada pertanyaan.
(Saya akan mengumpulkan semua pertanyaan Anda dalam 20 detik) ⏳`;
  }

  async collectAndAnswerQuestions(session, msg) {
    const userId = session.userId;
    
    // If it's "LANJUT", clear collection and proceed
    if (msg.toLowerCase() === 'lanjut') {
      this.clearQuestionCollection(userId);
      session.inQASection = false;
      session.stage = INTERVIEW_CONFIG.stages[
        INTERVIEW_CONFIG.stages.indexOf(session.stage) + 1
      ];
      session.currentQuestion = 0;
      return INTERVIEW_STAGES[session.stage].questions[0];
    }

    // Collect the question
    let questions = this.questionCollector.get(userId) || [];
    questions.push(msg);
    this.questionCollector.set(userId, questions);

    // Clear existing timer if any
    if (this.collectorTimers.has(userId)) {
      clearTimeout(this.collectorTimers.get(userId));
    }

    // Set new timer
    const timer = setTimeout(async () => {
      const collectedQuestions = this.questionCollector.get(userId);
      if (collectedQuestions && collectedQuestions.length > 0) {
        const response = await this.generateBatchAnswers(collectedQuestions);
        // Send response through WhatsApp
        const client = this.getWhatsAppClient(); // You'll need to implement this
        await client.sendMessage(userId, response);
        
        // Clear the collection
        this.clearQuestionCollection(userId);
      }
    }, 20000); // 20 seconds

    this.collectorTimers.set(userId, timer);

    // Return null to prevent immediate response
    return null;
  }

  async generateBatchAnswers(questions) {
    try {
      const questionsText = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
      
      const prompt = `As a friendly HR representative, answer these candidate questions about our company:

Questions:
${questionsText}

Company Information:
${JSON.stringify(COMPANY_PROFILE)}

Please format your response in Bahasa Indonesia with:
1. A brief acknowledgment of their questions
2. Numbered answers corresponding to each question
3. For salary/personal questions, respond politely that HR will discuss in detail later
4. End with an invitation for more questions

Keep the tone friendly and professional.`;

      const response = await this.aiService.generateResponse(
        prompt,
        AGENT_CONFIG.recruiter.systemPrompt
      );

      return response + "\n\nAda pertanyaan lain? Atau ketik *LANJUT* untuk melanjutkan interview.";
    } catch (error) {
      console.error("Batch QA Response Error:", error);
      return "Maaf, terjadi kesalahan. Mari kita lanjutkan dengan interview. Ketik *LANJUT*.";
    }
  }

  clearQuestionCollection(userId) {
    this.questionCollector.delete(userId);
    if (this.collectorTimers.has(userId)) {
      clearTimeout(this.collectorTimers.get(userId));
      this.collectorTimers.delete(userId);
    }
  }

  async concludeInterview(session) {
    const averageScore = this.calculateFinalScore(session);
    const result = this.determineResult(averageScore);
    
    this.endSession(session.userId);
    
    return this.generateFinalMessage(averageScore, result);
  }

  async generateWelcomeMessage(session) {
    const welcomeMessage = `Selamat datang di proses interview Worldcoin! 👋

*Posisi: Operation Staff - Worldcoin Project*

Proses interview akan terdiri dari 3 tahap:
1. Screening Awal
2. Pengetahuan Teknis
3. Soft Skills & Customer Service

*Informasi Penting:*
• Interview berlangsung sekitar 15-20 menit
• Total 9 pertanyaan (3 per tahap)
• Jawablah dengan jelas dan detail
• Gunakan Bahasa Indonesia

*Tips Interview:*
✨ Berikan contoh pengalaman nyata
✨ Jelaskan dengan detail namun ringkas
✨ Tanyakan jika ada yang kurang jelas

Ketik *SIAP* untuk memulai interview.`;

    return welcomeMessage;
  }

  async getNextQuestion(session) {
    const currentStage = INTERVIEW_STAGES[session.stage];
    return currentStage.questions[session.currentQuestion];
  }

  parseEvaluation(evaluation) {
    // Simplified parsing for faster processing
    const scoreMatch = evaluation.match(/\d+/);
    const score = scoreMatch ? parseInt(scoreMatch[0]) : 5;
    
    return {
      score,
      feedback: evaluation.replace(/\d+/, '').trim()
    };
  }

  // ================ HELPER METHODS ================

  isSessionExpired(session) {
    const timeoutMs = INTERVIEW_CONFIG.timeoutMinutes * 60 * 1000;
    return Date.now() - session.lastInteraction > timeoutMs;
  }

  isStageComplete(session) {
    return session.currentQuestion >= INTERVIEW_STAGES[session.stage].questions.length - 1;
  }

  calculateFinalScore(session) {
    const sum = session.scores.reduce((acc, score) => acc + score.score, 0);
    return sum / session.scores.length;
  }

  determineResult(averageScore) {
    if (averageScore >= 8) return "Sangat Baik";
    if (averageScore >= 6) return "Baik";
    return "Perlu Improvement";
  }

  generateFinalMessage(score, result) {
    return `
🎉 Interview Selesai!

Hasil evaluasi Anda:
📊 Nilai Rata-rata: ${score.toFixed(1)}/10
✨ Hasil: ${result}

${score >= INTERVIEW_CONFIG.minScoreToPass ? 
  "Selamat! Tim HR kami akan menghubungi Anda dalam 2-3 hari kerja." : 
  "Terima kasih atas partisipasi Anda. Sayangnya, kualifikasi belum sesuai."}

Semoga sukses! 🌟`;
  }

  endSession(userId) {
    this.sessions.delete(userId);
  }

  getSession(userId) {
    return this.sessions.get(userId);
  }

  getWhatsAppClient() {
    return client; // Assuming 'client' is your WhatsApp client instance
  }
}

// ================ APPLICATION SETUP ================

const app = express();
const port = 3000;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

const interviewService = new InterviewService();

// ================ WHATSAPP EVENT HANDLERS ================

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp bot is ready!');
});

client.on('message', async msg => {
  const TIMEOUT = 30000; // 30 seconds timeout
  
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), TIMEOUT);
    });

    const messagePromise = (async () => {
      if (msg.body.toLowerCase().includes('operation staff - worldcoin project') && 
          msg.body.toLowerCase().includes('tertarik')) {
        const welcome = await interviewService.startInterview(msg.from);
        await msg.reply(welcome);
        return;
      }

      if (interviewService.getSession(msg.from)) {
        const response = await interviewService.handleResponse(msg.from, msg.body);
        if (response) await msg.reply(response);
        return;
      }
    })();

    await Promise.race([messagePromise, timeoutPromise]);

  } catch (error) {
    if (error.message === 'Request timeout') {
      await msg.reply("Maaf, respons membutuhkan waktu lebih lama dari biasanya. Silakan coba lagi.");
    } else {
      console.error('Message Handler Error:', error);
      await msg.reply("Maaf, terjadi kesalahan. Silakan coba beberapa saat lagi.");
    }
  }
});

// ================ ERROR HANDLERS ================

client.on('error', error => {
  console.error('WhatsApp Client Error:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// ================ START APPLICATION ================

app.get("/", (req, res) => {
  res.send("WhatsApp Interview Bot is running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

client.initialize();
