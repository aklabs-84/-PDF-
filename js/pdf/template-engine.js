/**
 * TemplateEngine - PDF 템플릿 관리 클래스
 * 템플릿 로드, 선택, 커스터마이징 기능 제공
 */
class TemplateEngine {
  constructor() {
    this.templates = null;
    this.currentTemplate = null;
    this.customizations = {};
  }

  /**
   * 템플릿 초기화
   */
  async init() {
    await this.loadTemplates();
    console.log('TemplateEngine initialized');
  }

  /**
   * 템플릿 로드
   */
  async loadTemplates() {
    try {
      const response = await fetch('templates/templates.json');
      if (!response.ok) {
        throw new Error('Failed to load templates');
      }
      this.templates = await response.json();

      // 기본 템플릿 설정
      this.currentTemplate = this.getTemplate('clean');
    } catch (error) {
      console.error('Failed to load templates:', error);
      // 폴백: 기본 템플릿 사용
      this.templates = this.getDefaultTemplates();
      this.currentTemplate = this.templates.clean;
    }
  }

  /**
   * 기본 템플릿 (폴백용)
   */
  getDefaultTemplates() {
    return {
      clean: {
        name: 'clean',
        displayName: '클린',
        description: '심플하고 깔끔한 디자인. 일반 문서 및 메모에 적합합니다.',
        font: 'NanumGothic',
        fontSize: 12,
        lineHeight: 1.6,
        headingSize: {
          1: 26,
          2: 21,
          3: 18,
          4: 16,
          5: 14,
          6: 12
        },
        margin: {
          top: 72,
          right: 72,
          bottom: 72,
          left: 72
        },
        orientation: 'portrait',
        pageSize: 'a4',
        colors: {
          primary: '#2c3e50',
          secondary: '#7f8c8d',
          accent: '#3498db',
          code: '#ecf0f1',
          codeText: '#e74c3c'
        }
      },
      business: {
        name: 'business',
        displayName: '비즈니스',
        description: '전문적인 비즈니스 문서용. 보고서, 제안서에 최적화되어 있습니다.',
        font: 'NanumMyeongjo',
        fontSize: 11,
        lineHeight: 1.8,
        headingSize: {
          1: 24,
          2: 19,
          3: 16,
          4: 14,
          5: 12,
          6: 11
        },
        margin: {
          top: 90,
          right: 80,
          bottom: 90,
          left: 80
        },
        orientation: 'portrait',
        pageSize: 'a4',
        colors: {
          primary: '#1a202c',
          secondary: '#4a5568',
          accent: '#2b6cb0',
          code: '#edf2f7',
          codeText: '#2d3748'
        }
      },
      academic: {
        name: 'academic',
        displayName: '학술',
        description: '논문 및 학술 자료용. 넓은 줄 간격과 큰 여백으로 가독성이 뛰어납니다.',
        font: 'NanumMyeongjo',
        fontSize: 11,
        lineHeight: 2.0,
        headingSize: {
          1: 22,
          2: 18,
          3: 15,
          4: 13,
          5: 12,
          6: 11
        },
        margin: {
          top: 108,
          right: 90,
          bottom: 108,
          left: 90
        },
        orientation: 'portrait',
        pageSize: 'a4',
        colors: {
          primary: '#000000',
          secondary: '#4a4a4a',
          accent: '#1e3a8a',
          code: '#f9fafb',
          codeText: '#374151'
        }
      },
      creative: {
        name: 'creative',
        displayName: '크리에이티브',
        description: '창의적이고 독특한 디자인. 개인 블로그, 창작물에 어울립니다.',
        font: 'NanumPen',
        fontSize: 15,
        lineHeight: 1.7,
        headingSize: {
          1: 32,
          2: 26,
          3: 22,
          4: 19,
          5: 17,
          6: 15
        },
        margin: {
          top: 60,
          right: 60,
          bottom: 60,
          left: 60
        },
        orientation: 'portrait',
        pageSize: 'a4',
        colors: {
          primary: '#4a5568',
          secondary: '#718096',
          accent: '#805ad5',
          code: '#faf5ff',
          codeText: '#6b46c1'
        }
      }
    };
  }

  /**
   * 템플릿 가져오기
   * @param {string} name - 템플릿 이름
   * @returns {Object} 템플릿 객체
   */
  getTemplate(name) {
    if (!this.templates) {
      return null;
    }
    return this.templates[name] || this.templates.clean;
  }

  /**
   * 모든 템플릿 가져오기
   * @returns {Array} 템플릿 배열
   */
  getAllTemplates() {
    if (!this.templates) {
      return [];
    }
    return Object.values(this.templates);
  }

  /**
   * 현재 템플릿 설정
   * @param {string} name - 템플릿 이름
   */
  setCurrentTemplate(name) {
    const template = this.getTemplate(name);
    if (template) {
      this.currentTemplate = template;
      this.customizations = {}; // 커스터마이징 초기화
    }
  }

  /**
   * 현재 템플릿 가져오기
   * @returns {Object} 현재 템플릿
   */
  getCurrentTemplate() {
    return this.currentTemplate || this.getTemplate('clean');
  }

  /**
   * 템플릿 커스터마이징
   * @param {Object} options - 커스터마이징 옵션
   * @returns {Object} 커스터마이징된 템플릿
   */
  customizeTemplate(options = {}) {
    const base = this.getCurrentTemplate();

    // 커스터마이징 옵션 병합
    this.customizations = {
      ...this.customizations,
      ...options
    };

    return {
      ...base,
      font: this.customizations.font || base.font,
      fontSize: this.customizations.fontSize || base.fontSize,
      lineHeight: this.customizations.lineHeight || base.lineHeight,
      margin: this.customizations.margin || base.margin,
      orientation: this.customizations.orientation || base.orientation,
      pageSize: this.customizations.pageSize || base.pageSize,
      colors: {
        ...base.colors,
        ...(this.customizations.colors || {})
      }
    };
  }

  /**
   * 현재 커스터마이징된 템플릿 가져오기
   * @returns {Object} 템플릿 객체
   */
  getActiveTemplate() {
    if (Object.keys(this.customizations).length === 0) {
      return this.getCurrentTemplate();
    }
    return this.customizeTemplate();
  }

  /**
   * 커스터마이징 옵션 가져오기
   * @returns {Object} 커스터마이징 옵션
   */
  getCustomizations() {
    return { ...this.customizations };
  }

  /**
   * 커스터마이징 초기화
   */
  resetCustomizations() {
    this.customizations = {};
  }

  /**
   * 폰트 옵션 가져오기
   * @returns {Array} 폰트 배열
   */
  getFontOptions() {
    return [
      { value: 'NanumGothic', label: '나눔고딕', family: 'sans-serif' },
      { value: 'NanumMyeongjo', label: '나눔명조', family: 'serif' },
      { value: 'NanumPen', label: '나눔펜', family: 'cursive' }
    ];
  }

  /**
   * 페이지 크기 옵션 가져오기
   * @returns {Array} 페이지 크기 배열
   */
  getPageSizeOptions() {
    return [
      { value: 'a4', label: 'A4 (210 × 297mm)', width: 595, height: 842 },
      { value: 'letter', label: 'Letter (216 × 279mm)', width: 612, height: 792 },
      { value: 'b5', label: 'B5 (176 × 250mm)', width: 499, height: 709 }
    ];
  }

  /**
   * 페이지 방향 옵션 가져오기
   * @returns {Array} 방향 배열
   */
  getOrientationOptions() {
    return [
      { value: 'portrait', label: '세로' },
      { value: 'landscape', label: '가로' }
    ];
  }

  /**
   * 여백 프리셋 가져오기
   * @returns {Array} 여백 프리셋 배열
   */
  getMarginPresets() {
    return [
      {
        name: 'narrow',
        label: '좁게',
        margin: { top: 36, right: 36, bottom: 36, left: 36 }
      },
      {
        name: 'normal',
        label: '보통',
        margin: { top: 72, right: 72, bottom: 72, left: 72 }
      },
      {
        name: 'wide',
        label: '넓게',
        margin: { top: 108, right: 108, bottom: 108, left: 108 }
      }
    ];
  }

  /**
   * 템플릿 미리보기 HTML 생성
   * @param {string} templateName - 템플릿 이름
   * @returns {string} 미리보기 HTML
   */
  generatePreviewHTML(templateName) {
    const template = this.getTemplate(templateName);
    if (!template) return '';

    return `
      <div class="template-preview p-4 border rounded-lg" style="
        font-family: ${template.font}, sans-serif;
        font-size: ${template.fontSize}px;
        line-height: ${template.lineHeight};
        color: ${template.colors.primary};
      ">
        <h1 style="font-size: ${template.headingSize[1]}px; margin-bottom: 8px;">
          제목 샘플
        </h1>
        <p style="margin-bottom: 8px;">
          이것은 ${template.displayName} 템플릿의 미리보기입니다.
        </p>
        <h2 style="font-size: ${template.headingSize[2]}px; margin-bottom: 6px;">
          부제목
        </h2>
        <p style="color: ${template.colors.secondary};">
          본문 텍스트 샘플입니다.
        </p>
      </div>
    `;
  }

  /**
   * 템플릿 설정 유효성 검사
   * @param {Object} template - 템플릿 객체
   * @returns {boolean} 유효성 여부
   */
  validateTemplate(template) {
    const required = [
      'name', 'displayName', 'font', 'fontSize',
      'lineHeight', 'headingSize', 'margin',
      'orientation', 'pageSize'
    ];

    for (const field of required) {
      if (!(field in template)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // 제목 크기 검증
    if (typeof template.headingSize !== 'object') {
      console.error('Invalid headingSize');
      return false;
    }

    // 여백 검증
    const marginFields = ['top', 'right', 'bottom', 'left'];
    for (const field of marginFields) {
      if (!(field in template.margin)) {
        console.error(`Missing margin field: ${field}`);
        return false;
      }
    }

    return true;
  }

  /**
   * 템플릿을 JSON으로 내보내기
   * @param {string} templateName - 템플릿 이름
   * @returns {string} JSON 문자열
   */
  exportTemplate(templateName) {
    const template = this.getTemplate(templateName);
    if (!template) return null;

    return JSON.stringify(template, null, 2);
  }

  /**
   * JSON에서 템플릿 가져오기
   * @param {string} jsonString - JSON 문자열
   * @returns {Object|null} 템플릿 객체
   */
  importTemplate(jsonString) {
    try {
      const template = JSON.parse(jsonString);

      if (!this.validateTemplate(template)) {
        throw new Error('Invalid template format');
      }

      return template;
    } catch (error) {
      console.error('Failed to import template:', error);
      return null;
    }
  }

  /**
   * 커스텀 템플릿 저장
   * @param {string} name - 템플릿 이름
   * @param {Object} template - 템플릿 객체
   */
  saveCustomTemplate(name, template) {
    try {
      const customTemplates = this.getCustomTemplates();
      customTemplates[name] = template;

      localStorage.setItem('kpdf_custom_templates',
        JSON.stringify(customTemplates));

      return true;
    } catch (error) {
      console.error('Failed to save custom template:', error);
      return false;
    }
  }

  /**
   * 커스텀 템플릿 가져오기
   * @returns {Object} 커스텀 템플릿 객체
   */
  getCustomTemplates() {
    try {
      const data = localStorage.getItem('kpdf_custom_templates');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get custom templates:', error);
      return {};
    }
  }

  /**
   * 템플릿 비교
   * @param {string} name1 - 첫 번째 템플릿 이름
   * @param {string} name2 - 두 번째 템플릿 이름
   * @returns {Object} 차이점 객체
   */
  compareTemplates(name1, name2) {
    const t1 = this.getTemplate(name1);
    const t2 = this.getTemplate(name2);

    if (!t1 || !t2) return null;

    const differences = {};

    for (const key in t1) {
      if (JSON.stringify(t1[key]) !== JSON.stringify(t2[key])) {
        differences[key] = {
          template1: t1[key],
          template2: t2[key]
        };
      }
    }

    return differences;
  }
}
