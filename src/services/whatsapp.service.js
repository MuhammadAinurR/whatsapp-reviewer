const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require('qrcode-terminal');
const BaseService = require('./base.service');

class WhatsAppService extends BaseService {
  constructor(interviewService) {
    super();
    this.interviewService = interviewService;
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: { headless: true }
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('WhatsApp bot is ready!');
    });

    this.client.on('message', async msg => {
      const TIMEOUT = 30000;
      
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), TIMEOUT);
        });

        const messagePromise = this.handleMessage(msg);
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

    this.client.on('error', error => {
      console.error('WhatsApp Client Error:', error);
    });
  }

  async handleMessage(msg) {
    if (msg.body.toLowerCase().includes('operation staff - worldcoin project') && 
        msg.body.toLowerCase().includes('tertarik')) {
      const welcome = await this.interviewService.startInterview(msg.from);
      await msg.reply(welcome);
      return;
    }

    if (this.interviewService.getSession(msg.from)) {
      const response = await this.interviewService.handleResponse(msg.from, msg.body);
      if (response) await msg.reply(response);
      return;
    }
  }

  initialize() {
    this.client.initialize();
  }

  getClient() {
    return this.client;
  }
}

module.exports = WhatsAppService; 