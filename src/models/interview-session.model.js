const { INTERVIEW_CONFIG } = require('../config');

/**
 * @class InterviewSession
 * @description Represents an interview session with a candidate
 */
class InterviewSession {
  /**
   * @param {string} userId - The WhatsApp ID of the candidate
   */
  constructor(userId) {
    this.userId = userId;
    this.stage = 'initial';
    this.currentQuestion = 0;
    this.scores = [];
    this.startTime = Date.now();
    this.lastInteraction = Date.now();
    this.followUpPending = false;
    this.inQASection = false;
    this.candidateEmail = null;
    this.candidateName = null;
  }

  /**
   * Updates the last interaction timestamp
   */
  updateLastInteraction() {
    this.lastInteraction = Date.now();
  }

  /**
   * Checks if the session has expired
   * @returns {boolean}
   */
  isExpired() {
    const timeoutMs = INTERVIEW_CONFIG.timeoutMinutes * 60 * 1000;
    return Date.now() - this.lastInteraction > timeoutMs;
  }

  /**
   * Gets the current session duration in minutes
   * @returns {number}
   */
  getDuration() {
    return Math.floor((Date.now() - this.startTime) / (60 * 1000));
  }

  /**
   * Checks if the candidate has provided their basic information
   * @returns {boolean}
   */
  hasBasicInfo() {
    return this.candidateEmail !== null && this.candidateName !== null;
  }

  /**
   * Gets the candidate's full information
   * @returns {Object}
   */
  getCandidateInfo() {
    return {
      email: this.candidateEmail,
      name: this.candidateName,
      whatsappId: this.userId
    };
  }

  /**
   * Gets the current interview progress
   * @returns {Object}
   */
  getProgress() {
    return {
      stage: this.stage,
      questionNumber: this.currentQuestion + 1,
      scores: this.scores,
      duration: this.getDuration()
    };
  }
}

module.exports = InterviewSession; 