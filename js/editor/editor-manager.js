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

    // MarkdownHelper & PasteHandler 초기화
    this.markdownHelper = new MarkdownHelper(this.textarea);
    this.pasteHandler = new PasteHandler(this.textarea);

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

    // 템플릿 변경 이벤트 수신: 미리보기 갱신
    window.addEventListener('template-changed', () => {
      // 즉시가 아닌 디바운스된 갱신 사용
      if (this.updatePreviewDebounced) this.updatePreviewDebounced();
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
          if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
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

      // 선택된 템플릿 스타일 적용
      try {
        const template = window.app && window.app.templateEngine ? window.app.templateEngine.getActiveTemplate() : null;
        if (template) {
          this.applyTemplateStylesToPreview(template);
        }
      } catch (e) {
        console.error('Failed to apply template styles to preview:', e);
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
   * 선택된 템플릿 스타일을 미리보기 영역에 적용
   * @param {Object} template
   */
  applyTemplateStylesToPreview(template) {
    if (!this.preview || !template) return;

    // 폰트 family 매핑 (Google Fonts 이름과 일치)
    const fontFamilyMap = {
      'NanumGothic': "'Nanum Gothic', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
      'NanumMyeongjo': "'Nanum Myeongjo', 'Times New Roman', serif",
      'NanumPen': "'Nanum Pen Script', 'Brush Script MT', cursive"
    };

    const family = fontFamilyMap[template.font] || template.font || 'sans-serif';

    // 기본 스타일 적용 - !important로 강제 적용
    this.preview.style.setProperty('font-family', family, 'important');
    this.preview.style.setProperty('line-height', `${template.lineHeight}`, 'important');
    
    // 다크모드 감지
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // 안전한 색상 값 추출 (다크모드일 경우 테마 색상 반전 처리 또는 기본값 변경)
    let primaryColor = template.colors?.primary;
    let accentColor = template.colors?.accent || '#428bca';
    let codeColor = template.colors?.code || '#f5f5f5';
    let codeTextColor = template.colors?.codeText || '#333333';
    
    if (isDarkMode) {
      primaryColor = primaryColor || '#f9fafb'; // 기본 다크모드 텍스트 색상
      codeColor = '#374151'; // 다크모드 코드 배경
      codeTextColor = '#e5e7eb'; // 다크모드 코드 텍스트
    } else {
      primaryColor = primaryColor || '#333333'; // 기본 라이트모드 텍스트 색상
    }

    this.preview.style.setProperty('color', primaryColor, 'important');

    // 제목 크기 및 색상, 표 스타일을 동적으로 삽입
    // <style> 태그는 document.head에 추가해야 함 (preview 내부에 추가하면 [object Object] 오류 발생)
    const styleId = 'template-preview-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // 템플릿별 특별한 스타일 추가
    let templateSpecificStyles = '';

    if (template.name === 'business') {
      templateSpecificStyles = `
        #${this.preview.id} h1 {
          border-bottom: 3px solid ${accentColor};
          padding-bottom: 12px;
          margin-bottom: 24px;
          font-weight: 700;
        }
        #${this.preview.id} h2 {
          border-left: 4px solid ${accentColor};
          padding-left: 12px;
          margin-top: 28px;
          font-weight: 600;
        }
      `;
    } else if (template.name === 'creative') {
      templateSpecificStyles = `
        #${this.preview.id} h1 {
          background: linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}11 100%);
          padding: 16px 20px;
          border-radius: 8px;
          border-left: 5px solid ${accentColor};
          margin: 20px 0;
        }
        #${this.preview.id} h2 {
          color: ${accentColor};
          margin-top: 24px;
        }
        #${this.preview.id} blockquote {
          border-left: 4px solid ${accentColor} !important;
          background: ${accentColor}11 !important;
        }
      `;
    } else if (template.name === 'academic') {
      templateSpecificStyles = `
        #${this.preview.id} h1 {
          text-align: center;
          border-bottom: 2px solid ${primaryColor};
          padding-bottom: 16px;
          margin-bottom: 32px;
          font-weight: 700;
        }
        #${this.preview.id} h2 {
          margin-top: 32px;
          font-weight: 600;
        }
        #${this.preview.id} p {
          text-align: justify;
        }
      `;
    } else {
      // clean 템플릿
      templateSpecificStyles = `
        #${this.preview.id} h1 {
          border-bottom: 2px solid ${accentColor};
          padding-bottom: 8px;
          margin-bottom: 20px;
        }
      `;
    }

    const headingStyles = `
      #${this.preview.id} h1 { font-size: ${template.headingSize?.[1] || 24}px; color: ${primaryColor}; }
      #${this.preview.id} h2 { font-size: ${template.headingSize?.[2] || 20}px; color: ${primaryColor}; }
      #${this.preview.id} h3 { font-size: ${template.headingSize?.[3] || 18}px; color: ${primaryColor}; }
      #${this.preview.id} h4 { font-size: ${template.headingSize?.[4] || 16}px; color: ${primaryColor}; }
      #${this.preview.id} h5 { font-size: ${template.headingSize?.[5] || 14}px; color: ${primaryColor}; }
      #${this.preview.id} h6 { font-size: ${template.headingSize?.[6] || 12}px; color: ${primaryColor}; }
    `;

    const tableStyles = `
      #${this.preview.id} table, #${this.preview.id} .kpdf-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1.5rem;
      }
      #${this.preview.id} table th, #${this.preview.id} table td,
      #${this.preview.id} .kpdf-table th, #${this.preview.id} .kpdf-table td {
        border: 1px solid rgba(0,0,0,0.12);
        padding: 10px;
        text-align: left;
      }
      #${this.preview.id} table thead th, #${this.preview.id} .kpdf-table thead th {
        background: ${codeColor};
        color: ${codeTextColor};
        font-weight: 600;
      }
      #${this.preview.id} .kpdf-table td {
        vertical-align: top;
      }
    `;

    // 미리보기 패딩 스타일 (템플릿의 여백을 반영)
    const paddingStyles = `
      #${this.preview.id} {
        padding: ${template.margin?.top / 4}px ${template.margin?.right / 4}px ${template.margin?.bottom / 4}px ${template.margin?.left / 4}px;
      }
    `;

    styleEl.textContent = headingStyles + tableStyles + templateSpecificStyles + paddingStyles;
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

}
