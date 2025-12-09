/**
 * FontLoader - 한글 폰트 로딩 클래스
 * PDF에 한글 폰트를 로드하고 관리
 */
class FontLoader {
  constructor() {
    this.loadedFonts = new Map();
    this.fontPaths = {
      'NanumGothic': 'fonts/NanumGothic.ttf',
      'NanumMyeongjo': 'fonts/NanumMyeongjo.ttf',
      'NanumPen': 'fonts/NanumPen.ttf'
    };
    this.loadingPromises = new Map();
  }

  /**
   * 폰트 로드
   * @param {Object} doc - jsPDF 문서 객체
   * @param {string} fontName - 폰트 이름
   * @returns {Promise<boolean>} 로드 성공 여부
   */
  async loadFont(doc, fontName) {
    // 이미 로드된 폰트인 경우
    if (this.loadedFonts.has(fontName)) {
      const fontData = this.loadedFonts.get(fontName);
      this.addFontToDoc(doc, fontName, fontData);
      return true;
    }

    // 이미 로딩 중인 경우 해당 Promise 반환
    if (this.loadingPromises.has(fontName)) {
      await this.loadingPromises.get(fontName);
      const fontData = this.loadedFonts.get(fontName);
      this.addFontToDoc(doc, fontName, fontData);
      return true;
    }

    // 새로운 폰트 로드
    const loadPromise = this.fetchAndCacheFont(fontName);
    this.loadingPromises.set(fontName, loadPromise);

    try {
      const fontData = await loadPromise;
      this.addFontToDoc(doc, fontName, fontData);
      this.loadingPromises.delete(fontName);
      return true;
    } catch (error) {
      console.error(`Failed to load font: ${fontName}`, error);
      this.loadingPromises.delete(fontName);
      return false;
    }
  }

  /**
   * 폰트 파일 가져오기 및 캐싱
   * @param {string} fontName - 폰트 이름
   * @returns {Promise<string>} Base64 인코딩된 폰트 데이터
   */
  async fetchAndCacheFont(fontName) {
    const fontPath = this.fontPaths[fontName];

    if (!fontPath) {
      throw new Error(`Unknown font: ${fontName}`);
    }

    try {
      // 폰트 파일 fetch
      const response = await fetch(fontPath);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // ArrayBuffer로 읽기
      const arrayBuffer = await response.arrayBuffer();

      // Base64로 변환
      const base64 = this.arrayBufferToBase64(arrayBuffer);

      // 캐시에 저장
      this.loadedFonts.set(fontName, base64);

      return base64;
    } catch (error) {
      console.error(`Failed to fetch font: ${fontPath}`, error);
      throw error;
    }
  }

  /**
   * 문서에 폰트 추가
   * @param {Object} doc - jsPDF 문서 객체
   * @param {string} fontName - 폰트 이름
   * @param {string} fontData - Base64 폰트 데이터
   */
  addFontToDoc(doc, fontName, fontData) {
    try {
      // VFS에 폰트 파일 추가
      doc.addFileToVFS(`${fontName}.ttf`, fontData);

      // 폰트 등록
      doc.addFont(`${fontName}.ttf`, fontName, 'normal');

      // 기본 폰트로 설정
      doc.setFont(fontName);
    } catch (error) {
      console.error(`Failed to add font to document: ${fontName}`, error);
      throw error;
    }
  }

  /**
   * ArrayBuffer를 Base64로 변환
   * @param {ArrayBuffer} buffer - ArrayBuffer
   * @returns {string} Base64 문자열
   */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    // 성능 최적화: 청크 단위로 처리
    const chunkSize = 0x8000; // 32KB chunks
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, chunk);
    }

    return window.btoa(binary);
  }

  /**
   * 폰트 미리로드 (최적화용)
   * @param {Array<string>} fontNames - 미리로드할 폰트 이름 배열
   * @returns {Promise<Array>} 로드 결과 배열
   */
  async preloadFonts(fontNames) {
    const promises = fontNames.map(async (fontName) => {
      try {
        await this.fetchAndCacheFont(fontName);
        return { fontName, success: true };
      } catch (error) {
        return { fontName, success: false, error };
      }
    });

    return Promise.all(promises);
  }

  /**
   * 모든 기본 폰트 미리로드
   * @returns {Promise<Array>} 로드 결과 배열
   */
  async preloadAllFonts() {
    const fontNames = Object.keys(this.fontPaths);
    return this.preloadFonts(fontNames);
  }

  /**
   * 폰트가 로드되었는지 확인
   * @param {string} fontName - 폰트 이름
   * @returns {boolean} 로드 여부
   */
  isFontLoaded(fontName) {
    return this.loadedFonts.has(fontName);
  }

  /**
   * 캐시된 폰트 제거
   * @param {string} fontName - 폰트 이름 (선택적)
   */
  clearCache(fontName = null) {
    if (fontName) {
      this.loadedFonts.delete(fontName);
    } else {
      this.loadedFonts.clear();
    }
  }

  /**
   * 사용 가능한 폰트 목록
   * @returns {Array<Object>} 폰트 정보 배열
   */
  getAvailableFonts() {
    return [
      {
        name: 'NanumGothic',
        displayName: '나눔고딕',
        family: 'sans-serif',
        description: '깔끔하고 읽기 편한 고딕체',
        loaded: this.isFontLoaded('NanumGothic')
      },
      {
        name: 'NanumMyeongjo',
        displayName: '나눔명조',
        family: 'serif',
        description: '전통적이고 격식있는 명조체',
        loaded: this.isFontLoaded('NanumMyeongjo')
      },
      {
        name: 'NanumPen',
        displayName: '나눔펜',
        family: 'cursive',
        description: '손글씨 느낌의 부드러운 펜체',
        loaded: this.isFontLoaded('NanumPen')
      }
    ];
  }

  /**
   * 폰트 로드 진행 상황 이벤트 발생
   * @param {string} fontName - 폰트 이름
   * @param {number} progress - 진행률 (0-100)
   */
  dispatchProgressEvent(fontName, progress) {
    const event = new CustomEvent('font-load-progress', {
      detail: {
        fontName: fontName,
        progress: progress
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * 폰트 파일 크기 확인
   * @param {string} fontName - 폰트 이름
   * @returns {Promise<number>} 파일 크기 (bytes)
   */
  async getFontSize(fontName) {
    const fontPath = this.fontPaths[fontName];

    if (!fontPath) {
      throw new Error(`Unknown font: ${fontName}`);
    }

    try {
      const response = await fetch(fontPath, { method: 'HEAD' });
      const size = response.headers.get('Content-Length');
      return size ? parseInt(size, 10) : 0;
    } catch (error) {
      console.error(`Failed to get font size: ${fontName}`, error);
      return 0;
    }
  }

  /**
   * 폰트 유효성 검사
   * @param {string} fontName - 폰트 이름
   * @returns {Promise<boolean>} 유효성 여부
   */
  async validateFont(fontName) {
    const fontPath = this.fontPaths[fontName];

    if (!fontPath) {
      return false;
    }

    try {
      const response = await fetch(fontPath, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error(`Failed to validate font: ${fontName}`, error);
      return false;
    }
  }

  /**
   * 모든 폰트 유효성 검사
   * @returns {Promise<Object>} 유효성 검사 결과
   */
  async validateAllFonts() {
    const results = {};

    for (const fontName of Object.keys(this.fontPaths)) {
      results[fontName] = await this.validateFont(fontName);
    }

    return results;
  }

  /**
   * 폰트 로드 통계
   * @returns {Object} 통계 정보
   */
  getStatistics() {
    const total = Object.keys(this.fontPaths).length;
    const loaded = this.loadedFonts.size;
    const loading = this.loadingPromises.size;

    return {
      total: total,
      loaded: loaded,
      loading: loading,
      remaining: total - loaded - loading,
      loadedFonts: Array.from(this.loadedFonts.keys())
    };
  }

  /**
   * 메모리 사용량 추정 (Base64 데이터 크기 기반)
   * @returns {number} 바이트 단위 크기
   */
  estimateMemoryUsage() {
    let totalSize = 0;

    for (const [fontName, base64Data] of this.loadedFonts.entries()) {
      // Base64는 원본보다 약 33% 크므로 원본 크기 추정
      totalSize += (base64Data.length * 3) / 4;
    }

    return Math.round(totalSize);
  }

  /**
   * 메모리 사용량 포맷팅
   * @returns {string} 포맷된 문자열
   */
  getFormattedMemoryUsage() {
    const bytes = this.estimateMemoryUsage();

    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
