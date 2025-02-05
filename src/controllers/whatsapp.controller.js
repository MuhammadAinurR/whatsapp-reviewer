class WhatsAppController {
  constructor() {
    this.healthCheck = this.healthCheck.bind(this);
  }

  healthCheck(req, res) {
    res.send("WhatsApp Interview Bot is running");
  }
}

module.exports = new WhatsAppController(); 