const { Groq } = require("groq-sdk");
const BaseService = require('./base.service');

class AIService extends BaseService {
  constructor() {
    super();
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.cache = new Map();
  }

  /**
   * @param {string} prompt
   * @param {string} systemPrompt
   * @returns {Promise<string>}
   */
  async generateResponse(prompt, systemPrompt) {
    try {
      const cacheKey = `${prompt}_${systemPrompt}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const completion = await this.groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `${systemPrompt}
            Important: Never include translations or English text in parentheses.
            Respond naturally in Bahasa Indonesia only.` 
          },
          { role: "user", content: prompt }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 512,
        stream: false
      });

      const response = completion.choices[0]?.message?.content;
      this.cache.set(cacheKey, response);
      
      return response;
    } catch (error) {
      throw this.handleError(error, 'AI Service');
    }
  }
}

module.exports = AIService; 