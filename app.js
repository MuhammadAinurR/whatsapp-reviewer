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
const { Groq } = require("groq-sdk");
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Add these at the top with your other requires
const interviewState = new Map();

// Interview crew configuration
const interviewCrew = {
  screener: {
    role: "Initial Screener",
    systemPrompt: "You are an initial job screener for Worldcoin. You ask preliminary questions to assess basic qualifications. Be professional but friendly."
  },
  technicalInterviewer: {
    role: "Technical Interviewer",
    systemPrompt: "You are a technical interviewer assessing candidate's knowledge about cryptocurrency, blockchain, and Worldcoin specifically. Ask relevant technical questions."
  },
  hrInterviewer: {
    role: "HR Interviewer",
    systemPrompt: "You are an HR professional assessing soft skills and cultural fit. Focus on communication skills and customer service orientation."
  }
};

// Interview questions for each stage
const interviewStages = {
  initial: {
    questions: [
      "Apakah Anda memiliki pengalaman sebelumnya sebagai sales promoter atau di bidang hospitality?",
      "Apakah Anda bersedia bekerja dalam shift 12 jam?",
      "Bagaimana Anda menangani situasi ketika harus menjelaskan konsep yang kompleks kepada pelanggan?"
    ]
  },
  technical: {
    questions: [
      "Apa yang Anda ketahui tentang Worldcoin dan tujuannya?",
      "Bagaimana Anda akan menjelaskan konsep World ID kepada pengguna yang awam dengan teknologi?",
      "Apa yang Anda ketahui tentang proses verifikasi menggunakan Orb?"
    ]
  },
  hr: {
    questions: [
      "Bagaimana Anda menangani situasi ketika ada pelanggan yang tidak sabar?",
      "Ceritakan pengalaman Anda bekerja dalam tim dan bagaimana Anda berkontribusi?",
      "Bagaimana Anda menjaga semangat dan energi positif selama shift kerja yang panjang?"
    ]
  }
};

// Helper function for Groq API calls
async function askGroq(prompt, systemPrompt = '') {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are a helpful WhatsApp assistant. Keep responses concise and friendly."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || "Maaf, saya tidak dapat memproses permintaan Anda.";
  } catch (error) {
    console.error("Error calling Groq API:", error);
    return "Maaf, terjadi kesalahan dalam memproses permintaan Anda.";
  }
}

client.on('qr', (qr) => {
  // Generate and display QR code in terminal
  qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', async msg => {
  console.log(msg);

  // Original simple responses
  if (msg.body == '!ping') {
    msg.reply('pong');
    return;
  }

  if (msg.body.toLowerCase().includes('ayang') && 
      (msg.body.toLowerCase().includes('halo') || msg.body.toLowerCase().includes('hai'))) {
    msg.reply('halo ayangku');
    return;
  }

  if (msg.body.toLowerCase().includes('love')) {
    msg.reply('love you too');
    return;
  }

  // AI-powered responses
  // General chat
  if (msg.body.startsWith('!ask ')) {
    const question = msg.body.slice(5);
    const response = await askGroq(question);
    msg.reply(response);
    return;
  }

  // Relationship advice
  if (msg.body.startsWith('!advice ')) {
    const question = msg.body.slice(8);
    const response = await askGroq(question, 
      "You are a relationship counselor. Provide caring, understanding, and constructive advice. Keep responses warm and supportive.");
    msg.reply(response);
    return;
  }

  // Romantic messages
  if (msg.body === '!romantic') {
    const response = await askGroq(
      "Generate a sweet romantic message in Indonesian language", 
      "You are a romantic poet. Create sweet, heartfelt messages that are suitable for couples. Keep it clean and sweet."
    );
    msg.reply(response);
    return;
  }

  // Daily motivation
  if (msg.body === '!motivate') {
    const response = await askGroq(
      "Generate a motivational message in Indonesian language",
      "You are a motivational coach. Create uplifting and inspiring messages that encourage positive thinking and action."
    );
    msg.reply(response);
    return;
  }

  // Story generator
  if (msg.body.startsWith('!story ')) {
    const topic = msg.body.slice(7);
    const response = await askGroq(
      `Create a short story about ${topic} in Indonesian language`,
      "You are a creative storyteller. Create engaging, brief stories that are entertaining and appropriate. Keep stories under 200 words."
    );
    msg.reply(response);
    return;
  }

  // Joke generator
  if (msg.body === '!joke') {
    const response = await askGroq(
      "Tell a clean, funny joke in Indonesian language",
      "You are a comedian. Generate clean, appropriate jokes that are suitable for all audiences. Keep it light and fun."
    );
    msg.reply(response);
    return;
  }

  // Poetry generator
  if (msg.body.startsWith('!poem ')) {
    const topic = msg.body.slice(6);
    const response = await askGroq(
      `Create a short poem about ${topic} in Indonesian language`,
      "You are a poet. Create beautiful, meaningful poems that capture emotions and ideas effectively. Keep poems brief but impactful."
    );
    msg.reply(response);
    return;
  }

  // Help command
  if (msg.body === '!help') {
    const helpMessage = `*Available Commands:*
!ask [question] - Ask anything
!advice [question] - Get relationship advice
!romantic - Get a romantic message
!motivate - Get daily motivation
!story [topic] - Generate a short story
!joke - Get a funny joke
!poem [topic] - Create a poem
!ping - Check if bot is active
!games - Show available games

*Example:*
!ask what is love?
!story about our first date
!poem about sunset`;
    
    msg.reply(helpMessage);
    return;
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

  // Check for interview initiation
  if (msg.body.toLowerCase().includes('operation staff - worldcoin project') && 
      msg.body.toLowerCase().includes('tertarik')) {
    
    // Initialize interview session
    interviewState.set(msg.from, {
      stage: 'initial',
      currentQuestion: 0,
      scores: {
        initial: 0,
        technical: 0,
        hr: 0
      },
      answers: []
    });

    const welcomeMessage = `Terima kasih atas ketertarikan Anda pada posisi Operation Staff - Worldcoin Project! 🌟

Saya akan memandu Anda melalui sesi interview singkat untuk mengenal Anda lebih baik.

Proses interview akan terdiri dari 3 tahap:
1. Screening awal
2. Pengetahuan teknis
3. Penilaian soft skills

Siap untuk memulai? Ketik "SIAP" untuk melanjutkan.`;

    await msg.reply(welcomeMessage);
    return;
  }

  // Handle interview process
  if (interviewState.has(msg.from)) {
    const session = interviewState.get(msg.from);
    
    if (msg.body.toLowerCase() === 'siap' && session.currentQuestion === 0) {
      // Start first question
      await msg.reply(interviewStages[session.stage].questions[session.currentQuestion]);
      return;
    }

    // Process answer and continue interview
    if (session.currentQuestion < interviewStages[session.stage].questions.length) {
      // Save answer
      session.answers.push(msg.body);
      
      // Evaluate answer using Groq
      const evaluation = await askGroq(
        `Evaluate this interview answer for ${session.stage} stage of Operation Staff position: "${msg.body}"
        Rate it from 1-10 based on relevance and quality. Only respond with the number.`,
        `You are an expert ${interviewCrew[session.stage === 'initial' ? 'screener' : 
          session.stage === 'technical' ? 'technicalInterviewer' : 'hrInterviewer'].role}`
      );
      
      const score = parseInt(evaluation) || 5;
      session.scores[session.stage] += score;

      session.currentQuestion++;
      
      if (session.currentQuestion < interviewStages[session.stage].questions.length) {
        // Next question in current stage
        await msg.reply(interviewStages[session.stage].questions[session.currentQuestion]);
      } else {
        // Move to next stage or finish
        if (session.stage === 'initial') {
          session.stage = 'technical';
          session.currentQuestion = 0;
          await msg.reply("Bagus! Sekarang kita akan masuk ke tahap technical assessment.");
          await msg.reply(interviewStages.technical.questions[0]);
        } else if (session.stage === 'technical') {
          session.stage = 'hr';
          session.currentQuestion = 0;
          await msg.reply("Excellent! Mari kita lanjut ke tahap terakhir tentang soft skills.");
          await msg.reply(interviewStages.hr.questions[0]);
        } else {
          // Interview finished - calculate results
          const avgScore = {
            initial: session.scores.initial / interviewStages.initial.questions.length,
            technical: session.scores.technical / interviewStages.technical.questions.length,
            hr: session.scores.hr / interviewStages.hr.questions.length
          };
          
          const totalAvg = (avgScore.initial + avgScore.technical + avgScore.hr) / 3;
          
          let result;
          if (totalAvg >= 8) {
            result = "Sangat Baik";
          } else if (totalAvg >= 6) {
            result = "Baik";
          } else {
            result = "Perlu Improvement";
          }

          const finalMessage = `🎉 Interview selesai! 

Hasil evaluasi Anda:
📊 Screening Awal: ${avgScore.initial.toFixed(1)}/10
📊 Technical Assessment: ${avgScore.technical.toFixed(1)}/10
📊 Soft Skills: ${avgScore.hr.toFixed(1)}/10

Nilai Rata-rata: ${totalAvg.toFixed(1)}/10
Hasil: ${result}

${totalAvg >= 6 ? 
"✨ Selamat! Anda telah melewati tahap awal dengan baik. Tim HR kami akan menghubungi Anda dalam 2-3 hari kerja untuk proses selanjutnya." : 
"Terima kasih atas partisipasi Anda. Sayangnya, kualifikasi yang kami cari belum sesuai dengan kebutuhan posisi ini."}

Semoga sukses! 🌟`;

          await msg.reply(finalMessage);
          interviewState.delete(msg.from);
        }
      }
    }
    return;
  }
});

client.initialize();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Error handling for the client
client.on('error', error => {
  console.error('WhatsApp client error:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
