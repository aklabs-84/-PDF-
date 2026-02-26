/**
 * AIService - AI 모델 API 연동 서비스
 * OpenAI 및 Google Gemini API 호출 담당
 */
class AIService {
  constructor() {
    this.models = {
      GEMINI: 'gemini-2.5-flash-lite',
      OPENAI: 'gpt-5-mini'
    };
    
    // 로컬 스토리지 키 관리
    this.STORAGE_KEYS = {
      GEMINI_KEY: 'md_note_gemini_key',
      OPENAI_KEY: 'md_note_openai_key',
      PREF_MODEL: 'md_note_pref_model' // 'gemini' or 'openai'
    };
  }

  /**
   * 설정 불러오기
   */
  getSettings() {
    return {
      geminiKey: localStorage.getItem(this.STORAGE_KEYS.GEMINI_KEY) || '',
      openaiKey: localStorage.getItem(this.STORAGE_KEYS.OPENAI_KEY) || '',
      preferredModel: localStorage.getItem(this.STORAGE_KEYS.PREF_MODEL) || 'gemini'
    };
  }

  /**
   * 설정 저장하기
   */
  saveSettings(geminiKey, openaiKey, preferredModel) {
    localStorage.setItem(this.STORAGE_KEYS.GEMINI_KEY, geminiKey.trim());
    localStorage.setItem(this.STORAGE_KEYS.OPENAI_KEY, openaiKey.trim());
    localStorage.setItem(this.STORAGE_KEYS.PREF_MODEL, preferredModel);
  }

  /**
   * 선택된 모델에 맞춰 텍스트를 마크다운으로 포맷팅
   * @param {string} text - 원본 텍스트
   * @returns {Promise<string>} - 마크다운으로 변환된 텍스트
   */
  async formatToMarkdown(text) {
    const settings = this.getSettings();
    
    if (settings.preferredModel === 'gemini') {
      if (!settings.geminiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');
      return await this.callGeminiAPI(text, settings.geminiKey);
    } else {
      if (!settings.openaiKey) throw new Error('OpenAI API 키가 설정되지 않았습니다.');
      return await this.callOpenAIAPI(text, settings.openaiKey);
    }
  }

  /**
   * 공통 시스템 프롬프트 반환
   */
  getSystemPrompt() {
    return `You are an expert Markdown formatter and editor.
Your task is to take the user's raw, unstructured text and beautifully format it into Markdown.
- Automatically add appropriate Headings (#, ##, ###) based on context and hierarchy.
- Use bullet points (-) or numbered lists (1.) for grouped items or steps.
- Apply **bold** or *italic* text to emphasize important keywords and concepts.
- Preserve all original information and intent, just improve the readability and structure.
- Return ONLY the raw markdown text. Do not wrap in \`\`\`markdown blocks or add conversational filler like "Here is your text".`;
  }

  /**
   * 구글 Gemini API 호출
   */
  async callGeminiAPI(text, apiKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.models.GEMINI}:generateContent?key=${apiKey}`;
    
    // Gemini 1.5+ supports system instructions
    const payload = {
      system_instruction: {
        parts: { text: this.getSystemPrompt() }
      },
      contents: [{
        parts: [{
          text: `Please format the following text into structured Markdown:\n\n${text}`
        }]
      }],
      generationConfig: {
        temperature: 0.2, // 낮게 설정하여 포맷팅의 일관성 유지
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Gemini API 호출 중 오류가 발생했습니다.');
    }

    const data = await response.json();
    let result = data.candidates[0].content.parts[0].text;
    
    return this.cleanMarkdownWrap(result);
  }

  /**
   * OpenAI API 호출
   */
  async callOpenAIAPI(text, apiKey) {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    
    const payload = {
      model: this.models.OPENAI,
      temperature: 0.2, // 일관성 유지
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: `Please format the following text into structured Markdown:\n\n${text}` }
      ]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API 호출 중 오류가 발생했습니다.');
    }

    const data = await response.json();
    let result = data.choices[0].message.content;
    
    return this.cleanMarkdownWrap(result);
  }

  /**
   * LLM이 종종 남기는 ```markdown 랩퍼 제거
   */
  cleanMarkdownWrap(text) {
    let cleaned = text.trim();
    if (cleaned.startsWith('```markdown\n') && cleaned.endsWith('\n```')) {
      cleaned = cleaned.substring(12, cleaned.length - 4);
    } else if (cleaned.startsWith('```\n') && cleaned.endsWith('\n```')) {
      cleaned = cleaned.substring(4, cleaned.length - 4);
    }
    return cleaned.trim();
  }
}

// 전역 싱글톤 인스턴스 생성
window.aiService = new AIService();
