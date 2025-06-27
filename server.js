require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const port = 3000;

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in the .env file.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.use(express.static('public'));

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Audio file not provided.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    const audioPart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    };
    const prompt = "Please transcribe the following audio file in Burmese language. Provide only the text transcript without any extra comments or introductions.";
    const result = await model.generateContent([prompt, audioPart]);
    const response = await result.response;
    const transcript = response.text();
    res.json({ transcript: transcript });
  } catch (error) {
    console.error('Error during transcription:', error);
    res.status(500).json({ error: 'Failed to transcribe audio with Gemini AI.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running! Open http://localhost:${port} in your browser.`);
});