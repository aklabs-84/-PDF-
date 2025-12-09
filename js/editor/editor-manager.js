/**
 * EditorManager - 마크다운 에디터 관리 클래스
 * 에디터 초기화, 실시간 미리보기, 자동 저장 기능 제공
 */
class EditorManager {
  constructor() {
    this.textarea = null;
    this.preview = null;
    this.markdownHelper = null;
    this.autoSaveInterval = 30000; // 30초
    this.autoSaveTimer = null;
    this.currentDocument = null;
    this.isModified = false;
    this.updatePreviewDebounced = null;
    this.plainTextMode = false; // 일반 텍스트 모드 여부
  }

  /**
   * 에디터 초기화
   * @param {string} textareaId - 텍스트영역 ID
   * @param {string} previewId - 미리보기 영역 ID
   */
  init(textareaId, previewId) {
    this.textarea = document.getElementById(textareaId);
    this.preview = document.getElementById(previewId);

    if (!this.textarea || !this.preview) {
      console.error('Editor elements not found');
      return;
    }

    // MarkdownHelper 초기화
    this.markdownHelper = new MarkdownHelper(this.textarea);

    // 이벤트 리스너 설정
    this.setupEventListeners();

    // 디바운스된 미리보기 업데이트 함수
    this.updatePreviewDebounced = this.debounce(() => {
      this.updatePreview();
    }, 300);

    // 자동 저장 시작
    this.startAutoSave();

    // 저장된 문서 불러오기
    this.loadLastDocument();

    // Marked.js 옵션 설정
    this.configureMarked();

    console.log('EditorManager initialized');
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 입력 이벤트 (실시간 미리보기)
    this.textarea.addEventListener('input', () => {
      this.isModified = true;
      this.updatePreviewDebounced();
      this.updateStats();
    });

    // 키다운 이벤트 (단축키)
    this.textarea.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    // 스크롤 동기화
    this.textarea.addEventListener('scroll', () => {
      this.syncScroll();
    });

    // 탭 키 처리
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          this.markdownHelper.outdent();
        } else {
          this.markdownHelper.indent();
        }
      }
    });

    // 붙여넣기 이벤트
    this.textarea.addEventListener('paste', (e) => {
      this.handlePaste(e);
    });

    // 모드 변경 이벤트
    window.addEventListener('mode-changed', (e) => {
      this.setPlainTextMode(e.detail.plainTextMode);
    });
  }

  /**
   * 키보드 단축키 처리
   * @param {KeyboardEvent} e - 키보드 이벤트
   */
  handleKeydown(e) {
    // Ctrl/Cmd + 키 조합
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          this.saveDocument();
          break;
        case 'b':
          e.preventDefault();
          this.markdownHelper.bold();
          break;
        case 'i':
          e.preventDefault();
          this.markdownHelper.italic();
          break;
        case 'k':
          e.preventDefault();
          this.insertLink();
          break;
        case 'p':
          e.preventDefault();
          this.exportToPDF();
          break;
        case 'z':
          // 브라우저 기본 실행 취소 사용
          break;
        case 'y':
          // 브라우저 기본 다시 실행 사용
          break;
      }
    }
  }

  /**
   * 붙여넣기 처리
   * @param {ClipboardEvent} e - 붙여넣기 이벤트
   */
  handlePaste(e) {
    // HTML 붙여넣기 처리 (향후 구현 가능)
    // 현재는 기본 동작 허용
  }

  /**
   * Marked.js 설정
   */
  configureMarked() {
    if (typeof marked === 'undefined') {
      console.error('Marked.js not loaded');
      return;
    }

    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // 줄바꿈을 <br>로 변환
      headerIds: true,
      mangle: false,
      pedantic: false,
      sanitize: false, // HTML 허용
      smartLists: true,
      smartypants: false,
      highlight: (code, lang) => {
        if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (err) {
            console.error('Highlight error:', err);
          }
        }
        return code;
      }
    });
  }

  /**
   * 미리보기 업데이트
   */
  updatePreview() {
    const content = this.textarea.value;

    if (!content.trim()) {
      this.preview.innerHTML = '<p class="text-gray-400">미리보기가 여기에 표시됩니다...</p>';
      return;
    }

    // 일반 텍스트 모드
    if (this.plainTextMode) {
      this.updatePlainTextPreview(content);
      return;
    }

    // 마크다운 모드
    try {
      const html = this.parseMarkdown(content);
      this.preview.innerHTML = html;

      // 코드 블록 하이라이팅
      if (typeof hljs !== 'undefined') {
        this.preview.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
      }

      // 체크박스 이벤트 (미리보기에서 체크 가능)
      this.setupCheckboxes();
    } catch (error) {
      console.error('Markdown parse error:', error);
      this.preview.innerHTML = '<p class="text-red-500">마크다운 파싱 오류가 발생했습니다.</p>';
    }
  }

  /**
   * 일반 텍스트 미리보기 업데이트
   * @param {string} content - 일반 텍스트 콘텐츠
   */
  updatePlainTextPreview(content) {
    // HTML 이스케이프 처리
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // 줄바꿈을 <br>로 변환하고, 문단 분리 처리
    const paragraphs = escapedContent.split(/\n\n+/);
    const html = paragraphs
      .map(para => {
        if (!para.trim()) return '';
        const lines = para.split('\n').join('<br>');
        return `<p class="mb-4">${lines}</p>`;
      })
      .filter(p => p)
      .join('');

    this.preview.innerHTML = html || '<p class="text-gray-400">미리보기가 여기에 표시됩니다...</p>';
  }

  /**
   * 마크다운 파싱
   * @param {string} markdown - 마크다운 텍스트
   * @returns {string} HTML
   */
  parseMarkdown(markdown) {
    if (typeof marked === 'undefined') {
      throw new Error('Marked.js not loaded');
    }

    return marked.parse(markdown);
  }

  /**
   * 체크박스 설정 (미리보기에서 토글 가능)
   */
  setupCheckboxes() {
    const checkboxes = this.preview.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox, index) => {
      checkbox.addEventListener('change', () => {
        // 원본 마크다운에서 체크박스 업데이트
        this.toggleCheckboxInMarkdown(index, checkbox.checked);
      });
    });
  }

  /**
   * 마크다운에서 체크박스 토글
   * @param {number} index - 체크박스 인덱스
   * @param {boolean} checked - 체크 상태
   */
  toggleCheckboxInMarkdown(index, checked) {
    const lines = this.textarea.value.split('\n');
    let checkboxCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/- \[([ x])\]/i);
      if (match) {
        if (checkboxCount === index) {
          lines[i] = lines[i].replace(
            /- \[([ x])\]/i,
            checked ? '- [x]' : '- [ ]'
          );
          break;
        }
        checkboxCount++;
      }
    }

    this.textarea.value = lines.join('\n');
    this.isModified = true;
    this.updateStats();
  }

  /**
   * 스크롤 동기화
   */
  syncScroll() {
    const scrollPercentage = this.textarea.scrollTop /
      (this.textarea.scrollHeight - this.textarea.clientHeight);

    this.preview.scrollTop = scrollPercentage *
      (this.preview.scrollHeight - this.preview.clientHeight);
  }

  /**
   * 통계 업데이트 (문자 수, 단어 수, 줄 수)
   */
  updateStats() {
    const content = this.textarea.value;

    const charCount = MarkdownHelper.countCharacters(content);
    const wordCount = MarkdownHelper.countWords(content);
    const lineCount = MarkdownHelper.countLines(content);

    const charCountEl = document.getElementById('char-count');
    const wordCountEl = document.getElementById('word-count');
    const lineCountEl = document.getElementById('line-count');

    if (charCountEl) charCountEl.textContent = `${charCount.toLocaleString()} 자`;
    if (wordCountEl) wordCountEl.textContent = `${wordCount.toLocaleString()} 단어`;
    if (lineCountEl) lineCountEl.textContent = `${lineCount.toLocaleString()} 줄`;
  }

  /**
   * 자동 저장 시작
   */
  startAutoSave() {
    this.autoSaveTimer = setInterval(() => {
      if (this.isModified) {
        this.saveDocument(true);
      }
    }, this.autoSaveInterval);
  }

  /**
   * 자동 저장 중지
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 문서 저장
   * @param {boolean} isAutoSave - 자동 저장 여부
   */
  saveDocument(isAutoSave = false) {
    const content = this.textarea.value;
    const title = MarkdownHelper.extractTitle(content);

    const document = {
      id: this.currentDocument?.id || Date.now(),
      title: title,
      content: content,
      lastModified: new Date().toISOString(),
      createdAt: this.currentDocument?.createdAt || new Date().toISOString()
    };

    const success = StorageManager.saveDocument(document);

    if (success) {
      this.currentDocument = document;
      this.isModified = false;

      // 저장 상태 표시
      this.showSaveStatus(isAutoSave);
    } else {
      if (!isAutoSave) {
        this.showError('문서 저장에 실패했습니다.');
      }
    }
  }

  /**
   * 저장 상태 표시
   * @param {boolean} isAutoSave - 자동 저장 여부
   */
  showSaveStatus(isAutoSave) {
    const statusEl = document.getElementById('auto-save-status');
    if (!statusEl) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    statusEl.innerHTML = `
      <svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      <span>${isAutoSave ? '자동 저장됨' : '저장됨'} (${timeStr})</span>
    `;
  }

  /**
   * 마지막 문서 불러오기
   */
  loadLastDocument() {
    const documents = StorageManager.getRecentDocuments(1);
    if (documents.length > 0) {
      this.loadDocument(documents[0]);
    } else {
      // 기본 템플릿
      this.loadDefaultContent();
    }
  }

  /**
   * 문서 불러오기
   * @param {Object} document - 문서 객체
   */
  loadDocument(document) {
    this.currentDocument = document;
    this.textarea.value = document.content;
    this.isModified = false;
    this.updatePreview();
    this.updateStats();
  }

  /**
   * 기본 콘텐츠 불러오기
   */
  loadDefaultContent() {
    const defaultContent = `# 환영합니다!

한글 PDF 변환기를 사용해주셔서 감사합니다.

## 기능

- **실시간 미리보기**: 왼쪽에 마크다운을 입력하면 오른쪽에서 실시간으로 미리보기를 확인할 수 있습니다.
- **자동 저장**: 30초마다 자동으로 저장됩니다.
- **PDF 변환**: 작성한 문서를 아름다운 PDF로 변환할 수 있습니다.

## 마크다운 사용법

### 제목
\`# 제목 1\`, \`## 제목 2\`, \`### 제목 3\`

### 텍스트 서식
**굵은 글씨**, _기울임_, ~~취소선~~, \`코드\`

### 목록
- 순서 없는 목록
- 항목 2

1. 순서 있는 목록
2. 항목 2

### 링크와 이미지
[링크 텍스트](https://example.com)
![이미지 설명](https://via.placeholder.com/150)

### 코드 블록
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### 인용구
> 이것은 인용구입니다.

### 표
| 제목 1 | 제목 2 |
|--------|--------|
| 내용 1 | 내용 2 |

---

이제 시작해보세요! 🚀`;

    this.textarea.value = defaultContent;
    this.updatePreview();
    this.updateStats();
  }

  /**
   * 새 문서 생성
   */
  newDocument() {
    if (this.isModified) {
      const confirm = window.confirm('저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?');
      if (!confirm) return;
    }

    this.currentDocument = null;
    this.textarea.value = '';
    this.isModified = false;
    this.updatePreview();
    this.updateStats();
    this.textarea.focus();
  }

  /**
   * 링크 삽입 (프롬프트 사용)
   */
  insertLink() {
    const selection = this.markdownHelper.getSelection();
    const text = selection.text || '링크 텍스트';

    const url = prompt('URL을 입력하세요:', 'https://');
    if (url) {
      this.markdownHelper.link(url, text);
    }
  }

  /**
   * PDF 내보내기 (이벤트 발생)
   */
  exportToPDF() {
    const event = new CustomEvent('export-pdf', {
      detail: {
        content: this.textarea.value
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * 에러 표시
   * @param {string} message - 에러 메시지
   */
  showError(message) {
    const event = new CustomEvent('show-toast', {
      detail: {
        type: 'error',
        message: message
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * 디바운스 유틸리티
   * @param {Function} func - 실행할 함수
   * @param {number} delay - 지연 시간 (ms)
   * @returns {Function} 디바운스된 함수
   */
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * 에디터 파괴 (정리)
   */
  destroy() {
    this.stopAutoSave();
    // 이벤트 리스너 제거는 브라우저가 자동으로 처리
  }

  /**
   * 현재 내용 가져오기
   * @returns {string} 마크다운 내용
   */
  getContent() {
    return this.textarea.value;
  }

  /**
   * 내용 설정
   * @param {string} content - 마크다운 내용
   */
  setContent(content) {
    this.textarea.value = content;
    this.isModified = true;
    this.updatePreview();
    this.updateStats();
  }

  /**
   * 전체화면 토글
   * @param {HTMLElement} element - 전체화면할 요소
   */
  toggleFullscreen(element) {
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * 텍스트 모드 설정
   * @param {boolean} isPlainText - 일반 텍스트 모드 여부
   */
  setPlainTextMode(isPlainText) {
    this.plainTextMode = isPlainText;
    this.updatePreview();
    this.updateEditorTitle();
    this.updatePreviewTitle();
    this.updateEditorPlaceholder();
  }

  /**
   * 에디터 제목 업데이트
   */
  updateEditorTitle() {
    const editorTitle = document.getElementById('editor-title');
    if (editorTitle) {
      editorTitle.textContent = this.plainTextMode ? '텍스트 에디터' : '마크다운 에디터';
    }
  }

  /**
   * 미리보기 제목 업데이트
   */
  updatePreviewTitle() {
    const previewTitle = document.getElementById('preview-title');
    if (previewTitle) {
      previewTitle.textContent = this.plainTextMode ? '텍스트 미리보기' : '마크다운 미리보기';
    }
  }

  /**
   * 에디터 placeholder 업데이트
   */
  updateEditorPlaceholder() {
    if (!this.textarea) return;

    if (this.plainTextMode) {
      // 일반 텍스트 모드 placeholder
      this.textarea.placeholder = `여기에 텍스트를 입력하세요...

제목 1번글 PDF 변환기를 사용해주셔서 감사합니다.

기능

실시간 미리보기: 원쪽에 마크다운을 입력하면 오른쪽에서 실시간으로 미리보기를 확인할 수 있습니다.
자동 저장: 30초마다 자동으로 저장됩니다.
PDF 변환: 작성한 문서를 아름다운 PDF로 변환할 수 있습니다.`;
    } else {
      // 마크다운 모드 placeholder
      this.textarea.placeholder = `여기에 마크다운을 입력하세요...

# 제목 1
## 제목 2

**굵은 글씨** _기울임_ \`코드\`

- 목록 1
- 목록 2

[링크](https://example.com)`;
    }
  }
}
