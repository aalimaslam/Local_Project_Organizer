const axios = require('axios');

class LLMService {
  constructor(settings) {
    this.settings = settings;
  }

  async analyzeProject(context) {
    const { provider, apiKey, model, baseURL } = this.settings;

    const prompt = `
      Analyze the following project files and provide a concise description and a start command.

      Files provided:
      ${JSON.stringify(context, null, 2)}

      Return the result in JSON format:
      {
        "name": "project name",
        "description": "brief description",
        "startCommand": "command to run the project",
        "tags": ["tag1", "tag2"]
      }
    `;

    try {
      if (!apiKey && provider !== 'ollama') {
        throw new Error(`API Key is required for provider: ${provider}`);
      }

      if (provider === 'openai' || provider === 'kimi' || provider === 'generic') {
        const response = await axios.post(`${baseURL}/chat/completions`, {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        return JSON.parse(response.data.choices[0].message.content);
      } else if (provider === 'gemini') {
        // Gemini implementation
        const response = await axios.post(`${baseURL}/models/${model}:generateContent?key=${apiKey}`, {
          contents: [{ parts: [{ text: prompt + " (Return only the JSON string)" }] }]
        });
        const text = response.data.candidates[0].content.parts[0].text;
        // Basic cleanup if Gemini includes markdown
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } else if (provider === 'ollama') {
        const response = await axios.post(`${baseURL}/api/generate`, {
          model: model,
          prompt: prompt,
          stream: false,
          format: 'json'
        });
        return JSON.parse(response.data.response);
      }
      throw new Error('Unsupported provider');
    } catch (error) {
      console.error('AI Analysis failed:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = LLMService;
