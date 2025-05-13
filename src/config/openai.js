const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000,
  baseURL: 'https://api.openai.com/v1'
});

const config = {
  model: 'gpt-4-turbo',
  temperature: 0.3,
  maxTokens: 1000,
  extractEntity: {
    model: 'gpt-4-turbo',
    temperature: 0.2,
    maxTokens: 500
  }
};

module.exports = { openai, config };
