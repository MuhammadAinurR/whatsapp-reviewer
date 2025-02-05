const INTERVIEW_CONFIG = {
  timeoutMinutes: 30,
  minScoreToPass: 6,
  stages: ['initial', 'technical', 'hr'],
  messages: {
    noQuestions: "Baik, mari kita lanjutkan ke tahap berikutnya!",
    askQuestions: "Ada yang ingin ditanyakan? Atau ketik 'LANJUT' untuk melanjutkan ke tahap berikutnya 😊"
  }
};

const AGENTS = {
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

const STAGES = {
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

module.exports = {
  INTERVIEW_CONFIG,
  AGENTS,
  STAGES
}; 