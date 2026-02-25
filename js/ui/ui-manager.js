/**
 * UIManager - UI 컨트롤 및 이벤트 관리 클래스
 * 버튼, 테마, 토스트 등 UI 요소 관리
 */
class UIManager {
  constructor() {
    this.modalManager = new ModalManager();
    this.currentTheme = 'light';
    this.currentFontSize = 16; // 기본 글꼴 크기
  }

  /**
   * UI 초기화
   */
  init() {
    this.setupTheme();
    this.loadSettings();
    this.setupToolbarButtons();
    this.setupGlobalEvents();

    console.log('UIManager initialized');
  }

  /**
   * 저장된 설정 불러오기
   */
  loadSettings() {
    const settings = StorageManager.getSettings();
    if (settings.fontSize) {
      this.currentFontSize = settings.fontSize;
      this.applyFontSize();
    }
  }

  /**
   * 테마 설정
   */
  setupTheme() {
    // 저장된 테마 또는 시스템 테마 로드
    const settings = StorageManager.getSettings();
    const savedTheme = settings.theme;

    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // 시스템 테마 감지
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }

    // 시스템 테마 변경 감지
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!settings.theme) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * 테마 설정
   * @param {string} theme - 테마 (light/dark)
   */
  setTheme(theme) {
    this.currentTheme = theme;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 설정 저장
    const settings = StorageManager.getSettings();
    settings.theme = theme;
    StorageManager.saveSettings(settings);
  }

  /**
   * 테마 토글
   */
  toggleTheme() {
    this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
  }

  /**
   * 툴바 버튼 설정
   */
  setupToolbarButtons() {
    // 테마 토글
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // 새 문서
    const newDocBtn = document.getElementById('new-doc-btn');
    if (newDocBtn) {
      newDocBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('new-document'));
      });
    }

    // 동적 컨트롤 삽입 (에디터 전체 보기 및 프리뷰 영역 헤더)
    const editorHeader = document.getElementById('fullscreen-editor-btn')?.parentElement;
    if (editorHeader && !document.getElementById('header-copy-all-btn')) {
      const copyBtnHtml = `
        <button id="header-copy-all-btn" class="p-1 mr-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="마크다운 전체 복사">
          <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        </button>
      `;
      document.getElementById('fullscreen-editor-btn').insertAdjacentHTML('beforebegin', copyBtnHtml);
      document.getElementById('header-copy-all-btn').addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('copy-all'));
      });
    }

    const previewHeader = document.getElementById('fullscreen-preview-btn')?.parentElement;
    if (previewHeader && !document.getElementById('header-help-btn')) {
      const helpBtnHtml = `
        <button id="header-help-btn" class="p-1 mr-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="도움말">
          <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
      `;
      document.getElementById('fullscreen-preview-btn').insertAdjacentHTML('beforebegin', helpBtnHtml);
      document.getElementById('header-help-btn').addEventListener('click', () => this.showHelp());
    }

    // 파일 업로드
    const uploadBtn = document.getElementById('upload-file-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        document.getElementById('file-input').click();
      });
    }

    // 저장
    const saveBtn = document.getElementById('save-doc-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('save-document'));
      });
    }

    // 마크다운 도구
    this.setupMarkdownButtons();
    
    // 텍스트 정리 (새로 추가됨)
    const formatBtn = document.getElementById('format-text-btn');
    if (formatBtn) {
      formatBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('format-text'));
      });
    }

    // 템플릿 선택
    const templateBtn = document.getElementById('template-btn');
    if (templateBtn) {
      templateBtn.addEventListener('click', () => this.showTemplateSelector());
    }

    // PDF 변환 및 Export 옵션
    const exportPdfBtn = document.getElementById('export-pdf-drop-btn');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('export-pdf'));
      });
    }

    const exportMdBtn = document.getElementById('export-md-btn');
    if (exportMdBtn) {
      exportMdBtn.addEventListener('click', () => {
        if (window.app && typeof window.app.exportMarkdown === 'function') {
          window.app.exportMarkdown();
        }
      });
    }

    const exportHtmlBtn = document.getElementById('export-html-btn');
    if (exportHtmlBtn) {
      exportHtmlBtn.addEventListener('click', () => {
        if (window.app && typeof window.app.exportHTML === 'function') {
          window.app.exportHTML();
        }
      });
    }

    // 내 문서
    const documentsBtn = document.getElementById('documents-btn');
    if (documentsBtn) {
      documentsBtn.addEventListener('click', () => this.showDocumentsList());
    }

    // 도움말
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => this.showHelp());
    }

    // 폰트 크기 변경
    const fontPlusBtn = document.getElementById('font-plus-btn');
    if (fontPlusBtn) {
      fontPlusBtn.addEventListener('click', () => this.changeFontSize(2));
    }

    const fontMinusBtn = document.getElementById('font-minus-btn');
    if (fontMinusBtn) {
      fontMinusBtn.addEventListener('click', () => this.changeFontSize(-2));
    }

    // 본문 전체 복사 버튼
    const copyAllBtn = document.getElementById('copy-all-btn');
    if (copyAllBtn) {
      copyAllBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('copy-all'));
      });
    }

    // 전체화면 버튼
    const fullscreenEditorBtn = document.getElementById('fullscreen-editor-btn');
    const fullscreenPreviewBtn = document.getElementById('fullscreen-preview-btn');

    if (fullscreenEditorBtn) {
      fullscreenEditorBtn.addEventListener('click', () => {
        const editor = document.getElementById('markdown-editor').parentElement;
        this.toggleFullscreen(editor);
      });
    }

    if (fullscreenPreviewBtn) {
      fullscreenPreviewBtn.addEventListener('click', () => {
        const preview = document.getElementById('markdown-preview').parentElement;
        this.toggleFullscreen(preview);
      });
    }
  }

  /**
   * 마크다운 버튼 설정
   */
  setupMarkdownButtons() {
    const buttons = {
      'bold-btn': () => window.dispatchEvent(new CustomEvent('markdown-bold')),
      'italic-btn': () => window.dispatchEvent(new CustomEvent('markdown-italic')),
      'strikethrough-btn': () => window.dispatchEvent(new CustomEvent('markdown-strikethrough')),
      'heading1-btn': () => window.dispatchEvent(new CustomEvent('markdown-heading1')),
      'heading2-btn': () => window.dispatchEvent(new CustomEvent('markdown-heading2')),
      'heading3-btn': () => window.dispatchEvent(new CustomEvent('markdown-heading3')),
      'quote-btn': () => window.dispatchEvent(new CustomEvent('markdown-quote')),
      'hr-btn': () => window.dispatchEvent(new CustomEvent('markdown-hr')),
      'link-btn': () => window.dispatchEvent(new CustomEvent('markdown-link')),
      'image-btn': () => window.dispatchEvent(new CustomEvent('markdown-image')),
      'list-btn': () => window.dispatchEvent(new CustomEvent('markdown-list')),
      'check-list-btn': () => window.dispatchEvent(new CustomEvent('markdown-check-list')),
      'table-btn': () => window.dispatchEvent(new CustomEvent('markdown-table')),
      'code-btn': () => window.dispatchEvent(new CustomEvent('markdown-code'))
    };

    for (const [id, handler] of Object.entries(buttons)) {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', handler);
      }
    }
  }

  /**
   * 전역 이벤트 설정
   */
  setupGlobalEvents() {
    // 스토리지 용량 초과
    window.addEventListener('storage-full', (e) => {
      this.showToast('error', e.detail.message);
    });

    // 토스트 표시
    window.addEventListener('show-toast', (e) => {
      this.showToast(e.detail.type, e.detail.message);
    });
  }

  /**
   * 토스트 알림 표시
   * @param {string} type - 타입 (success, error, info, warning)
   * @param {string} message - 메시지
   * @param {number} duration - 표시 시간 (ms)
   */
  showToast(type, message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }

  /**
   * 템플릿 선택 모달 표시
   */
  showTemplateSelector() {
    let templates = [];

    try {
      if (window && window.app && window.app.templateEngine && typeof window.app.templateEngine.getAllTemplates === 'function') {
        templates = window.app.templateEngine.getAllTemplates();
      }
    } catch (error) {
      console.error('Failed to get templates from TemplateEngine:', error);
      templates = [];
    }

    // 폴백: 템플릿이 없으면 TemplateEngine의 기본 템플릿 사용
    if (!templates || templates.length === 0) {
      try {
        const te = new TemplateEngine();
        const defaults = te.getDefaultTemplates();
        templates = Object.values(defaults);
      } catch (e) {
        templates = [];
      }
    }

    if (!templates || templates.length === 0) {
      this.modalManager.alert('템플릿을 불러올 수 없습니다. 콘솔을 확인하세요.');
      return;
    }

    const content = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${templates.map(template => `
          <div class="template-card p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors" data-template="${template.name}">
            <h4 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">${template.displayName}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${template.description}</p>
            <div class="text-xs text-gray-500 dark:text-gray-500">
              <div>폰트: ${template.font}</div>
              <div>크기: ${template.fontSize}pt</div>
              <div>여백: ${template.margin.top}pt</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    try {
      this.modalManager.show('template-selector', {
        title: '템플릿 선택',
        content: content,
        size: 'large',
        buttons: [
          { label: '취소', action: 'close', className: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600' }
        ]
      });

      // 템플릿 카드 클릭 이벤트
      setTimeout(() => {
        document.querySelectorAll('.template-card').forEach(card => {
          card.addEventListener('click', () => {
            const templateName = card.dataset.template;
            try {
              if (window && window.app && window.app.templateEngine && typeof window.app.templateEngine.setCurrentTemplate === 'function') {
                window.app.templateEngine.setCurrentTemplate(templateName);
              }
              // 템플릿 변경 이벤트 브로드캐스트
              window.dispatchEvent(new CustomEvent('template-changed', { detail: { template: templateName } }));
              this.modalManager.close('template-selector');
              this.showToast('success', `${card.querySelector('h4').textContent} 템플릿이 선택되었습니다.`);
            } catch (e) {
              console.error('Failed to set template:', e);
              this.modalManager.alert('템플릿 적용 중 오류가 발생했습니다. 콘솔을 확인하세요.');
            }
          });
        });
      }, 100);
    } catch (e) {
      console.error('Failed to show template selector modal:', e);
      this.modalManager.alert('템플릿 선택창을 열 수 없습니다. 콘솔을 확인하세요.');
    }
  }

  /**
   * 문서 목록 모달 표시
   */
  showDocumentsList() {
    const documents = StorageManager.getAllDocuments();

    if (documents.length === 0) {
      this.modalManager.alert('저장된 문서가 없습니다.');
      return;
    }

    const content = `
      <div class="mb-4">
        <input type="text" id="doc-search" placeholder="문서 검색..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
      </div>
      <div id="documents-list" class="space-y-2 max-h-96 overflow-y-auto">
        ${this.renderDocumentsList(documents)}
      </div>
    `;

    this.modalManager.show('documents-list', {
      title: '내 문서',
      content: content,
      size: 'large',
      buttons: [
        { label: '닫기', action: 'close', className: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600' }
      ]
    });

    // 검색 기능
    setTimeout(() => {
      const searchInput = document.getElementById('doc-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value;
          const filtered = StorageManager.searchDocuments(query);
          document.getElementById('documents-list').innerHTML = this.renderDocumentsList(filtered);
          this.setupDocumentListEvents();
        });
      }

      this.setupDocumentListEvents();
    }, 100);
  }

  /**
   * 문서 목록 렌더링
   * @param {Array} documents - 문서 배열
   * @returns {string} HTML
   */
  renderDocumentsList(documents) {
    return documents.map(doc => {
      const date = new Date(doc.lastModified).toLocaleString('ko-KR');
      const preview = doc.content.substring(0, 100).replace(/\n/g, ' ');

      return `
        <div class="doc-item p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors" data-doc-id="${doc.id}">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h5 class="font-semibold text-gray-900 dark:text-white">${doc.title}</h5>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${preview}...</p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">${date}</p>
            </div>
            <button class="doc-delete ml-2 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded" data-doc-id="${doc.id}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * 문서 목록 이벤트 설정
   */
  setupDocumentListEvents() {
    // 문서 클릭 (로드)
    document.querySelectorAll('.doc-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.doc-delete')) return;

        const docId = parseInt(item.dataset.docId);
        const document = StorageManager.getDocument(docId);

        if (document) {
          window.dispatchEvent(new CustomEvent('load-document', {
            detail: { document }
          }));
          this.modalManager.close('documents-list');
          this.showToast('success', '문서를 불러왔습니다.');
        }
      });
    });

    // 문서 삭제
    document.querySelectorAll('.doc-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        const docId = parseInt(btn.dataset.docId);

        this.modalManager.confirm('이 문서를 삭제하시겠습니까?', () => {
          StorageManager.deleteDocument(docId);
          this.showToast('success', '문서가 삭제되었습니다.');

          // 목록 새로고침
          const documents = StorageManager.getAllDocuments();
          document.getElementById('documents-list').innerHTML = this.renderDocumentsList(documents);
          this.setupDocumentListEvents();
        });
      });
    });
  }

  /**
   * 도움말 모달 표시
   */
  showHelp() {
    const content = `
      <div class="text-gray-800 dark:text-gray-200">
        <h4 class="font-bold text-lg mb-3 text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">단축키</h4>
        <table class="w-full text-sm mb-6 border-collapse">
          <tbody>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="py-2 w-1/3"><kbd class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-800 dark:text-gray-300">Ctrl/Cmd + S</kbd></td>
              <td class="py-2 text-gray-600 dark:text-gray-400">문서 저장</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="py-2"><kbd class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-800 dark:text-gray-300">Ctrl/Cmd + B</kbd></td>
              <td class="py-2 text-gray-600 dark:text-gray-400">굵게</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="py-2"><kbd class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-800 dark:text-gray-300">Ctrl/Cmd + I</kbd></td>
              <td class="py-2 text-gray-600 dark:text-gray-400">기울임</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="py-2"><kbd class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-800 dark:text-gray-300">Ctrl/Cmd + K</kbd></td>
              <td class="py-2 text-gray-600 dark:text-gray-400">링크 삽입</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="py-2"><kbd class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-800 dark:text-gray-300">Ctrl/Cmd + P</kbd></td>
              <td class="py-2 text-gray-600 dark:text-gray-400">PDF 변환</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="py-2"><kbd class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-800 dark:text-gray-300">Tab</kbd></td>
              <td class="py-2 text-gray-600 dark:text-gray-400">들여쓰기</td>
            </tr>
            <tr>
              <td class="py-2"><kbd class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-800 dark:text-gray-300">Shift + Tab</kbd></td>
              <td class="py-2 text-gray-600 dark:text-gray-400">내어쓰기</td>
            </tr>
          </tbody>
        </table>

        <h4 class="font-bold text-lg mb-3 text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">마크다운 문법</h4>
        <ul class="list-disc pl-5 space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs"># 제목 1</code> - 가장 큰 제목 (선택한 문서 템플릿에 따라 아래쪽에 밑줄 같은 전용 스타일이 입혀집니다.)</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">## 제목 2</code> - 중간 제목</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">**굵게**</code> - 굵은 글씨</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">_기울임_</code> - 기울임</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">\`코드\`</code> - 인라인 코드</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">- 항목</code> - 목록</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">[링크](URL)</code> - 링크</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">![이미지](URL)</code> - 이미지</li>
        </ul>

        <h4 class="font-bold text-lg mb-2 text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">문의</h4>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">문제가 발생하거나 제안사항이 있으시면 GitHub 이슈를 등록해주세요.</p>
      </div>
    `;

    this.modalManager.show('help', {
      title: '도움말',
      content: content,
      size: 'large',
      buttons: [
        { label: '닫기', action: 'close', className: 'bg-blue-600 text-white hover:bg-blue-700' }
      ]
    });
  }

  /**
   * 전체화면 토글
   * @param {HTMLElement} element - 요소
   */
  toggleFullscreen(element) {
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
        this.showToast('error', '전체화면 모드를 지원하지 않습니다.');
      });
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * 로딩 표시
   * @param {string} message - 메시지
   * @returns {string} 모달 ID
   */
  showLoading(message) {
    return this.modalManager.loading(message);
  }

  /**
   * 로딩 숨김
   * @param {string} id - 모달 ID
   */
  hideLoading(id) {
    this.modalManager.close(id);
  }

  /**
   * 진행률 표시
   * @param {string} message - 메시지
   * @returns {Object} 진행률 컨트롤러
   */
  showProgress(message) {
    return this.modalManager.progress(message);
  }

  /**
   * 폰트 크기 변경
   * @param {number} delta - 변경할 폰트 크기 증감치
   */
  changeFontSize(delta) {
    this.currentFontSize = Math.max(12, Math.min(32, this.currentFontSize + delta));
    this.applyFontSize();
    this.showToast('info', `글꼴 크기: ${this.currentFontSize}px`, 1500);

    // 설정 저장
    const settings = StorageManager.getSettings();
    settings.fontSize = this.currentFontSize;
    StorageManager.saveSettings(settings);
  }

  /**
   * 도큐먼트에 폰트 크기 적용
   */
  applyFontSize() {
    const editor = document.getElementById('markdown-editor');
    const preview = document.getElementById('markdown-preview');
    
    // 에디터와 미리보기 모두에 폰트 크기 적용
    if (editor) editor.style.fontSize = `${this.currentFontSize}px`;
    if (preview) preview.style.fontSize = `${this.currentFontSize}px`;
  }
}
