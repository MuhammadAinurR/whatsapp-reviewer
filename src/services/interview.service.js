const { INTERVIEW_CONFIG, AGENTS, STAGES } = require('../config/interview');
const { COMPANY } = require('../config/constants');
const BaseService = require('./base.service');
const AIService = require('./ai.service');
const CalendarService = require('./calendar.service');
const InterviewSession = require('../models/interview-session.model');

class InterviewService extends BaseService {
  constructor() {
    super();
    this.sessions = new Map();
    this.questionCollector = new Map();
    this.collectorTimers = new Map();
    this.aiService = new AIService();
    this.calendarService = new CalendarService();
  }

  /**
   * @param {string} userId
   * @returns {Promise<string>}
   */
  async startInterview(userId) {
    try {
      const session = new InterviewSession(userId);
      this.sessions.set(userId, session);
      return await this.generateWelcomeMessage();
    } catch (error) {
      throw this.handleError(error, 'Start Interview');
    }
  }

  async generateWelcomeMessage() {
    return `Selamat datang di proses interview Worldcoin! 👋

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

Sebelum kita mulai, mohon berikan alamat email Anda untuk keperluan komunikasi lebih lanjut:`;
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

  /**
   * @private
   * @param {InterviewSession} session
   * @param {string} message
   * @returns {Promise<string>}
   */
  async processResponse(session, message) {
    try {
      session.updateLastInteraction();

      // Registration flow
      if (!session.candidateEmail) {
        if (this.isValidEmail(message)) {
          session.candidateEmail = message;
          return "Terima kasih. Mohon berikan nama lengkap Anda:";
        } else {
          return "Mohon masukkan alamat email yang valid (contoh: nama@email.com)";
        }
      }
      
      if (!session.candidateName) {
        session.candidateName = message;
        session.stage = 'initial';
        return STAGES.initial.questions[0];
      }

      // Interview flow
      if (session.followUpPending) {
        const evaluation = await this.evaluateResponse(session, message, true);
        session.scores.push(evaluation);
        session.followUpPending = false;

        if (this.isStageComplete(session)) {
          return await this.handleStageTransition(session);
        } else {
          session.currentQuestion++;
          return await this.getNextQuestion(session);
        }
      }

      if (session.inQASection) {
        if (message.toLowerCase() === 'lanjut') {
          return await this.handleStageTransition(session);
        }
        return await this.collectAndAnswerQuestions(session, message);
      }

      const evaluation = await this.evaluateResponse(session, message);
      session.scores.push(evaluation);

      const followUpQuestion = await this.generateFollowUpQuestion(session, message);
      session.followUpPending = true;
      return followUpQuestion;

    } catch (error) {
      throw this.handleError(error, 'Process Response');
    }
  }

  async generateFollowUpQuestion(session, response) {
    const currentStage = STAGES[session.stage];
    const agent = AGENTS[currentStage.agent];
    const mainQuestion = currentStage.questions[session.currentQuestion];

    const prompt = `You are having a natural conversation in Bahasa Indonesia with a job candidate. Based on their response: "${response}" to the question "${mainQuestion}", ask a natural follow-up question.

Rules:
1. Respond as if you're having a casual conversation
2. No quotation marks
3. No translations
4. No meta-text or explanations
5. Keep it brief and friendly
6. Use casual Indonesian conversational style

Just write the follow-up question directly, nothing else.`;

    const followUpQuestion = await this.aiService.generateResponse(
      prompt,
      agent.systemPrompt
    );

    return followUpQuestion.replace(/["'"]/g, '');
  }

  async evaluateResponse(session, message, isFollowUp = false) {
    const currentStage = STAGES[session.stage];
    const agent = AGENTS[currentStage.agent];
    const question = isFollowUp ? 
      "Follow-up question" : 
      currentStage.questions[session.currentQuestion];

    const prompt = isFollowUp ?
      `This is a follow-up response. Rate 1-10 & give brief feedback on how well they elaborated their previous answer: "${message}"` :
      `Q: ${question}\nA: "${message}"\nRate 1-10 & brief feedback.`;

    const evaluation = await this.aiService.generateResponse(
      prompt,
      agent.systemPrompt
    );

    return this.parseEvaluation(evaluation);
  }

  async handleStageTransition(session) {
    const currentStageIndex = INTERVIEW_CONFIG.stages.indexOf(session.stage);
    
    if (currentStageIndex < INTERVIEW_CONFIG.stages.length - 1) {
      if (!session.inQASection) {
        session.inQASection = true;
        return INTERVIEW_CONFIG.messages.askQuestions;
      } else if (session.inQASection) {
        session.inQASection = false;
        session.stage = INTERVIEW_CONFIG.stages[currentStageIndex + 1];
        session.currentQuestion = 0;
        return await this.getNextQuestion(session);
      }
    }
    
    if (currentStageIndex === INTERVIEW_CONFIG.stages.length - 1) {
      return await this.concludeInterview(session);
    }
  }

  async collectAndAnswerQuestions(session, msg) {
    const userId = session.userId;

    if (msg.toLowerCase() === 'lanjut') {
      this.clearQuestionCollection(userId);
      session.inQASection = false;
      session.stage = STAGES[
        INTERVIEW_CONFIG.stages.indexOf(session.stage) + 1
      ];
      session.currentQuestion = 0;
      return STAGES[session.stage].questions[0];
    }

    let questions = this.questionCollector.get(userId) || [];
    questions.push(msg);
    this.questionCollector.set(userId, questions);

    if (this.collectorTimers.has(userId)) {
      clearTimeout(this.collectorTimers.get(userId));
    }

    const timer = setTimeout(async () => {
      const collectedQuestions = this.questionCollector.get(userId);
      if (collectedQuestions && collectedQuestions.length > 0) {
        const response = await this.generateBatchAnswers(collectedQuestions);
        await global.whatsappClient.sendMessage(userId, response);
        this.clearQuestionCollection(userId);
      }
    }, 20000);

    this.collectorTimers.set(userId, timer);
    return null;
  }

  async generateBatchAnswers(questions) {
    try {
      const questionsText = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
      
      const prompt = `As a friendly HR representative having a natural conversation, answer these candidate questions about our company:

Questions:
${questionsText}

Company Information:
${JSON.stringify(COMPANY)}

Please format your response in Bahasa Indonesia:
1. Start with a warm, natural greeting
2. Answer each question conversationally
3. For salary/personal questions, politely defer to HR discussion
4. Keep the tone friendly and casual, like chatting with a friend
5. End naturally, inviting more questions or to continue

Important: Make it sound like a natural conversation, not a formal response.`;

      const response = await this.aiService.generateResponse(
        prompt,
        AGENTS.recruiter.systemPrompt
      );

      return `${response}

Ketik *LANJUT* untuk melanjutkan interview, atau tanyakan hal lain yang ingin kamu ketahui 😊`;
    } catch (error) {
      console.error("Batch QA Response Error:", error);
      return "Mohon maaf, ada kendala teknis. Ketik *LANJUT* untuk melanjutkan interview.";
    }
  }

  async concludeInterview(session) {
    const averageScore = this.calculateFinalScore(session);
    const result = this.determineResult(averageScore);
    
    this.endSession(session.userId);
    
    return this.generateFinalMessage(averageScore, result, session.candidateEmail, session.candidateName);
  }

  async generateFinalMessage(score, result, candidateEmail, candidateName) {
    if (score >= INTERVIEW_CONFIG.minScoreToPass) {
      try {
        const meetingLink = await this.calendarService.scheduleInterview(
          candidateEmail, 
          candidateName
        );

        return `🎉 Interview Selesai!

Hasil evaluasi Anda:
📊 Nilai Rata-rata: ${score.toFixed(1)}/10
✨ Hasil: ${result}

Selamat! Anda telah lolos tahap awal.
Jadwal interview lanjutan dengan tim HR telah dikirim ke email ${candidateEmail}
Link Meeting: ${meetingLink}

Sampai bertemu! 🌟`;

      } catch (error) {
        console.error('Failed to schedule interview:', error);
        return `🎉 Interview Selesai!

Hasil evaluasi Anda:
📊 Nilai Rata-rata: ${score.toFixed(1)}/10
✨ Hasil: ${result}

Selamat! Tim HR kami akan menghubungi Anda dalam 2-3 hari kerja untuk interview lanjutan.

Semoga sukses! 🌟`;
      }
    }

    return `🎉 Interview Selesai!

Hasil evaluasi Anda:
📊 Nilai Rata-rata: ${score.toFixed(1)}/10
✨ Hasil: ${result}

Terima kasih atas partisipasi Anda. Sayangnya, kualifikasi belum sesuai.

Semoga sukses! 🌟`;
  }

  // Helper methods
  parseEvaluation(evaluation) {
    const scoreMatch = evaluation.match(/\d+/);
    const score = scoreMatch ? parseInt(scoreMatch[0]) : 5;
    return {
      score,
      feedback: evaluation.replace(/\d+/, '').trim()
    };
  }

  isSessionExpired(session) {
    const timeoutMs = INTERVIEW_CONFIG.timeoutMinutes * 60 * 1000;
    return Date.now() - session.lastInteraction > timeoutMs;
  }

  isStageComplete(session) {
    return session.currentQuestion >= STAGES[session.stage].questions.length - 1;
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

  clearQuestionCollection(userId) {
    this.questionCollector.delete(userId);
    if (this.collectorTimers.has(userId)) {
      clearTimeout(this.collectorTimers.get(userId));
      this.collectorTimers.delete(userId);
    }
  }

  async getNextQuestion(session) {
    const currentStage = STAGES[session.stage];
    return currentStage.questions[session.currentQuestion];
  }

  endSession(userId) {
    this.sessions.delete(userId);
  }

  getSession(userId) {
    return this.sessions.get(userId);
  }

  /**
   * @private
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = InterviewService; 