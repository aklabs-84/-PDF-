/**
 * EditorManager - 마크다운 에디터 관리 클래스
 * 에디터 초기화, 실시간 미리보기, 자동 저장 기능 제공
 */
class EditorManager {
  constructor() {
    this.textarea = null;
    this.preview = null;
    this.markdownHelper = null;
    this.pasteHandler = null; // Smart paste handler 
    this.autoSaveInterval = 30000; // 30초
    this.autoSaveTimer = null;
    this.currentDocument = null;
    this.isModified = false;
    this.updatePreviewDebounced = null;
    
    // 실행 취소/다시 실행을 위한 히스토리
    this.history = [];
    this.historyIndex = -1;
    this.maxHistoryLength = 50;
    this.isHandlingHistory = false;
    this.saveHistoryDebounced = null;
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

    // MarkdownHelper, PasteHandler, & SlashMenu 초기화
    this.markdownHelper = new MarkdownHelper(this.textarea);
    this.pasteHandler = new PasteHandler(this.textarea);
    if (typeof SlashMenu !== 'undefined') {
      this.slashMenu = new SlashMenu(this);
    }

    // 이벤트 리스너 설정
    this.setupEventListeners();

    // 디바운스된 미리보기 업데이트 함수
    this.updatePreviewDebounced = this.debounce(() => {
      this.updatePreview();
    }, 300);

    // 디바운스된 히스토리 저장 함수
    this.saveHistoryDebounced = this.debounce((content, cursorStart, cursorEnd) => {
      this.saveHistoryState(content, cursorStart, cursorEnd);
    }, 500);

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
    // 입력 이벤트 (실시간 미리보기 & 히스토리)
    this.textarea.addEventListener('input', () => {
      this.isModified = true;
      this.updatePreviewDebounced();
      this.updateStats();
      
      if (!this.isHandlingHistory) {
         this.saveHistoryDebounced(this.textarea.value, this.textarea.selectionStart, this.textarea.selectionEnd);
      }
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
          e.preventDefault();
          this.undo();
          break;
        case 'y':
          e.preventDefault();
          this.redo();
          break;
      }
    }
  }

  /**
   * 붙여넣기 처리
   * @param {ClipboardEvent} e - 붙여넣기 이벤트
   */
  handlePaste(e) {
    if (this.pasteHandler) {
      this.pasteHandler.handlePaste(e);
    }
  }

  /**
   * 텍스트 형식 자동 정리 (빈 줄, 들여쓰기)
   */
  formatText() {
    if (this.pasteHandler) {
      this.pasteHandler.formatText();
    }
  }

  /**
   * 현재 상태를 히스토리에 저장
   */
  saveHistoryState(content, start, end) {
    // 히스토리 인덱스가 마지막이 아니면 (undo를 한 상태에서 새 입력 시) 뒤의 히스토리 삭제
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // 내용이 변경되지 않았으면 저장하지 않음
    if (this.history.length > 0 && this.history[this.history.length - 1].content === content) {
      return;
    }

    this.history.push({
      content: content,
      selectionStart: start,
      selectionEnd: end
    });

    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  /**
   * 되돌리기 (Undo)
   */
  undo() {
    if (this.historyIndex > 0) {
      // 만약 현재 히스토리 인덱스가 -1이 아니고 진행 중이었다면
      this.historyIndex--;
      this.applyHistoryState();
    }
  }

  /**
   * 다시 실행 (Redo)
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.applyHistoryState();
    }
  }

  /**
   * 히스토리 상태 적용
   */
  applyHistoryState() {
    if (this.historyIndex >= 0 && this.historyIndex < this.history.length) {
      this.isHandlingHistory = true;
      const state = this.history[this.historyIndex];
      
      this.textarea.value = state.content;
      this.textarea.selectionStart = state.selectionStart;
      this.textarea.selectionEnd = state.selectionEnd;
      this.textarea.focus();
      
      this.isModified = true;
      this.updatePreview();
      this.updateStats();
      
      // 상태 적용 후 타이머 해제
      setTimeout(() => {
        this.isHandlingHistory = false;
      }, 10);
    }
  }

  /**
   * Marked.js 설정
   */
  configureMarked() {
    if (typeof marked === 'undefined') {
      console.error('Marked.js not loaded');
      return;
    }

    // Marked.js 기본 옵션 설정
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // 줄바꿈을 <br>로 변환
      headerIds: true,
      mangle: false,
      pedantic: false,
      sanitize: false, // HTML 허용
      smartLists: true,
      smartypants: false
    });

    // 커스텀 렌더러 확장 - marked.use()로 부분 오버라이드
    try {
      const renderer = {
        table(header, body) {
          if (body) body = `<tbody>${body}</tbody>`;
          return '<table class="kpdf-table">\n'
            + '<thead>\n'
            + header
            + '</thead>\n'
            + body
            + '</table>\n';
        },
        code(code, infostring) {
          const lang = (infostring || '').match(/\S*/)[0];
          
          if (lang === 'mermaid') {
            const escapedMermaid = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
            // 초기 코드를 보존하기 위해 data attribute 추가
            const encodedSrc = escapedMermaid.replace(/"/g, '&quot;');
            return `<div class="mermaid" data-mermaid-src="${encodedSrc}">${escapedMermaid}</div>\n`;
          }

          if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang) && lang !== 'mermaid') {
            try {
              const highlighted = hljs.highlight(code, { language: lang }).value;
              return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>\n`;
            } catch (err) {
              console.error('Highlight error:', err);
            }
          }
          const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
          return `<pre><code>${escapedCode}</code></pre>\n`;
        }
      };

      marked.use({ renderer });
    } catch (e) {
      console.error('Failed to configure marked renderer:', e);
    }
  }

  /**
   * 이모지 제거 (PDF와 동일하게 표시하기 위함)
   * @param {string} text - 텍스트
   * @returns {string} 이모지가 제거된 텍스트
   */
  removeEmojis(text) {
    // 이모지 유니코드 범위 제거
    return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{E0020}-\u{E007F}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}]|[\u{23F3}]|[\u{25FD}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2705}]|[\u{270A}-\u{270B}]|[\u{2728}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2795}-\u{2797}]|[\u{27B0}]|[\u{27BF}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]/gu, '');
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

    // 마크다운 모드
    try {
      // PDF와 동일하게 표시하기 위해 이모지 제거
      const contentWithoutEmojis = this.removeEmojis(content);
      const html = this.parseMarkdown(contentWithoutEmojis);

      // HTML 문자열인지 확인
      if (typeof html !== 'string') {
        console.error('parseMarkdown did not return a string:', html);
        this.preview.innerHTML = '<p class="text-red-500">마크다운 파싱 오류가 발생했습니다.</p>';
        return;
      }

      this.preview.innerHTML = html;

      // 스타일 적용
      this.applyPreviewStyles();

      // 수식 렌더링 (KaTeX)
      if (typeof renderMathInElement !== 'undefined') {
        try {
          renderMathInElement(this.preview, {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false},
              {left: '\\(', right: '\\)', display: false},
              {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
          });
        } catch (err) {
          console.error('KaTeX error:', err);
        }
      }

      // 다이어그램 렌더링 (Mermaid)
      if (typeof mermaid !== 'undefined') {
        try {
          // 기존에 렌더링된 SVG가 있다면 지우고 텍스트를 복구
          const mermaidNodes = this.preview.querySelectorAll('.mermaid');
          mermaidNodes.forEach((node, index) => {
             // marked.js가 만든 원본 데이터가 data-md 어트리뷰트에 있다면 복구 (없다면 텍스트 컨텐츠 사용)
             const originalCode = node.getAttribute('data-mermaid-src') || node.textContent;
             // 혹시라도 id 때문에 재렌더링 에러가 난다면 id를 부여하거나 제거
             node.removeAttribute('data-processed');
             node.innerHTML = originalCode; // textContent 대신 원래 코드 복원
          });

          // mermaid가 이미 초기화된 엘리먼트를 재처리할 수 있도록 초기화
          mermaid.init(undefined, this.preview.querySelectorAll('.mermaid'));
        } catch (err) {
          console.error('Mermaid error:', err);
        }
      }

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
   * 마크다운 파싱
   * @param {string} markdown - 마크다운 텍스트
   * @returns {string} HTML
   */
  parseMarkdown(markdown) {
    if (typeof marked === 'undefined') {
      throw new Error('Marked.js not loaded');
    }

    // 간단한 전처리: 파이프(|)로 구성된 표 블록이 있는데 구분선(---)이 없다면 자동으로 삽입
    const preprocessed = (function(src) {
      const lines = src.split('\n');
      const out = [];
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];

        // 코드 블록 시작/종료 처리: ``` 블록에서는 변형 금지
        if (/^\s*```/.test(line)) {
          out.push(line);
          i++;
          // 복사해서 끝까지 붙여넣기
          while (i < lines.length && !/^\s*```/.test(lines[i])) {
            out.push(lines[i]);
            i++;
          }
          if (i < lines.length) { out.push(lines[i]); i++; }
          continue;
        }

        // 파이프 포함 행 탐지 (더 유연한 테이블 감지)
        if (line.includes('|') && line.trim().length > 0) {
          // 연속된 파이프 행 블록 수집
          const block = [line];
          let j = i + 1;
          while (j < lines.length) {
            const nextLine = lines[j].trim();
            // 빈 줄이 나오면 테이블 블록 종료
            if (nextLine.length === 0) break;
            // 파이프가 없으면 테이블 블록 종료
            if (!nextLine.includes('|')) break;
            block.push(lines[j]);
            j++;
          }

          // 블록이 1행 이상일 때 두 번째 행이 구분자 패턴인지 검사
          const second = block[1];
          const isSeparator = typeof second !== 'undefined' && (
            /^\s*\|?\s*:?-{3,}(:?\s*\|.*)?$/.test(second.trim()) ||
            second.split('|').some(s=>/-{3,}/.test(s.trim()))
          );

          if (!isSeparator && block.length >= 1) {
            // 헤더 열 개수 계산 (유효한 셀만 카운트)
            // 파이프로 split한 후 앞뒤 빈 문자열 제거
            const cells = block[0].split('|').map(s => s.trim()).filter(s => s.length > 0);
            const colCount = Math.max(cells.length, 1);
            const sep = '| ' + Array(colCount).fill('---').join(' | ') + ' |';

            // 첫 줄(헤더) 출력
            out.push(block[0]);
            // 자동 구분선 삽입
            out.push(sep);

            // 나머지 블록 내용 출력(헤더 이후로 이어지는 행들)
            for (let k = 1; k < block.length; k++) out.push(block[k]);

            i = j;
            continue;
          } else if (isSeparator) {
            // 이미 구분선이 있는 정상적인 테이블인 경우 그대로 출력
            for (const row of block) {
              out.push(row);
            }
            i = j;
            continue;
          }
        }

        out.push(line);
        i++;
      }
      return out.join('\n');
    })(markdown);

    return marked.parse(preprocessed);
  }

  /**
   * 미리보기 영역에 기본 마크다운 스타일 적용
   */
  applyPreviewStyles() {
    if (!this.preview) return;

    const settings = StorageManager.getSettings();

    // 기본 폰트 및 줄간격 설정
    this.preview.style.setProperty('font-family', "'Nanum Gothic', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif", 'important');
    this.preview.style.setProperty('line-height', "1.6", 'important');
    
    // 다크모드 감지
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // 색상 설정
    const primaryColor = isDarkMode ? '#f9fafb' : '#333333';
    const accentColor = isDarkMode ? '#60a5fa' : '#3b82f6';
    const codeColor = isDarkMode ? '#374151' : '#f5f5f5';
    const codeTextColor = isDarkMode ? '#e5e7eb' : '#333333';
    
    this.preview.style.setProperty('color', primaryColor, 'important');

    // 스타일 태그 주입
    const styleId = 'markdown-preview-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const headingStyles = `
      #${this.preview.id} h1 { 
        font-size: 26px; 
        color: ${primaryColor}; 
        padding-bottom: 8px;
        margin-bottom: 20px;
        font-weight: 700;
      }
      #${this.preview.id} h2 { font-size: 21px; color: ${primaryColor}; font-weight: 600; margin-top: 24px; margin-bottom: 16px; }
      #${this.preview.id} h3 { font-size: 18px; color: ${primaryColor}; font-weight: 600; margin-top: 20px; margin-bottom: 12px; }
      #${this.preview.id} h4 { font-size: 16px; color: ${primaryColor}; font-weight: 600; margin-top: 16px; margin-bottom: 8px; }
      #${this.preview.id} h5 { font-size: 14px; color: ${primaryColor}; font-weight: 600; }
      #${this.preview.id} h6 { font-size: 12px; color: ${primaryColor}; font-weight: 600; }
    `;

    const tableStyles = `
      #${this.preview.id} table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1.5rem;
      }
      #${this.preview.id} table th, #${this.preview.id} table td {
        border: 1px solid rgba(0,0,0,0.12);
        padding: 10px;
        text-align: left;
      }
      #${this.preview.id} table thead th {
        background: ${codeColor};
        color: ${codeTextColor};
        font-weight: 600;
      }
    `;

    // 미리보기 여백 고정
    const paddingStyles = `
      #${this.preview.id} {
        padding: 16px;
      }
    `;

    styleEl.textContent = headingStyles + tableStyles + paddingStyles;
  }

  /**
   * 체크박스 설정 (미리보기에서 토글 가능)
   */
  setupCheckboxes() {
    const checkboxes = this.preview.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox, index) => {
      // marked.js 기본 렌더링 시 체크박스 속성이 disabled로 설정됨. 이를 해제
      checkbox.removeAttribute('disabled');
      checkbox.classList.add('cursor-pointer');
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
      // 마크다운 체크박스 패턴 매칭: - [ ] 또는 - [x] 또는 * [ ] 등
      const match = lines[i].match(/^(\s*[-*+]\s+)\[([ xX])\]/);
      if (match) {
        if (checkboxCount === index) {
          lines[i] = lines[i].replace(
            /^(\s*[-*+]\s+)\[([ xX])\]/,
            `$1[${checked ? 'x' : ' '}]`
          );
          break;
        }
        checkboxCount++;
      }
    }

    const scrollPos = this.textarea.scrollTop;
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;

    this.textarea.value = lines.join('\n');
    this.textarea.scrollTop = scrollPos;
    this.textarea.setSelectionRange(start, end);

    this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
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

}
