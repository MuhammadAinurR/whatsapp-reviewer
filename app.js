const express = require("express");
const app = express();
const port = 3000;

// wa bot service
const { Client, LocalAuth } = require("whatsapp-web.js");
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
    }
});
const qrcode = require('qrcode-terminal');

client.on('qr', (qr) => {
  // Generate and display QR code in terminal
  qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', msg => {
  console.log(msg)
  if (msg.body == '!ping') {
      msg.reply('pong');
  }

  // Check if message contains love-related words
  if (msg.body.toLowerCase().includes('love')) {
    msg.reply('love you too');
  }

  // Greetings in Indonesian
  if (msg.body.toLowerCase().includes('pagi')) {
    msg.reply('Selamat pagi! Semoga harimu menyenangkan 😊');
  }
  
  if (msg.body.toLowerCase().includes('malam')) {
    msg.reply('Selamat malam! Jangan lupa istirahat ya 😴');
  }

  // Common questions
  if (msg.body.toLowerCase().includes('lagi apa')) {
    msg.reply('Lagi nungguin chat dari kamu nih 😉');
  }

  if (msg.body.toLowerCase().includes('udah makan')) {
    msg.reply('Belum nih, kamu udah makan belum? Jangan lupa makan ya! 🍴');
  }

  // Fun commands
  if (msg.body === '!sticker') {
    msg.reply('Kirim gambar dengan caption !sticker untuk membuat sticker');
  }

  if (msg.body.toLowerCase().includes('galau')) {
    msg.reply('Jangan galau dong, aku ada disini buat kamu 🤗');
  }

  // Random responses
  if (msg.body.toLowerCase().includes('bosen')) {
    const responses = [
      'Main game yuk!',
      'Mau dengerin musik bareng?',
      'Gimana kalo kita ngobrol aja?',
      'Coba baca buku deh, seru lho!'
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    msg.reply(randomResponse);
  }

  // Mini Games Section
  if (msg.body === '!games') {
    msg.reply(`*Mini Games Menu* 🎮
1. !tebakangka - Tebak angka 1-10
2. !suit - Main suit (batu/gunting/kertas)
3. !truth - Random truth question
4. !dare - Random dare challenge`);
  }

  // Tebak Angka Game
  if (msg.body === '!tebakangka') {
    const correctNumber = Math.floor(Math.random() * 10) + 1;
    global.gameSession = {
      type: 'tebakangka',
      answer: correctNumber,
      attempts: 3,
      player: msg.from
    };
    msg.reply('Aku udah pilih angka 1-10 nih. Coba tebak ya! Kamu punya 3 kesempatan 🎲');
  }

  // Handle tebak angka gameplay
  if (global.gameSession && global.gameSession.type === 'tebakangka' && global.gameSession.player === msg.from) {
    const guess = parseInt(msg.body);
    if (!isNaN(guess)) {
      if (guess === global.gameSession.answer) {
        msg.reply('🎉 Yeay! Kamu berhasil nebak! Kamu memang yang terbaik! 💝');
        global.gameSession = null;
      } else {
        global.gameSession.attempts--;
        if (global.gameSession.attempts > 0) {
          const hint = guess > global.gameSession.answer ? 'Terlalu besar' : 'Terlalu kecil';
          msg.reply(`${hint}! Sisa kesempatan: ${global.gameSession.attempts} 🎯`);
        } else {
          msg.reply(`Game Over! Jawabannya adalah ${global.gameSession.answer} 😅`);
          global.gameSession = null;
        }
      }
    }
  }

  // Suit Game
  if (msg.body === '!suit') {
    msg.reply('Ayo main suit! Pilih salah satu: batu, gunting, atau kertas 👊✌️🖐️');
    global.gameSession = {
      type: 'suit',
      player: msg.from
    };
  }

  // Handle suit gameplay
  if (global.gameSession && global.gameSession.type === 'suit' && global.gameSession.player === msg.from) {
    const choices = ['batu', 'gunting', 'kertas'];
    const playerChoice = msg.body.toLowerCase();
    if (choices.includes(playerChoice)) {
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      let result;
      
      if (playerChoice === botChoice) {
        result = 'Seri!';
      } else if (
        (playerChoice === 'batu' && botChoice === 'gunting') ||
        (playerChoice === 'gunting' && botChoice === 'kertas') ||
        (playerChoice === 'kertas' && botChoice === 'batu')
      ) {
        result = 'Kamu menang! 🎉';
      } else {
        result = 'Aku menang! 😎';
      }
      
      msg.reply(`Kamu: ${playerChoice}\nAku: ${botChoice}\n\n${result}`);
      global.gameSession = null;
    }
  }

  // Truth or Dare - Truth
  if (msg.body === '!truth') {
    const truthQuestions = [
      'Apa mimpi terindah yang pernah kamu alami? 💭',
      'Hal apa yang paling kamu takutkan? 😱',
      'Moment paling memalukan dalam hidupmu? 🙈',
      'Siapa first love kamu? 💕',
      'Kapan terakhir kali kamu nangis? 😢',
      'Apa yang bikin kamu suka sama aku? 🥰',
      'Ceritain dong pengalaman paling lucu sama aku! 😆'
    ];
    const randomTruth = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
    msg.reply(randomTruth);
  }

  // Truth or Dare - Dare
  if (msg.body === '!dare') {
    const dareActions = [
      'Kirim foto kamu sekarang! 📸',
      'Voice note nyanyi lagu favorit kamu! 🎤',
      'Ceritain jokes paling lucu yang kamu tau! 😆',
      'Kirim screenshot chat pertama kita! 💌',
      'Upload status tentang aku! 💝',
      'Voice note bilang "I love you"! 💕',
      'Kirim foto kita berdua yang paling favorit! 🥰'
    ];
    const randomDare = dareActions[Math.floor(Math.random() * dareActions.length)];
    msg.reply(randomDare);
  }
}); 

client.initialize();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
