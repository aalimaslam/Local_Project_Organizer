const axios = require('axios');

class AIService {
  constructor(settings) {
    this.settings = settings;
  }

  resolveSettings() {
    const provider = (this.settings.provider || 'openai').toLowerCase();
    const apiKey = this.settings.apiKey || '';
    const defaults = {
      openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
      gemini: { baseURL: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.0-flash' },
      kimi: { baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
      ollama: { baseURL: 'http://localhost:11434', model: 'llama3.1' },
      generic: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' }
    };

    let baseURL = (this.settings.baseURL || defaults[provider]?.baseURL || '').trim();
    let model = (this.settings.model || defaults[provider]?.model || '').trim();

    if (provider === 'gemini' && /api\.gemini\.com/i.test(baseURL)) {
      baseURL = defaults.gemini.baseURL;
    }
    if (provider === 'gemini') {
      model = model.replace(/^models\//, '');
    }

    return { provider, apiKey, model, baseURL };
  }

  parseJsonFromText(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) throw new Error('AI response was empty.');
    const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      return JSON.parse(stripped);
    } catch (_err) {
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      const arrMatch = stripped.match(/\[[\s\S]*\]/);
      if (arrMatch) return JSON.parse(arrMatch[0]);
      throw new Error('AI response was not valid JSON');
    }
  }

  async analyzeProject(context, availableLabels = []) {
    const { provider, apiKey, model, baseURL } = this.resolveSettings();
    const labelList = availableLabels.length > 0
      ? `Available label IDs:\n${availableLabels.map(l => `  - id: "${l.id}", name: "${l.name}"`).join('\n')}`
      : '';

    const prompt = `Analyze this project:
${JSON.stringify(context, null, 2)}

${labelList}

Return ONLY JSON:
{
  "name": "title-case name",
  "description": "1-2 sentences",
  "startCommand": "run command",
  "tags": ["tech1", "tech2"],
  "labels": ["label-id"]
}`;

    // implementation of request (shortened for brevity here, mirroring previous logic)
    return this._request(prompt, provider, apiKey, model, baseURL);
  }

  async analyzeProjectsBulk(projectContexts, availableLabels = []) {
    const { provider, apiKey, model, baseURL } = this.resolveSettings();
    const labelList = availableLabels.length > 0
      ? `Available labels:\n${availableLabels.map(l => `- id: "${l.id}", name: "${l.name}"`).join('\n')}`
      : '';

    const projectsInput = projectContexts.map((p, idx) => ({ index: idx, path: p.path, context: p.context }));
    const prompt = `Analyze these ${projectsInput.length} projects and return a JSON array:
${JSON.stringify(projectsInput, null, 2)}

${labelList}

Each object in array MUST have: name, description, startCommand, tags, labels (IDs).
Return exactly ${projectsInput.length} objects.`;

    const results = await this._request(prompt, provider, apiKey, model, baseURL, true);
    const arr = Array.isArray(results) ? results : (results.projects || results.results || []);
    return arr.map(r => ({
      name: r.name || '',
      description: r.description || '',
      startCommand: r.startCommand || '',
      tags: Array.isArray(r.tags) ? r.tags : [],
      labels: Array.isArray(r.labels) ? r.labels : []
    }));
  }

  async _request(prompt, provider, apiKey, model, baseURL, isBulk = false) {
    try {
      let text;
      if (provider === 'openai' || provider === 'kimi' || provider === 'generic') {
        const response = await axios.post(`${baseURL}/chat/completions`, {
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        }, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: isBulk ? 60000 : 30000
        });
        text = response.data.choices?.[0]?.message?.content;
      } else if (provider === 'gemini') {
        const response = await axios.post(`${baseURL.replace(/\/$/, '')}/models/${model}:generateContent?key=${apiKey}`, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        });
        text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      } else if (provider === 'ollama') {
        const response = await axios.post(`${baseURL}/api/generate`, { model, prompt, stream: false, format: 'json' });
        text = response.data?.response;
      } else {
        throw new Error('Unsupported provider');
      }
      return this.parseJsonFromText(text);
    } catch (e) {
      throw new Error(`AI Request failed: ${e.message}`);
    }
  }
}

module.exports = AIService;
