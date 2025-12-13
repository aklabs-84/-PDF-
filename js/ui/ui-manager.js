/**
 * UIManager - UI 컨트롤 및 이벤트 관리 클래스
 * 버튼, 테마, 토스트 등 UI 요소 관리
 */
class UIManager {
  constructor() {
    this.modalManager = new ModalManager();
    this.currentTheme = 'light';
    this.plainTextMode = false; // 기본은 마크다운 모드
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
    if (settings.plainTextMode) {
      this.plainTextMode = settings.plainTextMode;
      const modeLabel = document.getElementById('mode-label');
      if (modeLabel) {
        modeLabel.textContent = this.plainTextMode ? '일반 텍스트' : '마크다운';
      }
      // 마크다운 버튼 상태 설정
      if (this.plainTextMode) {
        setTimeout(() => {
          const markdownButtons = document.querySelectorAll('#bold-btn, #italic-btn, #heading-btn, #link-btn, #list-btn, #code-btn');
          markdownButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
          });
        }, 100);
      }

      // EditorManager에 초기 모드 전달
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('mode-changed', {
          detail: { plainTextMode: this.plainTextMode }
        }));
      }, 200);
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

    // 템플릿 선택
    const templateBtn = document.getElementById('template-btn');
    if (templateBtn) {
      templateBtn.addEventListener('click', () => this.showTemplateSelector());
    }

    // PDF 변환
    const exportBtn = document.getElementById('export-pdf-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('export-pdf'));
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

    // 모드 토글
    const modeToggleBtn = document.getElementById('mode-toggle-btn');
    if (modeToggleBtn) {
      modeToggleBtn.addEventListener('click', () => this.toggleMode());
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
      'heading-btn': () => window.dispatchEvent(new CustomEvent('markdown-heading')),
      'link-btn': () => window.dispatchEvent(new CustomEvent('markdown-link')),
      'list-btn': () => window.dispatchEvent(new CustomEvent('markdown-list')),
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
      <div class="prose dark:prose-invert max-w-none">
        <h4>단축키</h4>
        <table class="w-full">
          <tr><td><kbd>Ctrl/Cmd + S</kbd></td><td>문서 저장</td></tr>
          <tr><td><kbd>Ctrl/Cmd + B</kbd></td><td>굵게</td></tr>
          <tr><td><kbd>Ctrl/Cmd + I</kbd></td><td>기울임</td></tr>
          <tr><td><kbd>Ctrl/Cmd + K</kbd></td><td>링크 삽입</td></tr>
          <tr><td><kbd>Ctrl/Cmd + P</kbd></td><td>PDF 변환</td></tr>
          <tr><td><kbd>Tab</kbd></td><td>들여쓰기</td></tr>
          <tr><td><kbd>Shift + Tab</kbd></td><td>내어쓰기</td></tr>
        </table>

        <h4 class="mt-6">마크다운 문법</h4>
        <ul>
          <li><code># 제목</code> - 제목 (H1~H6)</li>
          <li><code>**굵게**</code> - 굵은 글씨</li>
          <li><code>_기울임_</code> - 기울임</li>
          <li><code>\`코드\`</code> - 인라인 코드</li>
          <li><code>- 항목</code> - 목록</li>
          <li><code>[링크](URL)</code> - 링크</li>
          <li><code>![이미지](URL)</code> - 이미지</li>
        </ul>

        <h4 class="mt-6">문의</h4>
        <p>문제가 발생하거나 제안사항이 있으시면 GitHub 이슈를 등록해주세요.</p>
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
   * 텍스트 모드 토글 (마크다운 <-> 일반 텍스트)
   */
  toggleMode() {
    this.plainTextMode = !this.plainTextMode;
    const modeLabel = document.getElementById('mode-label');
    const markdownButtons = document.querySelectorAll('#bold-btn, #italic-btn, #heading-btn, #link-btn, #list-btn, #code-btn');

    if (this.plainTextMode) {
      // 일반 텍스트 모드
      modeLabel.textContent = '일반 텍스트';
      // 마크다운 버튼 비활성화
      markdownButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      });
      this.showToast('info', '일반 텍스트 모드로 전환되었습니다.', 2000);
    } else {
      // 마크다운 모드
      modeLabel.textContent = '마크다운';
      // 마크다운 버튼 활성화
      markdownButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      });
      this.showToast('info', '마크다운 모드로 전환되었습니다.', 2000);
    }

    // EditorManager에 모드 변경 알림
    window.dispatchEvent(new CustomEvent('mode-changed', {
      detail: { plainTextMode: this.plainTextMode }
    }));

    // 설정 저장
    const settings = StorageManager.getSettings();
    settings.plainTextMode = this.plainTextMode;
    StorageManager.saveSettings(settings);
  }

  /**
   * 텍스트 모드 가져오기
   * @returns {boolean} 일반 텍스트 모드 여부
   */
  getPlainTextMode() {
    return this.plainTextMode;
  }
}
