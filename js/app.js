/**
 * App - 메인 애플리케이션 클래스
 * 모든 컴포넌트를 통합하고 관리
 */
class App {
  constructor() {
    this.editorManager = null;
    this.pdfGenerator = null;
    this.templateEngine = null;
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

      // Template Engine 초기화
      this.templateEngine = new TemplateEngine();
      await this.templateEngine.init();

      // Editor Manager 초기화
      this.editorManager = new EditorManager();
      this.editorManager.init('markdown-editor', 'markdown-preview');

      // PDF Generator 초기화
      this.pdfGenerator = new PDFGenerator();

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

    // PDF 변환
    window.addEventListener('export-pdf', async () => {
      await this.exportToPDF();
    });

    // 마크다운 도구
    window.addEventListener('markdown-bold', () => {
      this.editorManager.markdownHelper.bold();
    });

    window.addEventListener('markdown-italic', () => {
      this.editorManager.markdownHelper.italic();
    });

    window.addEventListener('markdown-heading', () => {
      this.editorManager.markdownHelper.heading(1);
    });

    window.addEventListener('markdown-link', () => {
      this.editorManager.insertLink();
    });

    window.addEventListener('markdown-list', () => {
      this.editorManager.markdownHelper.unorderedList();
    });

    window.addEventListener('markdown-code', () => {
      this.editorManager.markdownHelper.codeBlock();
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
        // 다중 파일 - 일괄 변환 옵션
        this.uiManager.hideLoading(loadingId);
        this.showBatchConversionDialog(successful);
        return;
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
   * 일괄 변환 다이얼로그 표시
   * @param {Array} files - 파일 데이터 배열
   */
  showBatchConversionDialog(files) {
    const content = `
      <p class="mb-4 text-gray-700 dark:text-gray-300">
        ${files.length}개의 파일이 업로드되었습니다. 어떻게 처리하시겠습니까?
      </p>
      <div class="space-y-2">
        ${files.map((f, i) => `
          <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
            ${i + 1}. ${f.data.name}
          </div>
        `).join('')}
      </div>
    `;

    this.uiManager.modalManager.show('batch-convert', {
      title: '다중 파일 처리',
      content: content,
      size: 'medium',
      buttons: [
        { label: '취소', action: 'cancel', className: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600' },
        { label: '일괄 PDF 변환', action: 'batch', className: 'bg-blue-600 text-white hover:bg-blue-700' }
      ]
    });

    const handler = (e) => {
      if (e.detail.modalId === 'batch-convert') {
        if (e.detail.action === 'batch') {
          this.batchConvertToPDF(files);
        }
        this.uiManager.modalManager.close('batch-convert');
        window.removeEventListener('modal-action', handler);
      }
    };

    window.addEventListener('modal-action', handler);
  }

  /**
   * 일괄 PDF 변환
   * @param {Array} files - 파일 데이터 배열
   */
  async batchConvertToPDF(files) {
    const progress = this.uiManager.showProgress('PDF 변환 중...');

    try {
      const pdfs = [];
      const template = this.templateEngine.getActiveTemplate();
      const settings = {
        plainTextMode: this.uiManager.getPlainTextMode()
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        progress.update((i / files.length) * 100, `${i + 1}/${files.length} 변환 중...`);

        try {
          const doc = await this.pdfGenerator.generate(file.data.content, template, settings);
          pdfs.push({
            doc: doc,
            filename: file.data.name.replace(/\.[^/.]+$/, '')
          });
        } catch (error) {
          console.error(`Failed to convert ${file.data.name}:`, error);
        }
      }

      progress.update(100, 'ZIP 파일 생성 중...');

      // ZIP으로 다운로드
      await this.fileHandler.downloadBatch(pdfs, 'converted-pdfs');

      progress.close();
      this.uiManager.showToast('success', `${pdfs.length}개의 PDF가 변환되었습니다.`);
    } catch (error) {
      progress.close();
      console.error('Batch conversion error:', error);
      this.uiManager.showToast('error', 'PDF 변환 중 오류가 발생했습니다.');
    }
  }

  /**
   * PDF 변환 및 다운로드
   */
  async exportToPDF() {
    const content = this.editorManager.getContent();

    if (!content.trim()) {
      this.uiManager.showToast('warning', '변환할 내용이 없습니다.');
      return;
    }

    const loadingId = this.uiManager.showLoading('PDF 생성 중...');

    try {
      // jsPDF 라이브러리 체크
      if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
        throw new Error('jsPDF 라이브러리가 로드되지 않았습니다. 인터넷 연결을 확인하세요.');
      }

      // 템플릿 가져오기
      const template = this.templateEngine.getActiveTemplate();

      if (!template) {
        throw new Error('템플릿을 불러올 수 없습니다.');
      }

      // PDF 생성 (텍스트 모드 설정 전달)
      const settings = {
        plainTextMode: this.uiManager.getPlainTextMode()
      };
      const doc = await this.pdfGenerator.generate(content, template, settings);

      // 파일명 생성
      const title = MarkdownHelper.extractTitle(content);
      const filename = title.replace(/[^\w\s가-힣-]/g, '').substring(0, 50) || 'document';

      // 다운로드
      this.fileHandler.downloadPDF(doc, filename);

      this.uiManager.hideLoading(loadingId);
      this.uiManager.showToast('success', 'PDF가 생성되었습니다!');
    } catch (error) {
      this.uiManager.hideLoading(loadingId);
      console.error('PDF generation error:', error);

      // 에러 타입별 메시지
      let errorMessage = 'PDF 생성 중 오류가 발생했습니다.';

      if (error.message.includes('jsPDF')) {
        errorMessage = 'jsPDF 라이브러리 로딩 실패. 인터넷 연결을 확인하세요.';
      } else if (error.message.includes('font') || error.message.includes('Font')) {
        errorMessage = '폰트 로딩 실패. fonts 디렉토리에 한글 폰트 파일(.ttf)이 있는지 확인하세요.';
      } else if (error.message.includes('fetch') || error.message.includes('404')) {
        errorMessage = '필요한 파일을 찾을 수 없습니다. 웹 서버를 통해 실행 중인지 확인하세요.';
      }

      this.uiManager.modalManager.alert(
        `<div class="space-y-2">
          <p class="font-semibold text-red-600">❌ ${errorMessage}</p>
          <p class="text-sm text-gray-600">${error.message}</p>
          <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p class="text-sm font-semibold">💡 해결 방법:</p>
            <ul class="text-sm mt-2 space-y-1 list-disc list-inside">
              <li>웹 서버를 통해 실행 중인지 확인 (file:// 프로토콜이 아닌 http://)</li>
              <li>fonts 디렉토리에 .ttf 폰트 파일 3개가 있는지 확인</li>
              <li>인터넷 연결 확인 (CDN 라이브러리 로딩용)</li>
              <li>브라우저 콘솔(F12)에서 상세 에러 확인</li>
            </ul>
          </div>
        </div>`
      );
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
    app.init();
  });
} else {
  app = new App();
  app.init();
}

// 전역에서 접근 가능하도록 설정
window.app = app;
