/**
 * App - 메인 애플리케이션 클래스
 * 모든 컴포넌트를 통합하고 관리
 */
class App {
  constructor() {
    this.editorManager = null;
    this.fileHandler = null;
    this.uiManager = null;
  }

  /**
   * 애플리케이션 초기화
   */
  async init() {
    console.log('Initializing Korean PDF Converter...');

    try {
      // UI Manager 초기화
      this.uiManager = new UIManager();
      this.uiManager.init();

      // Editor Manager 초기화
      this.editorManager = new EditorManager();
      this.editorManager.init('markdown-editor', 'markdown-preview');

      // File Handler 초기화
      this.fileHandler = new FileHandler();

      // 이벤트 리스너 설정
      this.setupEventListeners();

      // 파일 업로드 설정
      this.setupFileUpload();

      // 드래그 앤 드롭 설정
      this.setupDragAndDrop();

      console.log('Korean PDF Converter initialized successfully!');
      this.uiManager.showToast('success', '한글 PDF 변환기가 준비되었습니다!', 2000);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.uiManager.showToast('error', '초기화 중 오류가 발생했습니다.');
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 새 문서
    window.addEventListener('new-document', () => {
      this.editorManager.newDocument();
    });

    // 문서 저장
    window.addEventListener('save-document', () => {
      this.editorManager.saveDocument();
    });

    // 문서 불러오기
    window.addEventListener('load-document', (e) => {
      this.editorManager.loadDocument(e.detail.document);
    });

    // 마크다운 도구
    window.addEventListener('markdown-bold', () => {
      this.editorManager.markdownHelper.bold();
    });

    window.addEventListener('markdown-italic', () => {
      this.editorManager.markdownHelper.italic();
    });

    window.addEventListener('markdown-strikethrough', () => {
      this.editorManager.markdownHelper.strikethrough();
    });

    window.addEventListener('markdown-heading1', () => {
      this.editorManager.markdownHelper.heading(1);
    });

    window.addEventListener('markdown-heading2', () => {
      this.editorManager.markdownHelper.heading(2);
    });

    window.addEventListener('markdown-heading3', () => {
      this.editorManager.markdownHelper.heading(3);
    });

    window.addEventListener('markdown-quote', () => {
      this.editorManager.markdownHelper.quote();
    });

    window.addEventListener('markdown-math', () => {
      this.editorManager.markdownHelper.math();
    });

    window.addEventListener('markdown-mermaid', () => {
      this.editorManager.markdownHelper.mermaid();
    });

    window.addEventListener('markdown-hr', () => {
      this.editorManager.markdownHelper.horizontalRule();
    });

    window.addEventListener('markdown-link', () => {
      this.editorManager.insertLink();
    });

    window.addEventListener('markdown-image', () => {
      this.editorManager.markdownHelper.image();
    });

    window.addEventListener('markdown-list', () => {
      this.editorManager.markdownHelper.unorderedList();
    });

    window.addEventListener('markdown-check-list', () => {
      this.editorManager.markdownHelper.checkList();
    });

    window.addEventListener('markdown-table', () => {
      this.editorManager.markdownHelper.table();
    });

    window.addEventListener('markdown-code', () => {
      this.editorManager.markdownHelper.codeBlock();
    });

    // 텍스트 정리 (Smart Format)
    window.addEventListener('format-text', () => {
      if (this.editorManager && typeof this.editorManager.formatText === 'function') {
        this.editorManager.formatText();
      }
    });

    // ✨ AI 마법 정리 (Magic Format)
    window.addEventListener('ai-format', () => {
      if (this.editorManager && typeof this.editorManager.magicFormat === 'function') {
        this.editorManager.magicFormat();
      }
    });

    // ⚙️ 설정 열기
    window.addEventListener('open-settings', () => {
      this.openSettingsModal();
    });

    // 본문 전체 복사
    window.addEventListener('copy-all', () => {
      const content = this.editorManager.getContent();
      navigator.clipboard.writeText(content).then(() => {
        this.uiManager.showToast('success', '마크다운 내용이 전체 복사되었습니다.');
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        this.uiManager.showToast('error', '텍스트 복사에 실패했습니다.');
      });
    });

    // 렌더링된 미리보기 결과 복사 (Rich Text)
    window.addEventListener('copy-preview', () => {
      const previewEl = document.getElementById('markdown-preview');
      if (!previewEl) return;
      
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(previewEl);
        selection.removeAllRanges();
        selection.addRange(range);
        
        document.execCommand('copy');
        selection.removeAllRanges();
        
        this.uiManager.showToast('success', '렌더링된 서식 전체가 클립보드에 복사되었습니다.');
      } catch (err) {
        console.error('Failed to copy preview: ', err);
        this.uiManager.showToast('error', '미리보기 복사에 실패했습니다.');
      }
    });
  }

  /**
   * 설정 모달 열기
   */
  openSettingsModal() {
    const settings = window.aiService.getSettings();
    
    // 모달 컨텐츠 렌더링
    const content = `
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ✨ <strong>AI 마법 정리</strong> 기능을 사용하기 위한 API 키를 설정합니다.<br>
          키는 서버에 전송되지 않고 사용자의 브라우저 로컬 저장소에만 안전하게 보관됩니다. (2026년 기준 최신 모델 모델 적용됨)
        </p>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">우선 사용 모델 선택</label>
          <select id="pref-model-select" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="gemini" ${settings.preferredModel === 'gemini' ? 'selected' : ''}>Google Gemini (2.5 Flash Lite - 무료/극강 가성비)</option>
            <option value="openai" ${settings.preferredModel === 'openai' ? 'selected' : ''}>OpenAI (GPT-5 Mini - 완벽한 품질 표준)</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Google Gemini API 키</label>
          <input type="password" id="gemini-key-input" value="${settings.geminiKey}" placeholder="AIzaSy..." 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <p class="text-xs text-gray-500 mt-1"><a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-blue-500 hover:underline">Google AI Studio에서 무료 키 발급받기</a></p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OpenAI API 키</label>
          <input type="password" id="openai-key-input" value="${settings.openaiKey}" placeholder="sk-..." 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <p class="text-xs text-gray-500 mt-1"><a href="https://platform.openai.com/api-keys" target="_blank" class="text-blue-500 hover:underline">OpenAI 플랫폼에서 키 발급받기</a></p>
        </div>
      </div>
    `;

    // 모달 호출
    const modalId = 'settings-modal';
    this.uiManager.modalManager.show(modalId, {
      title: '⚙️ 환경 설정',
      size: 'medium',
      content: content,
      buttons: [
        { label: '취소', action: 'cancel' },
        { label: '저장하기', action: 'save', className: 'bg-blue-600 text-white hover:bg-blue-700' }
      ]
    });

    // 모달 액션 핸들링 이벤트
    const handleModalAction = (e) => {
      if (e.detail.modalId === modalId && e.detail.action === 'save') {
        const geminiKey = document.getElementById('gemini-key-input').value;
        const openaiKey = document.getElementById('openai-key-input').value;
        const prefModel = document.getElementById('pref-model-select').value;
        
        window.aiService.saveSettings(geminiKey, openaiKey, prefModel);
        this.uiManager.showToast('success', '설정이 안전하게 저장되었습니다.');
        this.uiManager.modalManager.close(modalId);
        window.removeEventListener('modal-action', handleModalAction);
      }
    };
    window.addEventListener('modal-action', handleModalAction);
  }

  /**
   * 파일 업로드 설정
   */
  setupFileUpload() {
    const fileInput = document.getElementById('file-input');

    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (files.length > 0) {
          await this.handleFileUpload(files);
          fileInput.value = ''; // 초기화
        }
      });
    }
  }

  /**
   * 드래그 앤 드롭 설정
   */
  setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const body = document.body;

    // 드래그 오버
    body.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dropZone) dropZone.classList.remove('hidden');
    });

    // 드래그 떠남
    body.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target === body && dropZone) {
        dropZone.classList.add('hidden');
      }
    });

    // 드롭
    if (dropZone) {
      dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('hidden');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          await this.handleFileUpload(files);
        }
      });

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }
  }

  /**
   * 파일 업로드 처리
   * @param {FileList} files - 파일 목록
   */
  async handleFileUpload(files) {
    const loadingId = this.uiManager.showLoading('파일을 읽는 중...');

    try {
      const results = await this.fileHandler.handleMultipleFiles(files);

      // 성공한 파일들
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length === 1) {
        // 단일 파일 - 에디터에 로드
        this.editorManager.setContent(successful[0].data.content);
        this.uiManager.showToast('success', '파일을 불러왔습니다.');
      } else if (successful.length > 1) {
        // 다중 파일 
        // 여러 파일을 한 번에 불러오는 기능은 PDF 일괄 변환이 삭제되어
        // 기능상 처리 방식이 변경되었습니다. 현재는 첫 번째 파일만 엽니다.
        this.editorManager.setContent(successful[0].data.content);
        this.uiManager.showToast('info', '여러 파일 중 첫 번째 파일만 불러옵니다.');
      }

      // 실패한 파일 알림
      if (failed.length > 0) {
        const messages = failed.map(f => `${f.fileName}: ${f.error}`).join('\n');
        this.uiManager.modalManager.alert(`다음 파일을 읽을 수 없습니다:\n\n${messages}`);
      }

      this.uiManager.hideLoading(loadingId);
    } catch (error) {
      this.uiManager.hideLoading(loadingId);
      console.error('File upload error:', error);
      this.uiManager.showToast('error', '파일 업로드 중 오류가 발생했습니다.');
    }
  }

  /**
   * 마크다운 내보내기
   */
  exportMarkdown() {
    const content = this.editorManager.getContent();

    if (!content.trim()) {
      this.uiManager.showToast('warning', '내보낼 내용이 없습니다.');
      return;
    }

    try {
      const title = MarkdownHelper.extractTitle(content);
      const filename = title.replace(/[^\w\s가-힣-]/g, '').substring(0, 50) || 'document';

      this.fileHandler.downloadMarkdown(content, filename);
      this.uiManager.showToast('success', '마크다운 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('Markdown export error:', error);
      this.uiManager.showToast('error', '마크다운 내보내기 중 오류가 발생했습니다.');
    }
  }

  /**
   * HTML 내보내기 (복사 및 다운로드)
   */
  exportHTML() {
    const content = this.editorManager.getContent();

    if (!content.trim()) {
      this.uiManager.showToast('warning', '내보낼 내용이 없습니다.');
      return;
    }

    try {
      // 일반적인 marked.parse가 아닌, 수식 보호 처리가 포함된 에디터 매니저의 파서를 사용
      const html = this.editorManager.parseMarkdown(content);
      const title = MarkdownHelper.extractTitle(content);
      const filename = title.replace(/[^\w\s가-힣-]/g, '').substring(0, 50) || 'document';

      // 1. 클립보드 복사
      this.fileHandler.copyToClipboard(html).then(success => {
        if (success) {
          this.uiManager.showToast('success', 'HTML 코드가 클립보드에 복사되었습니다. (파일도 다운로드됩니다.)');
        } else {
          this.uiManager.showToast('info', 'HTML 파일이 다운로드됩니다.');
        }
      });

      // 2. 파일 다운로드
      this.fileHandler.downloadHTML(html, filename);

    } catch (error) {
      console.error('HTML export error:', error);
      this.uiManager.showToast('error', 'HTML 내보내기 중 오류가 발생했습니다.');
    }
  }

  /**
   * 통계 정보 가져오기
   */
  getStatistics() {
    const stats = StorageManager.getStatistics();
    const content = this.editorManager.getContent();

    return {
      ...stats,
      currentDocumentChars: MarkdownHelper.countCharacters(content),
      currentDocumentWords: MarkdownHelper.countWords(content),
      currentDocumentLines: MarkdownHelper.countLines(content)
    };
  }
}

// 애플리케이션 시작
let app;

// DOM 로드 완료 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    window.app = app;  // 초기화 전에 전역 설정
    app.init();
  });
} else {
  app = new App();
  window.app = app;  // 초기화 전에 전역 설정
  app.init();
}
