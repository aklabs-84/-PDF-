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

    // 되돌리기/다시 실행
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        if (window.app && window.app.editorManager) {
          window.app.editorManager.undo();
        }
      });
    }

    const redoBtn = document.getElementById('redo-btn');
    if (redoBtn) {
      redoBtn.addEventListener('click', () => {
        if (window.app && window.app.editorManager) {
          window.app.editorManager.redo();
        }
      });
    }

    // 동적 컨트롤 삽입 (에디터 전체 보기 및 프리뷰 영역 헤더)
    const editorHeader = document.getElementById('fullscreen-editor-btn')?.parentElement;
    if (editorHeader && !document.getElementById('header-copy-all-btn')) {
      const fullscreenEditorBtn = document.getElementById('fullscreen-editor-btn');
      const wrapper = document.createElement('div');
      wrapper.className = 'flex items-center space-x-1';
      editorHeader.insertBefore(wrapper, fullscreenEditorBtn);
      
      const copyBtnHtml = `
        <button id="header-copy-all-btn" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="문서 내용 단일 복사">
          <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        </button>
      `;
      wrapper.insertAdjacentHTML('beforeend', copyBtnHtml);
      wrapper.appendChild(fullscreenEditorBtn);
      
      document.getElementById('header-copy-all-btn').addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('copy-all'));
      });
    }

    const previewHeader = document.getElementById('fullscreen-preview-btn')?.parentElement;
    if (previewHeader && !document.getElementById('header-help-btn')) {
      const fullscreenPreviewBtn = document.getElementById('fullscreen-preview-btn');
      const wrapper = document.createElement('div');
      wrapper.className = 'flex items-center space-x-1';
      previewHeader.insertBefore(wrapper, fullscreenPreviewBtn);
      
      const helpBtnHtml = `
        <button id="header-copy-preview-btn" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="렌더링 결과 복사 (서식 유지)">
          <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        </button>
        <button id="header-help-btn" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="도움말">
          <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
      `;
      wrapper.insertAdjacentHTML('beforeend', helpBtnHtml);
      wrapper.appendChild(fullscreenPreviewBtn);

      document.getElementById('header-copy-preview-btn').addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('copy-preview'));
      });
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

    // 학습 가이드
    const guideBtn = document.getElementById('guide-btn');
    if (guideBtn) {
      guideBtn.addEventListener('click', () => this.showGuide());
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
      'math-btn': () => window.dispatchEvent(new CustomEvent('markdown-math')),
      'diagram-btn': () => window.dispatchEvent(new CustomEvent('markdown-mermaid')),
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
   * 학습 가이드 표시
   */
  showGuide() {
    const currentContent = window.app.editorManager.getContent();
    
    // 내용이 있는 경우 덮어쓰기 경고
    if (currentContent.trim() && currentContent.length > 50) {
      this.modalManager.confirm('현재 작성 중인 내용이 지워지고 가이드 문서가 로드됩니다. 계속하시겠습니까?', () => {
        this.loadGuideContent();
      });
    } else {
      this.loadGuideContent();
    }
  }

  /**
   * 가이드 콘텐츠 로드
   */
  loadGuideContent() {
    const guideContent = `# 🚀 마크다운 노트 완벽 활용 가이드

환영합니다! 이 문서는 마크다운 노트의 모든 기능을 직접 체험해 볼 수 있는 튜토리얼입니다.
좌측 에디터의 내용을 자유롭게 수정하면서 우측 미리보기가 어떻게 변하는지 알아보고 기능을 숙지하세요!

---

## 1. 🌟 기본 텍스트 서식

마우스 사용 없이도 에디터 빈 줄에서 \`/\` (슬래시)를 입력하여 **마법의 드롭다운 메뉴**를 호출할 수 있습니다.
키보드 방향키와 커맨드로 빠르게 서식을 지정하세요.

- **굵은 글씨**: \`Ctrl/Cmd + B\`를 누르거나 툴바의 **B**를 클릭하세요. -> **이것은 굵은 글씨입니다.**
- *기울임*: \`Ctrl/Cmd + I\`를 누르거나 툴바의 *I*를 클릭하세요. -> *이것은 기울임 글씨입니다.*
- ~~취소선~~: 툴바의 'S' 버튼을 클릭하세요. -> ~~이것은 취소선입니다.~~
- \`인라인 코드\`: 백틱(\`)으로 텍스트를 감싸세요.
- [링크](https://litt.ly/aklabs): 툴바의 '링크' 버튼을 클릭하세요.

---

## 2. ✅ 스마트 할 일 목록 (Checklist)

할 일 목록을 만들고 미리보기 창에서 직접 클릭하여 완료 처리해 보세요! 완료 시 취소선이 시각적으로 예쁘게 적용됩니다.

- [x] 장보기 (미리보기에서 클릭 완료됨)
- [ ] 마크다운 노트 가이드 읽기
- [ ] 슬래시(/) 명령어 호출하기

---

## 3. 🧮 수학 수식 (KaTeX)

복잡한 수식을 LaTeX 문법으로 아름답게 렌더링 할 수 있습니다. 빈 줄에서 \`/\`를 누르고 **'수식 (KaTeX)'**을 선택해 보세요.

$$
  E = mc^2
$$

아래처럼 복잡한 렌더링도 가능합니다.

$$
  f(x) = \\int_{-\\infty}^\\infty \\hat f(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi
$$

---

## 4. 📊 다이어그램 (Mermaid)

텍스트로 그리는 차트! 마우스 없이 프로그래밍 하듯 순서도를 작성할 수 있습니다. \`/\`를 누르고 **'다이어그램 (Mermaid)'**을 선택하세요.

\`\`\`mermaid
graph TD
    A[시작] --> B{결정}
    B -- 예 --> C[마크다운 배우기]
    C --> D[마스터!]
    B -- 아니요 --> E[명령어 입력하기]
    E --> C
\`\`\`

---

## 5. 💻 코드 블록 (Syntax Highlighting)

개발자들을 위한 강력한 문법 하이라이팅을 지원합니다.

\`\`\`javascript
// 간단한 함수 작성하기
function greet(name) {
  console.log(\`안녕하세요, \${name}님!\`);
  return true;
}

greet("마크다운");
\`\`\`

---

## 6. 📝 표 (Tables)

데이터를 깔끔하게 정리하는 테이블입니다. 빈 줄에서 \`/\`를 치고 표를 삽입하세요.

| 기능 | 목적 | 난이도 |
| :--- | :--- | :---: |
| 스마트 붙여넣기 | 자동 변환 | ⭐ |
| 슬래시 명령어 | 빠른 마크업 | ⭐⭐ |
| **다이어그램** | **시각화** | ⭐⭐⭐ |

---

> 💡 **Tip:** 화면 상단의 전체화면 아이콘을 눌러 에디터나 미리보기에 집중할 수 있습니다! 다 읽으셨다면 빈 줄에서 \`/\`를 입력해 나만의 문서를 만들어 보세요.`;

    window.app.editorManager.setContent(guideContent);
    this.showToast('success', '학습 가이드가 성공적으로 로드되었습니다.');
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
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs"># 제목 1</code> - 가장 큰 제목 (기본 밑줄 테마 적용)</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">## 제목 2</code> - 중간 제목</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">**굵게**</code> - 굵은 글씨</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">_기울임_</code> - 기울임</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">\`코드\`</code> - 인라인 코드</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">- 항목</code> - 목록</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">[링크](URL)</code> - 링크</li>
          <li><code class="text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">![이미지](URL)</code> - 이미지</li>
        </ul>

        <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
          <p class="font-bold flex items-center mb-1 text-yellow-800 dark:text-yellow-400"><span class="mr-1">⚠️</span> HTML 이미지 태그 렌더링 안내</p>
          <p class="mb-1">보안(XSS 해킹 방지)을 위해 <code>&lt;img src="..."&gt;</code> 와 같은 직접적인 HTML 태그는 미리보기 화면에서 <strong>무시되어 빈 칸으로 표시</strong>됩니다.</p>
          <p>이미지가 보이게 하려면 반드시 위 가이드의 마크다운 전용 문법인 <code>![대체텍스트](이미지URL)</code> 형태로 변환하여 사용해 주세요.</p>
        </div>

        <h4 class="font-bold text-lg mb-2 text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700 mt-6">문의</h4>
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
