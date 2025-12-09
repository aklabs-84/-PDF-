# 한글 PDF 변환기 (Korean PDF Converter) - TRD

## 1. 기술 아키텍처

### 1.1 전체 구조
```
┌─────────────────────────────────────────┐
│         User Interface Layer            │
│  (HTML + Tailwind CSS + JavaScript)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│      Application Logic Layer            │
├─────────────────────────────────────────┤
│  - EditorManager                        │
│  - MarkdownParser                       │
│  - PDFGenerator                         │
│  - TemplateEngine                       │
│  - StorageManager                       │
│  - FileHandler                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│        External Libraries               │
├─────────────────────────────────────────┤
│  - Marked.js (Markdown → HTML)          │
│  - jsPDF (PDF Generation)               │
│  - jsPDF-AutoTable (Table Support)      │
│  - Highlight.js (Code Highlighting)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│         Browser APIs                    │
├─────────────────────────────────────────┤
│  - LocalStorage API                     │
│  - File API                             │
│  - Drag & Drop API                      │
│  - Clipboard API                        │
└─────────────────────────────────────────┘
```

### 1.2 디렉토리 구조
```
korean-pdf-converter/
├── index.html
├── css/
│   ├── main.css
│   └── themes.css
├── js/
│   ├── app.js                  # 메인 애플리케이션
│   ├── editor/
│   │   ├── editor-manager.js   # 에디터 관리
│   │   └── markdown-helper.js  # 마크다운 도구
│   ├── pdf/
│   │   ├── pdf-generator.js    # PDF 생성 엔진
│   │   ├── template-engine.js  # 템플릿 시스템
│   │   └── font-loader.js      # 폰트 로더
│   ├── storage/
│   │   └── storage-manager.js  # 로컬 스토리지 관리
│   ├── file/
│   │   └── file-handler.js     # 파일 업로드/다운로드
│   └── ui/
│       ├── ui-manager.js       # UI 컨트롤러
│       └── modal-manager.js    # 모달 관리
├── fonts/
│   ├── NanumGothic.ttf
│   ├── NanumMyeongjo.ttf
│   └── NanumPen.ttf
├── templates/
│   └── templates.json          # 템플릿 설정
├── assets/
│   ├── icons/
│   └── images/
└── README.md
```

## 2. 핵심 컴포넌트 상세 설계

### 2.1 EditorManager
```javascript
class EditorManager {
  constructor() {
    this.textarea = null;
    this.preview = null;
    this.autoSaveInterval = 30000; // 30초
    this.currentDocument = null;
  }

  // 초기화
  init(textareaId, previewId) {
    this.textarea = document.getElementById(textareaId);
    this.preview = document.getElementById(previewId);
    this.setupEventListeners();
    this.startAutoSave();
  }

  // 실시간 미리보기 업데이트
  updatePreview() {
    const markdown = this.textarea.value;
    const html = this.parseMarkdown(markdown);
    this.preview.innerHTML = html;
  }

  // 마크다운 파싱
  parseMarkdown(markdown) {
    // Marked.js 활용
    return marked.parse(markdown, {
      gfm: true,
      breaks: true,
      headerIds: true,
      mangle: false
    });
  }

  // 자동 저장
  startAutoSave() {
    setInterval(() => {
      this.saveToLocal();
    }, this.autoSaveInterval);
  }

  // 로컬 저장
  saveToLocal() {
    const content = this.textarea.value;
    const title = this.extractTitle(content);
    const document = {
      id: this.currentDocument?.id || Date.now(),
      title: title,
      content: content,
      lastModified: new Date().toISOString()
    };
    StorageManager.saveDocument(document);
  }
}
```

### 2.2 PDFGenerator
```javascript
class PDFGenerator {
  constructor() {
    this.doc = null;
    this.currentTemplate = null;
    this.pageSettings = null;
  }

  // PDF 생성 메인 함수
  async generate(content, template, settings) {
    this.currentTemplate = template;
    this.pageSettings = settings;
    
    // jsPDF 인스턴스 생성
    this.doc = new jsPDF({
      orientation: settings.orientation,
      unit: 'pt',
      format: settings.pageSize,
      compress: true
    });

    // 한글 폰트 로드
    await this.loadKoreanFont(template.font);

    // 콘텐츠 파싱 및 렌더링
    const htmlContent = marked.parse(content);
    await this.renderContent(htmlContent);

    // 페이지 번호 추가
    if (settings.showPageNumber) {
      this.addPageNumbers();
    }

    // 헤더/푸터 추가
    if (settings.header || settings.footer) {
      this.addHeaderFooter();
    }

    return this.doc;
  }

  // 한글 폰트 로드
  async loadKoreanFont(fontName) {
    const fontUrl = `fonts/${fontName}.ttf`;
    const fontData = await fetch(fontUrl).then(r => r.arrayBuffer());
    const fontBase64 = this.arrayBufferToBase64(fontData);
    
    this.doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
    this.doc.addFont(`${fontName}.ttf`, fontName, 'normal');
    this.doc.setFont(fontName);
  }

  // 콘텐츠 렌더링
  async renderContent(htmlContent) {
    // HTML을 파싱하여 PDF 요소로 변환
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const elements = doc.body.children;

    let yPosition = this.currentTemplate.margin.top;

    for (const element of elements) {
      const rendered = await this.renderElement(element, yPosition);
      yPosition = rendered.nextY;

      // 페이지 넘김 체크
      if (yPosition > this.getPageHeight() - this.currentTemplate.margin.bottom) {
        this.doc.addPage();
        yPosition = this.currentTemplate.margin.top;
      }
    }
  }

  // 개별 요소 렌더링
  async renderElement(element, yPosition) {
    const tagName = element.tagName.toLowerCase();
    
    switch(tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return this.renderHeading(element, yPosition);
      
      case 'p':
        return this.renderParagraph(element, yPosition);
      
      case 'ul':
      case 'ol':
        return this.renderList(element, yPosition);
      
      case 'table':
        return this.renderTable(element, yPosition);
      
      case 'pre':
        return this.renderCodeBlock(element, yPosition);
      
      case 'blockquote':
        return this.renderBlockquote(element, yPosition);
      
      case 'hr':
        return this.renderHorizontalRule(yPosition);
      
      default:
        return this.renderParagraph(element, yPosition);
    }
  }

  // 제목 렌더링
  renderHeading(element, yPosition) {
    const level = parseInt(element.tagName[1]);
    const fontSize = this.currentTemplate.headingSize[level];
    const text = element.textContent;

    this.doc.setFontSize(fontSize);
    this.doc.setFont(this.currentTemplate.font, 'bold');
    
    const lines = this.doc.splitTextToSize(
      text, 
      this.getContentWidth()
    );
    
    lines.forEach((line, index) => {
      this.doc.text(
        line,
        this.currentTemplate.margin.left,
        yPosition + (index * fontSize * 1.2)
      );
    });

    const height = lines.length * fontSize * 1.2 + 10;
    
    // 기본 폰트로 복원
    this.doc.setFont(this.currentTemplate.font, 'normal');
    this.doc.setFontSize(this.currentTemplate.fontSize);

    return { nextY: yPosition + height };
  }

  // 테이블 렌더링 (jsPDF-AutoTable 활용)
  renderTable(element, yPosition) {
    const headers = [];
    const rows = [];

    // 헤더 추출
    const thead = element.querySelector('thead');
    if (thead) {
      const headerCells = thead.querySelectorAll('th');
      headerCells.forEach(cell => {
        headers.push(cell.textContent);
      });
    }

    // 행 추출
    const tbody = element.querySelector('tbody') || element;
    const bodyRows = tbody.querySelectorAll('tr');
    bodyRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const rowData = [];
      cells.forEach(cell => {
        rowData.push(cell.textContent);
      });
      if (rowData.length > 0) {
        rows.push(rowData);
      }
    });

    // AutoTable로 렌더링
    this.doc.autoTable({
      startY: yPosition,
      head: headers.length > 0 ? [headers] : null,
      body: rows,
      theme: 'grid',
      styles: {
        font: this.currentTemplate.font,
        fontSize: this.currentTemplate.fontSize - 2,
        cellPadding: 5
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      }
    });

    return { nextY: this.doc.lastAutoTable.finalY + 10 };
  }

  // 코드 블록 렌더링
  renderCodeBlock(element, yPosition) {
    const code = element.querySelector('code');
    const text = code ? code.textContent : element.textContent;
    const lines = text.split('\n');

    // 배경 그리기
    const width = this.getContentWidth();
    const height = lines.length * 12 + 10;
    
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(
      this.currentTemplate.margin.left,
      yPosition - 5,
      width,
      height,
      'F'
    );

    // 코드 텍스트
    this.doc.setFontSize(10);
    this.doc.setFont('courier');
    
    lines.forEach((line, index) => {
      this.doc.text(
        line,
        this.currentTemplate.margin.left + 5,
        yPosition + (index * 12) + 10
      );
    });

    // 폰트 복원
    this.doc.setFont(this.currentTemplate.font, 'normal');
    this.doc.setFontSize(this.currentTemplate.fontSize);

    return { nextY: yPosition + height + 10 };
  }

  // 페이지 번호 추가
  addPageNumbers() {
    const pageCount = this.doc.internal.getNumberOfPages();
    const { position, format } = this.pageSettings.pageNumber;

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      let pageText = '';
      switch(format) {
        case 'number':
          pageText = `${i}`;
          break;
        case 'of':
          pageText = `${i} / ${pageCount}`;
          break;
        case 'roman':
          pageText = this.toRoman(i);
          break;
      }

      const { x, y } = this.getPageNumberPosition(position, pageText);
      
      this.doc.setFontSize(10);
      this.doc.text(pageText, x, y);
    }
  }

  // 헤더/푸터 추가
  addHeaderFooter() {
    const pageCount = this.doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // 헤더
      if (this.pageSettings.header) {
        this.doc.setFontSize(10);
        this.doc.text(
          this.pageSettings.header,
          this.doc.internal.pageSize.width / 2,
          20,
          { align: 'center' }
        );
        
        // 구분선
        if (this.pageSettings.headerLine) {
          this.doc.line(
            this.currentTemplate.margin.left,
            25,
            this.doc.internal.pageSize.width - this.currentTemplate.margin.right,
            25
          );
        }
      }

      // 푸터
      if (this.pageSettings.footer) {
        const pageHeight = this.doc.internal.pageSize.height;
        this.doc.setFontSize(10);
        this.doc.text(
          this.pageSettings.footer,
          this.doc.internal.pageSize.width / 2,
          pageHeight - 20,
          { align: 'center' }
        );
        
        // 구분선
        if (this.pageSettings.footerLine) {
          this.doc.line(
            this.currentTemplate.margin.left,
            pageHeight - 25,
            this.doc.internal.pageSize.width - this.currentTemplate.margin.right,
            pageHeight - 25
          );
        }
      }
    }
  }

  // 유틸리티 함수들
  getContentWidth() {
    return this.doc.internal.pageSize.width - 
           this.currentTemplate.margin.left - 
           this.currentTemplate.margin.right;
  }

  getPageHeight() {
    return this.doc.internal.pageSize.height;
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
```

### 2.3 TemplateEngine
```javascript
class TemplateEngine {
  constructor() {
    this.templates = null;
    this.loadTemplates();
  }

  async loadTemplates() {
    const response = await fetch('templates/templates.json');
    this.templates = await response.json();
  }

  getTemplate(name) {
    return this.templates[name];
  }

  getAllTemplates() {
    return Object.values(this.templates);
  }

  // 템플릿 커스터마이징
  customizeTemplate(templateName, options) {
    const base = this.getTemplate(templateName);
    return {
      ...base,
      font: options.font || base.font,
      fontSize: options.fontSize || base.fontSize,
      lineHeight: options.lineHeight || base.lineHeight,
      margin: options.margin || base.margin,
      orientation: options.orientation || base.orientation,
      pageSize: options.pageSize || base.pageSize
    };
  }
}
```

### 2.4 StorageManager
```javascript
class StorageManager {
  static STORAGE_KEY = 'kpdf_documents';
  static MAX_DOCUMENTS = 20;

  // 문서 저장
  static saveDocument(document) {
    const documents = this.getAllDocuments();
    const index = documents.findIndex(d => d.id === document.id);

    if (index > -1) {
      documents[index] = document;
    } else {
      documents.unshift(document);
      
      // 최대 개수 제한
      if (documents.length > this.MAX_DOCUMENTS) {
        documents.pop();
      }
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));
  }

  // 모든 문서 가져오기
  static getAllDocuments() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // 문서 가져오기
  static getDocument(id) {
    const documents = this.getAllDocuments();
    return documents.find(d => d.id === id);
  }

  // 문서 삭제
  static deleteDocument(id) {
    const documents = this.getAllDocuments();
    const filtered = documents.filter(d => d.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  // 문서 검색
  static searchDocuments(query) {
    const documents = this.getAllDocuments();
    const lowerQuery = query.toLowerCase();
    
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery)
    );
  }

  // 스토리지 용량 체크
  static checkStorageSize() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    const size = new Blob([data]).size;
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return {
      used: size,
      max: maxSize,
      percentage: (size / maxSize) * 100
    };
  }
}
```

### 2.5 FileHandler
```javascript
class FileHandler {
  constructor() {
    this.acceptedTypes = ['.txt', '.md', '.markdown'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  // 파일 업로드 처리
  async handleFileUpload(file) {
    // 유효성 검사
    if (!this.validateFile(file)) {
      throw new Error('Invalid file');
    }

    // 파일 읽기
    const content = await this.readFile(file);
    return {
      name: file.name,
      content: content,
      size: file.size,
      type: file.type
    };
  }

  // 다중 파일 업로드
  async handleMultipleFiles(files) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.handleFileUpload(file);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ 
          success: false, 
          fileName: file.name,
          error: error.message 
        });
      }
    }

    return results;
  }

  // 파일 읽기
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = (e) => {
        reject(new Error('파일 읽기 실패'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  }

  // 파일 유효성 검사
  validateFile(file) {
    // 크기 체크
    if (file.size > this.maxFileSize) {
      throw new Error(`파일 크기가 10MB를 초과합니다: ${file.name}`);
    }

    // 확장자 체크
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!this.acceptedTypes.includes(extension)) {
      throw new Error(`지원하지 않는 파일 형식입니다: ${extension}`);
    }

    return true;
  }

  // PDF 다운로드
  downloadPDF(doc, filename) {
    doc.save(filename + '.pdf');
  }

  // 마크다운 다운로드
  downloadMarkdown(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  // 일괄 다운로드 (ZIP)
  async downloadBatch(pdfs, zipFilename) {
    // JSZip 라이브러리 사용 (필요 시 추가)
    const zip = new JSZip();
    
    pdfs.forEach((pdf, index) => {
      const pdfData = pdf.output('blob');
      zip.file(`${pdf.filename}.pdf`, pdfData);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFilename + '.zip';
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

## 3. 데이터 구조

### 3.1 문서 객체
```javascript
{
  id: number,              // 타임스탬프 기반 고유 ID
  title: string,           // 문서 제목 (첫 줄 또는 H1)
  content: string,         // 마크다운 원본
  lastModified: string,    // ISO 8601 날짜
  createdAt: string        // ISO 8601 날짜
}
```

### 3.2 템플릿 객체
```json
{
  "name": "clean",
  "displayName": "클린",
  "description": "심플하고 깔끔한 디자인",
  "font": "NanumGothic",
  "fontSize": 12,
  "lineHeight": 1.5,
  "headingSize": {
    "1": 24,
    "2": 20,
    "3": 18,
    "4": 16,
    "5": 14,
    "6": 12
  },
  "margin": {
    "top": 72,
    "right": 72,
    "bottom": 72,
    "left": 72
  },
  "orientation": "portrait",
  "pageSize": "a4",
  "colors": {
    "primary": "#333333",
    "secondary": "#666666",
    "accent": "#428bca"
  }
}
```

### 3.3 페이지 설정 객체
```javascript
{
  orientation: 'portrait' | 'landscape',
  pageSize: 'a4' | 'letter' | 'b5',
  showPageNumber: boolean,
  pageNumber: {
    position: 'top-center' | 'bottom-center' | 'bottom-left' | 'bottom-right',
    format: 'number' | 'of' | 'roman',
    startFrom: number,
    excludeFirst: boolean
  },
  header: string,
  headerLine: boolean,
  footer: string,
  footerLine: boolean
}
```

## 4. API 및 라이브러리

### 4.1 외부 라이브러리
```html
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Marked.js (Markdown Parser) -->
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

<!-- jsPDF (PDF Generation) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<!-- jsPDF-AutoTable (Table Support) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>

<!-- Highlight.js (Code Syntax) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>

<!-- JSZip (Batch Download) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
```

### 4.2 브라우저 API 사용

#### LocalStorage
```javascript
// 저장
localStorage.setItem(key, value);

// 읽기
const data = localStorage.getItem(key);

// 삭제
localStorage.removeItem(key);

// 전체 삭제
localStorage.clear();
```

#### File API
```javascript
// 파일 선택
<input type="file" accept=".txt,.md,.markdown" multiple>

// 파일 읽기
const reader = new FileReader();
reader.readAsText(file, 'UTF-8');
reader.onload = (e) => {
  const content = e.target.result;
};
```

#### Drag and Drop API
```javascript
// 드롭 존 설정
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  const files = e.dataTransfer.files;
  handleFiles(files);
});
```

## 5. 성능 최적화

### 5.1 지연 로딩
- 폰트 파일: 선택된 폰트만 로드
- 템플릿: 사용 시점에 로드
- 라이브러리: 필요한 기능만 import

### 5.2 캐싱 전략
- 폰트 파일: 브라우저 캐시 활용
- 템플릿 설정: 메모리 캐싱
- 최근 문서: LocalStorage 캐싱

### 5.3 코드 최적화
```javascript
// 디바운싱 (미리보기 업데이트)
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// 미리보기 업데이트는 300ms 디바운싱
const updatePreview = debounce(() => {
  // 미리보기 렌더링
}, 300);
```

### 5.4 메모리 관리
- PDF 생성 후 객체 정리
- 대용량 파일 처리 시 청크 단위 처리
- 사용하지 않는 DOM 요소 제거

## 6. 에러 처리

### 6.1 에러 타입
```javascript
const ErrorTypes = {
  FILE_TOO_LARGE: '파일 크기가 10MB를 초과합니다.',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
  STORAGE_FULL: '저장 공간이 부족합니다.',
  PDF_GENERATION_FAILED: 'PDF 생성에 실패했습니다.',
  FONT_LOAD_FAILED: '폰트 로드에 실패했습니다.',
  PARSE_ERROR: '마크다운 파싱 중 오류가 발생했습니다.'
};
```

### 6.2 에러 핸들러
```javascript
class ErrorHandler {
  static handle(error, context) {
    console.error(`[${context}]`, error);
    
    // 사용자에게 표시
    this.showError(error.message || '알 수 없는 오류가 발생했습니다.');
    
    // 로그 기록 (선택적)
    this.log(error, context);
  }

  static showError(message) {
    // Toast 알림 표시
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
```

## 7. 테스트 전략

### 7.1 단위 테스트
- 마크다운 파싱 함수
- PDF 생성 함수
- 파일 유효성 검사
- 로컬 스토리지 CRUD

### 7.2 통합 테스트
- 파일 업로드 → PDF 생성 플로우
- 에디터 입력 → 실시간 미리보기
- 템플릿 선택 → PDF 스타일 적용
- 일괄 변환 프로세스

### 7.3 브라우저 테스트
- Chrome, Firefox, Safari, Edge
- 모바일 브라우저 (iOS Safari, Chrome Mobile)
- 다양한 화면 크기

### 7.4 성능 테스트
- 대용량 문서 (100+ 페이지)
- 다중 파일 업로드 (20개)
- 복잡한 테이블/코드 블록
- 메모리 사용량

## 8. 보안 고려사항

### 8.1 XSS 방지
```javascript
// HTML 태그 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 마크다운 파싱 시 sanitize
marked.setOptions({
  sanitize: false, // DOMPurify 사용
  sanitizer: (html) => {
    return DOMPurify.sanitize(html);
  }
});
```

### 8.2 파일 업로드 검증
- MIME 타입 체크
- 파일 크기 제한
- 확장자 화이트리스트

### 8.3 로컬 스토리지 보안
- 민감 정보 저장 금지
- 용량 제한 체크
- 정기적인 정리

## 9. 배포 설정

### 9.1 GitHub Pages
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

### 9.2 Vercel
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

## 10. 버전 관리

### 10.1 시맨틱 버저닝
- MAJOR: 호환되지 않는 API 변경
- MINOR: 하위 호환 기능 추가
- PATCH: 하위 호환 버그 수정

### 10.2 체인지로그
```markdown
## [1.0.0] - 2024-12-22
### Added
- 초기 릴리스
- 마크다운 에디터
- PDF 생성 기능
- 4가지 템플릿
- 로컬 스토리지 저장

### Changed
- 없음

### Fixed
- 없음
```

---

**문서 버전**: 1.0  
**작성일**: 2024-12-08  
**최종 수정일**: 2024-12-08
