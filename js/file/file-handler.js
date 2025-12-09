/**
 * FileHandler - 파일 업로드/다운로드 처리 클래스
 * 파일 읽기, 검증, 내보내기 기능 제공
 */
class FileHandler {
  constructor() {
    this.acceptedTypes = ['.txt', '.md', '.markdown'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  /**
   * 파일 업로드 처리
   * @param {File} file - 업로드할 파일
   * @returns {Promise<Object>} 파일 정보 객체
   */
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
      type: file.type,
      lastModified: new Date(file.lastModified)
    };
  }

  /**
   * 다중 파일 업로드 처리
   * @param {FileList} files - 파일 목록
   * @returns {Promise<Array>} 처리 결과 배열
   */
  async handleMultipleFiles(files) {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.handleFileUpload(file);
        results.push({
          success: true,
          data: result
        });
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

  /**
   * 파일 읽기
   * @param {File} file - 읽을 파일
   * @returns {Promise<string>} 파일 내용
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target.result);
      };

      reader.onerror = (e) => {
        reject(new Error('파일 읽기 실패: ' + e.target.error));
      };

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          this.dispatchProgressEvent(file.name, progress);
        }
      };

      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * 파일 유효성 검사
   * @param {File} file - 검사할 파일
   * @returns {boolean} 유효성 여부
   */
  validateFile(file) {
    // 파일 존재 여부
    if (!file) {
      throw new Error('파일이 선택되지 않았습니다.');
    }

    // 크기 체크
    if (file.size > this.maxFileSize) {
      throw new Error(`파일 크기가 10MB를 초과합니다: ${this.formatFileSize(file.size)}`);
    }

    // 빈 파일 체크
    if (file.size === 0) {
      throw new Error('빈 파일은 업로드할 수 없습니다.');
    }

    // 확장자 체크
    const extension = this.getFileExtension(file.name);
    if (!this.acceptedTypes.includes(extension)) {
      throw new Error(`지원하지 않는 파일 형식입니다: ${extension}\n지원 형식: ${this.acceptedTypes.join(', ')}`);
    }

    return true;
  }

  /**
   * 파일 확장자 추출
   * @param {string} filename - 파일명
   * @returns {string} 확장자
   */
  getFileExtension(filename) {
    const parts = filename.split('.');
    if (parts.length < 2) {
      return '';
    }
    return '.' + parts.pop().toLowerCase();
  }

  /**
   * 파일 크기 포맷팅
   * @param {number} bytes - 바이트 크기
   * @returns {string} 포맷된 문자열
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * PDF 다운로드
   * @param {Object} doc - jsPDF 문서 객체
   * @param {string} filename - 파일명
   */
  downloadPDF(doc, filename) {
    try {
      const safeFilename = this.sanitizeFilename(filename);
      doc.save(safeFilename + '.pdf');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw new Error('PDF 다운로드에 실패했습니다.');
    }
  }

  /**
   * 마크다운 다운로드
   * @param {string} content - 마크다운 내용
   * @param {string} filename - 파일명
   */
  downloadMarkdown(content, filename) {
    try {
      const safeFilename = this.sanitizeFilename(filename);
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      this.downloadBlob(blob, safeFilename + '.md');
    } catch (error) {
      console.error('Failed to download markdown:', error);
      throw new Error('마크다운 다운로드에 실패했습니다.');
    }
  }

  /**
   * HTML 다운로드
   * @param {string} html - HTML 내용
   * @param {string} filename - 파일명
   */
  downloadHTML(html, filename) {
    try {
      const safeFilename = this.sanitizeFilename(filename);
      const fullHTML = this.wrapHTMLDocument(html);
      const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
      this.downloadBlob(blob, safeFilename + '.html');
    } catch (error) {
      console.error('Failed to download HTML:', error);
      throw new Error('HTML 다운로드에 실패했습니다.');
    }
  }

  /**
   * Blob 다운로드
   * @param {Blob} blob - Blob 객체
   * @param {string} filename - 파일명
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    // 정리
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * 파일명 정리 (안전한 파일명 생성)
   * @param {string} filename - 원본 파일명
   * @returns {string} 정리된 파일명
   */
  sanitizeFilename(filename) {
    // 특수문자 제거 및 공백을 언더스코어로 변경
    return filename
      .replace(/[^\w\s가-힣-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100) || 'document';
  }

  /**
   * HTML 문서로 래핑
   * @param {string} bodyHTML - Body 내용
   * @returns {string} 완전한 HTML 문서
   */
  wrapHTMLDocument(bodyHTML) {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    code {
      background-color: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: Monaco, Menlo, monospace;
      font-size: 0.9em;
    }
    pre {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 16px;
      margin-left: 0;
      color: #666;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    table th, table td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    table th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
${bodyHTML}
</body>
</html>`;
  }

  /**
   * 일괄 다운로드 (ZIP)
   * @param {Array} pdfs - PDF 정보 배열
   * @param {string} zipFilename - ZIP 파일명
   */
  async downloadBatch(pdfs, zipFilename) {
    try {
      if (typeof JSZip === 'undefined') {
        throw new Error('JSZip 라이브러리가 로드되지 않았습니다.');
      }

      const zip = new JSZip();

      pdfs.forEach((pdf, index) => {
        const pdfData = pdf.doc.output('blob');
        const filename = pdf.filename || `document_${index + 1}`;
        zip.file(`${this.sanitizeFilename(filename)}.pdf`, pdfData);
      });

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      this.downloadBlob(zipBlob, this.sanitizeFilename(zipFilename) + '.zip');
    } catch (error) {
      console.error('Failed to create ZIP:', error);
      throw new Error('ZIP 파일 생성에 실패했습니다.');
    }
  }

  /**
   * 진행 상황 이벤트 발생
   * @param {string} filename - 파일명
   * @param {number} progress - 진행률 (0-100)
   */
  dispatchProgressEvent(filename, progress) {
    const event = new CustomEvent('file-progress', {
      detail: {
        filename: filename,
        progress: progress
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * 드래그 앤 드롭 이벤트 핸들러 설정
   * @param {HTMLElement} element - 드롭 영역 요소
   * @param {Function} callback - 파일 드롭 콜백
   */
  setupDragAndDrop(element, callback) {
    // 드래그 오버
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.add('drag-over');
    });

    // 드래그 떠남
    element.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('drag-over');
    });

    // 드롭
    element.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        try {
          const results = await this.handleMultipleFiles(files);
          callback(results);
        } catch (error) {
          console.error('Drop handler error:', error);
        }
      }
    });
  }

  /**
   * 클립보드에서 텍스트 가져오기
   * @returns {Promise<string>} 클립보드 텍스트
   */
  async getFromClipboard() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        return await navigator.clipboard.readText();
      } else {
        throw new Error('Clipboard API not supported');
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      throw new Error('클립보드 읽기에 실패했습니다.');
    }
  }

  /**
   * 클립보드에 텍스트 복사
   * @param {string} text - 복사할 텍스트
   * @returns {Promise<boolean>} 성공 여부
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback
        return this.copyToClipboardFallback(text);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * 클립보드 복사 폴백 (구형 브라우저)
   * @param {string} text - 복사할 텍스트
   * @returns {boolean} 성공 여부
   */
  copyToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch (error) {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
