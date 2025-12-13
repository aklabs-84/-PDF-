/**
 * PDFGenerator - PDF 생성 클래스
 * 마크다운을 PDF로 변환하는 핵심 기능 제공
 */
class PDFGenerator {
  constructor() {
    this.doc = null;
    this.currentTemplate = null;
    this.pageSettings = null;
    this.fontLoader = new FontLoader();
    this.yPosition = 0;
    this.pageNumber = 1;
  }

  /**
   * PDF 생성 메인 함수
   * @param {string} content - 마크다운 또는 일반 텍스트 콘텐츠
   * @param {Object} template - 템플릿 객체
   * @param {Object} settings - 페이지 설정
   * @returns {Promise<Object>} jsPDF 문서 객체
   */
  async generate(content, template, settings = {}) {
    // jsPDF 라이브러리 체크
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
      throw new Error('jsPDF library not loaded');
    }

    this.currentTemplate = template;
    this.pageSettings = this.getDefaultPageSettings(settings);

    // jsPDF 인스턴스 생성 (UMD 빌드 지원)
    const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;

    if (!jsPDFConstructor) {
      throw new Error('jsPDF constructor not found');
    }

    this.doc = new jsPDFConstructor({
      orientation: this.pageSettings.orientation,
      unit: 'pt',
      format: this.pageSettings.pageSize,
      compress: true
    });

    // 한글 폰트 로드
    await this.fontLoader.loadFont(this.doc, template.font);

    // 초기 위치 설정
    this.yPosition = this.currentTemplate.margin.top;
    this.pageNumber = 1;

    // 텍스트 모드 확인 (마크다운 문법이 없으면 일반 텍스트로 처리)
    const isPlainText = settings.plainTextMode || !this.hasMarkdownSyntax(content);

    if (isPlainText) {
      // 일반 텍스트 렌더링
      await this.renderPlainText(content);
    } else {
      // 마크다운 파싱 및 렌더링
      const htmlContent = marked.parse(content);
      await this.renderContent(htmlContent);
    }

    // 페이지 번호 추가
    if (this.pageSettings.showPageNumber) {
      this.addPageNumbers();
    }

    // 헤더/푸터 추가
    if (this.pageSettings.header || this.pageSettings.footer) {
      this.addHeaderFooter();
    }

    return this.doc;
  }

  /**
   * 마크다운 문법 포함 여부 확인
   * @param {string} content - 콘텐츠
   * @returns {boolean} 마크다운 문법 포함 여부
   */
  hasMarkdownSyntax(content) {
    // 마크다운 주요 문법 패턴
    const markdownPatterns = [
      /^#{1,6}\s/m,           // 제목 (# ## ###)
      /\*\*[^*]+\*\*/,         // 굵게 (**text**)
      /__[^_]+__/,             // 굵게 (__text__)
      /\*[^*]+\*/,             // 기울임 (*text*)
      /_[^_]+_/,               // 기울임 (_text_)
      /\[.+\]\(.+\)/,          // 링크 [text](url)
      /!\[.*\]\(.+\)/,         // 이미지 ![alt](url)
      /^[-*+]\s/m,             // 목록 (- * +)
      /^\d+\.\s/m,             // 순서 목록 (1. 2.)
      /^>\s/m,                 // 인용구 (>)
      /```/,                   // 코드 블록 (```)
      /`[^`]+`/,               // 인라인 코드 (`code`)
      /^\|.+\|$/m,             // 테이블 (|col|col|)
      /^---+$/m,               // 수평선 (---)
    ];

    return markdownPatterns.some(pattern => pattern.test(content));
  }

  /**
   * 일반 텍스트 렌더링
   * @param {string} content - 일반 텍스트 콘텐츠
   */
  async renderPlainText(content) {
    this.doc.setFont(this.currentTemplate.font, 'normal');
    this.doc.setFontSize(this.currentTemplate.fontSize);

    // 텍스트 색상 설정 (colors.primary 사용)
    const primaryColor = this.currentTemplate.colors?.primary || '#000000';
    const rgb = this.hexToRgb(primaryColor);
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b);

    const maxWidth = this.getContentWidth();
    const lineHeight = this.currentTemplate.fontSize * this.currentTemplate.lineHeight;

    // 줄바꿈으로 문단 분리
    const paragraphs = content.split(/\n\n+/);

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;

      // 문단 내 줄바꿈 처리
      const lines = paragraph.split('\n');

      for (const line of lines) {
        if (!line.trim()) {
          // 빈 줄은 여백 추가
          this.yPosition += lineHeight * 0.5;
          continue;
        }

        // 텍스트를 페이지 너비에 맞게 분할
        const wrappedLines = this.doc.splitTextToSize(line, maxWidth);

        for (const wrappedLine of wrappedLines) {
          // 페이지 넘김 확인
          if (this.yPosition + lineHeight > this.getPageHeight() - this.currentTemplate.margin.bottom) {
            this.addPage();
          }

          // 텍스트 렌더링
          this.doc.text(
            wrappedLine,
            this.currentTemplate.margin.left,
            this.yPosition
          );

          this.yPosition += lineHeight;
        }
      }

      // 문단 간 여백
      this.yPosition += lineHeight * 0.5;
    }
  }

  /**
   * 기본 페이지 설정 가져오기
   * @param {Object} settings - 사용자 설정
   * @returns {Object} 완전한 페이지 설정
   */
  getDefaultPageSettings(settings) {
    return {
      orientation: settings.orientation || 'portrait',
      pageSize: settings.pageSize || 'a4',
      showPageNumber: settings.showPageNumber !== false,
      pageNumber: {
        position: settings.pageNumber?.position || 'bottom-center',
        format: settings.pageNumber?.format || 'number',
        startFrom: settings.pageNumber?.startFrom || 1,
        excludeFirst: settings.pageNumber?.excludeFirst || false
      },
      header: settings.header || '',
      headerLine: settings.headerLine || false,
      footer: settings.footer || '',
      footerLine: settings.footerLine || false
    };
  }

  /**
   * 콘텐츠 렌더링
   * @param {string} htmlContent - HTML 콘텐츠
   */
  async renderContent(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const elements = doc.body.children;

    for (const element of elements) {
      await this.renderElement(element);
    }
  }

  /**
   * 개별 요소 렌더링
   * @param {HTMLElement} element - HTML 요소
   */
  async renderElement(element) {
    const tagName = element.tagName.toLowerCase();

    // 페이지 넘김 체크
    if (this.yPosition > this.getPageHeight() - this.currentTemplate.margin.bottom - 50) {
      this.addPage();
    }

    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        this.renderHeading(element);
        break;

      case 'p':
        this.renderParagraph(element);
        break;

      case 'ul':
      case 'ol':
        this.renderList(element);
        break;

      case 'table':
        this.renderTable(element);
        break;

      case 'pre':
        this.renderCodeBlock(element);
        break;

      case 'blockquote':
        this.renderBlockquote(element);
        break;

      case 'hr':
        this.renderHorizontalRule();
        break;

      default:
        // 기타 요소는 문단으로 처리
        if (element.textContent.trim()) {
          this.renderParagraph(element);
        }
        break;
    }
  }

  /**
   * 제목 렌더링
   * @param {HTMLElement} element - 제목 요소
   */
  renderHeading(element) {
    const level = parseInt(element.tagName[1]);
    const fontSize = this.currentTemplate.headingSize[level];
    const text = element.textContent.trim();

    if (!text) return;

    // 제목 위 여백
    this.yPosition += fontSize * 0.5;

    this.doc.setFontSize(fontSize);
    // 한글 폰트는 볼드 스타일이 없으므로 normal 사용
    this.doc.setFont(this.currentTemplate.font, 'normal');

    const maxWidth = this.getContentWidth();
    const lines = this.doc.splitTextToSize(text, maxWidth);

    // 크리에이티브 템플릿 H1 배경 박스 그리기
    if (level === 1 && this.currentTemplate.name === 'creative') {
      const accentColor = this.hexToRgb(this.currentTemplate.colors?.accent || '#805ad5');
      const boxHeight = (lines.length * fontSize * 1.2) + 20;
      const boxY = this.yPosition - fontSize * 0.8;

      // 배경색 (연한 보라색)
      this.doc.setFillColor(accentColor.r, accentColor.g, accentColor.b, 0.1);
      this.doc.roundedRect(
        this.currentTemplate.margin.left - 10,
        boxY,
        this.getContentWidth() + 20,
        boxHeight,
        8,
        8,
        'F'
      );

      // 왼쪽 테두리
      this.doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
      this.doc.rect(
        this.currentTemplate.margin.left - 10,
        boxY,
        5,
        boxHeight,
        'F'
      );

      this.yPosition += 10; // 패딩
    }

    lines.forEach((line, index) => {
      this.doc.text(
        line,
        this.currentTemplate.margin.left,
        this.yPosition
      );
      this.yPosition += fontSize * 1.2;
    });

    // 크리에이티브 템플릿 H1 하단 패딩
    if (level === 1 && this.currentTemplate.name === 'creative') {
      this.yPosition += 10;
    }
    // 기타 템플릿 H1인 경우 밑줄 추가
    else if (level === 1) {
      const lineY = this.yPosition - fontSize * 0.3;
      this.doc.setDrawColor(200, 200, 200);
      this.doc.setLineWidth(0.5);
      this.doc.line(
        this.currentTemplate.margin.left,
        lineY,
        this.getPageWidth() - this.currentTemplate.margin.right,
        lineY
      );
      this.yPosition += 5;
    }

    // 제목 아래 여백
    this.yPosition += fontSize * 0.3;

    // 기본 폰트로 복원
    this.doc.setFont(this.currentTemplate.font, 'normal');
    this.doc.setFontSize(this.currentTemplate.fontSize);
  }

  /**
   * 문단 렌더링
   * @param {HTMLElement} element - 문단 요소
   */
  renderParagraph(element) {
    const text = this.extractTextWithFormatting(element);

    if (!text.trim()) return;

    const maxWidth = this.getContentWidth();
    const lines = this.doc.splitTextToSize(text, maxWidth);
    const lineHeight = this.currentTemplate.fontSize * this.currentTemplate.lineHeight;

    lines.forEach((line) => {
      // 페이지 넘김 체크
      if (this.yPosition + lineHeight > this.getPageHeight() - this.currentTemplate.margin.bottom) {
        this.addPage();
      }

      this.doc.text(
        line,
        this.currentTemplate.margin.left,
        this.yPosition
      );
      this.yPosition += lineHeight;
    });

    // 문단 간격
    this.yPosition += this.currentTemplate.fontSize * 0.5;
  }

  /**
   * 텍스트 서식 추출
   * @param {HTMLElement} element - HTML 요소
   * @returns {string} 텍스트
   */
  extractTextWithFormatting(element) {
    // 간단한 텍스트 추출 (향후 굵기, 기울임 등 처리 가능)
    return element.textContent.trim();
  }

  /**
   * 목록 렌더링
   * @param {HTMLElement} element - 목록 요소
   */
  renderList(element) {
    const isOrdered = element.tagName.toLowerCase() === 'ol';
    const items = element.querySelectorAll('li');
    const indent = 20;

    items.forEach((item, index) => {
      const prefix = isOrdered ? `${index + 1}.` : '•';
      const text = item.textContent.trim();

      if (!text) return;

      // 접두사
      this.doc.text(
        prefix,
        this.currentTemplate.margin.left + indent,
        this.yPosition
      );

      // 텍스트
      const maxWidth = this.getContentWidth() - indent - 15;
      const lines = this.doc.splitTextToSize(text, maxWidth);
      const lineHeight = this.currentTemplate.fontSize * this.currentTemplate.lineHeight;

      lines.forEach((line, lineIndex) => {
        if (this.yPosition + lineHeight > this.getPageHeight() - this.currentTemplate.margin.bottom) {
          this.addPage();
        }

        this.doc.text(
          line,
          this.currentTemplate.margin.left + indent + 15,
          this.yPosition
        );
        this.yPosition += lineHeight;
      });
    });

    // 목록 아래 여백
    this.yPosition += this.currentTemplate.fontSize * 0.5;
  }

  /**
   * 테이블 렌더링
   * @param {HTMLElement} element - 테이블 요소
   */
  renderTable(element) {
    if (typeof this.doc.autoTable === 'undefined') {
      console.warn('jsPDF-AutoTable plugin not loaded');
      return;
    }

    const headers = [];
    const rows = [];

    // 헤더 추출
    const thead = element.querySelector('thead');
    if (thead) {
      const headerCells = thead.querySelectorAll('th');
      headerCells.forEach(cell => {
        headers.push(cell.textContent.trim());
      });
    }

    // 행 추출
    const tbody = element.querySelector('tbody') || element;
    const bodyRows = tbody.querySelectorAll('tr');
    bodyRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const rowData = [];
      cells.forEach(cell => {
        rowData.push(cell.textContent.trim());
      });
      if (rowData.length > 0) {
        rows.push(rowData);
      }
    });

    // 데이터가 없으면 렌더링하지 않음
    if (headers.length === 0 && rows.length === 0) {
      return;
    }

    // 페이지 넘김 확인
    if (this.yPosition > this.getPageHeight() - this.currentTemplate.margin.bottom - 100) {
      this.addPage();
    }

    // AutoTable로 렌더링
    this.doc.autoTable({
      startY: this.yPosition,
      head: headers.length > 0 ? [headers] : null,
      body: rows,
      theme: 'grid',
      styles: {
        font: this.currentTemplate.font,
        fontSize: this.currentTemplate.fontSize - 1,
        cellPadding: 6,
        lineColor: [180, 180, 180],
        lineWidth: 0.5,
        textColor: [50, 50, 50],
        halign: 'left',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [50, 50, 50],
        fontStyle: 'bold',
        halign: 'left',
        lineWidth: 0.5,
        lineColor: [180, 180, 180]
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      margin: {
        left: this.currentTemplate.margin.left,
        right: this.currentTemplate.margin.right
      }
    });

    this.yPosition = this.doc.lastAutoTable.finalY + 15;
  }

  /**
   * 코드 블록 렌더링
   * @param {HTMLElement} element - 코드 블록 요소
   */
  renderCodeBlock(element) {
    const code = element.querySelector('code');
    const text = code ? code.textContent : element.textContent;
    const lines = text.split('\n');

    // 배경 계산
    const padding = 10;
    const width = this.getContentWidth();
    const lineHeight = 12;
    const height = lines.length * lineHeight + padding * 2;

    // 페이지 넘김 확인
    if (this.yPosition + height > this.getPageHeight() - this.currentTemplate.margin.bottom) {
      this.addPage();
    }

    // 배경 그리기
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(
      this.currentTemplate.margin.left,
      this.yPosition - padding,
      width,
      height,
      'F'
    );

    // 코드 텍스트
    this.doc.setFontSize(10);
    this.doc.setFont('courier');
    this.doc.setTextColor(80, 80, 80);

    lines.forEach((line) => {
      this.doc.text(
        line,
        this.currentTemplate.margin.left + padding,
        this.yPosition
      );
      this.yPosition += lineHeight;
    });

    this.yPosition += padding + 10;

    // 폰트 복원
    this.doc.setFont(this.currentTemplate.font, 'normal');
    this.doc.setFontSize(this.currentTemplate.fontSize);
    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * 인용구 렌더링
   * @param {HTMLElement} element - 인용구 요소
   */
  renderBlockquote(element) {
    const text = element.textContent.trim();

    if (!text) return;

    const maxWidth = this.getContentWidth() - 30;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    const lineHeight = this.currentTemplate.fontSize * this.currentTemplate.lineHeight;
    const totalHeight = lines.length * lineHeight + 10;

    // 페이지 넘김 확인
    if (this.yPosition + totalHeight > this.getPageHeight() - this.currentTemplate.margin.bottom) {
      this.addPage();
    }

    // 왼쪽 바
    this.doc.setDrawColor(66, 139, 202);
    this.doc.setLineWidth(3);
    this.doc.line(
      this.currentTemplate.margin.left + 10,
      this.yPosition - 5,
      this.currentTemplate.margin.left + 10,
      this.yPosition + totalHeight - 5
    );

    // 배경
    this.doc.setFillColor(240, 248, 255);
    this.doc.rect(
      this.currentTemplate.margin.left + 15,
      this.yPosition - 5,
      maxWidth + 15,
      totalHeight,
      'F'
    );

    // 텍스트
    this.doc.setTextColor(60, 60, 60);
    // 한글 폰트는 이탤릭 스타일이 없으므로 normal 사용
    this.doc.setFont(this.currentTemplate.font, 'normal');

    lines.forEach((line) => {
      this.doc.text(
        line,
        this.currentTemplate.margin.left + 25,
        this.yPosition
      );
      this.yPosition += lineHeight;
    });

    this.yPosition += 15;

    // 폰트 복원
    this.doc.setFont(this.currentTemplate.font, 'normal');
    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * 수평선 렌더링
   */
  renderHorizontalRule() {
    this.yPosition += 10;

    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.currentTemplate.margin.left,
      this.yPosition,
      this.getPageWidth() - this.currentTemplate.margin.right,
      this.yPosition
    );

    this.yPosition += 15;
  }

  /**
   * 새 페이지 추가
   */
  addPage() {
    this.doc.addPage();
    this.yPosition = this.currentTemplate.margin.top;
    this.pageNumber++;
  }

  /**
   * 페이지 번호 추가
   */
  addPageNumbers() {
    const pageCount = this.doc.internal.getNumberOfPages();
    const { position, format, startFrom, excludeFirst } = this.pageSettings.pageNumber;

    for (let i = 1; i <= pageCount; i++) {
      // 첫 페이지 제외 옵션
      if (excludeFirst && i === 1) continue;

      this.doc.setPage(i);

      const actualNumber = i - 1 + startFrom;
      let pageText = '';

      switch (format) {
        case 'number':
          pageText = `${actualNumber}`;
          break;
        case 'of':
          pageText = `${actualNumber} / ${pageCount}`;
          break;
        case 'roman':
          pageText = this.toRoman(actualNumber);
          break;
      }

      const { x, y } = this.getPageNumberPosition(position, pageText);

      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(pageText, x, y);
      this.doc.setTextColor(0, 0, 0);
    }
  }

  /**
   * 페이지 번호 위치 계산
   * @param {string} position - 위치
   * @param {string} text - 텍스트
   * @returns {Object} x, y 좌표
   */
  getPageNumberPosition(position, text) {
    const pageWidth = this.getPageWidth();
    const pageHeight = this.getPageHeight();
    const margin = 20;

    const textWidth = this.doc.getTextWidth(text);

    switch (position) {
      case 'top-center':
        return { x: (pageWidth - textWidth) / 2, y: margin };
      case 'bottom-left':
        return { x: this.currentTemplate.margin.left, y: pageHeight - margin };
      case 'bottom-right':
        return { x: pageWidth - this.currentTemplate.margin.right - textWidth, y: pageHeight - margin };
      case 'bottom-center':
      default:
        return { x: (pageWidth - textWidth) / 2, y: pageHeight - margin };
    }
  }

  /**
   * 로마 숫자 변환
   * @param {number} num - 숫자
   * @returns {string} 로마 숫자
   */
  toRoman(num) {
    const roman = {
      M: 1000, CM: 900, D: 500, CD: 400,
      C: 100, XC: 90, L: 50, XL: 40,
      X: 10, IX: 9, V: 5, IV: 4, I: 1
    };

    let result = '';
    for (const [letter, value] of Object.entries(roman)) {
      while (num >= value) {
        result += letter;
        num -= value;
      }
    }
    return result;
  }

  /**
   * 헤더/푸터 추가
   */
  addHeaderFooter() {
    const pageCount = this.doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // 헤더
      if (this.pageSettings.header) {
        this.doc.setFontSize(10);
        this.doc.setTextColor(128, 128, 128);
        this.doc.text(
          this.pageSettings.header,
          this.getPageWidth() / 2,
          20,
          { align: 'center' }
        );

        if (this.pageSettings.headerLine) {
          this.doc.setDrawColor(200, 200, 200);
          this.doc.setLineWidth(0.5);
          this.doc.line(
            this.currentTemplate.margin.left,
            25,
            this.getPageWidth() - this.currentTemplate.margin.right,
            25
          );
        }
      }

      // 푸터
      if (this.pageSettings.footer) {
        const pageHeight = this.getPageHeight();
        this.doc.setFontSize(10);
        this.doc.setTextColor(128, 128, 128);
        this.doc.text(
          this.pageSettings.footer,
          this.getPageWidth() / 2,
          pageHeight - 20,
          { align: 'center' }
        );

        if (this.pageSettings.footerLine) {
          this.doc.setDrawColor(200, 200, 200);
          this.doc.setLineWidth(0.5);
          this.doc.line(
            this.currentTemplate.margin.left,
            pageHeight - 25,
            this.getPageWidth() - this.currentTemplate.margin.right,
            pageHeight - 25
          );
        }
      }

      this.doc.setTextColor(0, 0, 0);
    }
  }

  /**
   * 콘텐츠 너비 가져오기
   * @returns {number} 너비
   */
  getContentWidth() {
    return this.getPageWidth() -
      this.currentTemplate.margin.left -
      this.currentTemplate.margin.right;
  }

  /**
   * 페이지 너비 가져오기
   * @returns {number} 너비
   */
  getPageWidth() {
    return this.doc.internal.pageSize.getWidth();
  }

  /**
   * 페이지 높이 가져오기
   * @returns {number} 높이
   */
  getPageHeight() {
    return this.doc.internal.pageSize.getHeight();
  }

  /**
   * HEX 색상을 RGB로 변환
   * @param {string} hex - HEX 색상 (#RRGGBB)
   * @returns {Object} RGB 객체 {r, g, b}
   */
  hexToRgb(hex) {
    // #을 제거
    hex = hex.replace(/^#/, '');

    // 3자리 HEX인 경우 6자리로 확장
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b };
  }
}
