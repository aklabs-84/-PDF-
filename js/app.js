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

    // H1 밑줄 토글
    window.addEventListener('toggle-h1-underline', () => {
      const settings = StorageManager.getSettings();
      settings.showH1Underline = settings.showH1Underline === false ? true : false;
      StorageManager.saveSettings(settings);
      
      this.editorManager.applyTemplateStylesToPreview();
      this.uiManager.showToast('info', `제목(H1) 꾸밈 스타일이 ${settings.showH1Underline ? '켜졌' : '꺼졌'}습니다.`, 1500);
    });

    // 본문 전체 복사
    window.addEventListener('copy-all', () => {
      const content = this.editorManager.getMarkdown();
      navigator.clipboard.writeText(content).then(() => {
        this.uiManager.showToast('success', '마크다운 내용이 전체 복사되었습니다.');
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        this.uiManager.showToast('error', '텍스트 복사에 실패했습니다.');
      });
    });
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
   * HTML 내보내기
   */
  exportHTML() {
    const content = this.editorManager.getContent();

    if (!content.trim()) {
      this.uiManager.showToast('warning', '내보낼 내용이 없습니다.');
      return;
    }

    try {
      const html = marked.parse(content);
      const title = MarkdownHelper.extractTitle(content);
      const filename = title.replace(/[^\w\s가-힣-]/g, '').substring(0, 50) || 'document';

      this.fileHandler.downloadHTML(html, filename);
      this.uiManager.showToast('success', 'HTML 파일이 다운로드되었습니다.');
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
