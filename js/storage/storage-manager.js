/**
 * StorageManager - 로컬 스토리지 관리 클래스
 * 문서 저장, 불러오기, 삭제, 검색 기능 제공
 */
class StorageManager {
  static STORAGE_KEY = 'kpdf_documents';
  static SETTINGS_KEY = 'kpdf_settings';
  static MAX_DOCUMENTS = 20;

  /**
   * 문서 저장
   * @param {Object} document - 저장할 문서 객체
   * @returns {boolean} 저장 성공 여부
   */
  static saveDocument(document) {
    try {
      const documents = this.getAllDocuments();
      const index = documents.findIndex(d => d.id === document.id);

      if (index > -1) {
        // 기존 문서 업데이트
        documents[index] = document;
      } else {
        // 새 문서 추가
        documents.unshift(document);

        // 최대 개수 제한
        if (documents.length > this.MAX_DOCUMENTS) {
          documents.pop();
        }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));
      return true;
    } catch (error) {
      console.error('Failed to save document:', error);

      // 용량 초과 에러 처리
      if (error.name === 'QuotaExceededError') {
        this.showStorageFullError();
      }

      return false;
    }
  }

  /**
   * 모든 문서 가져오기
   * @returns {Array} 문서 배열
   */
  static getAllDocuments() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get documents:', error);
      return [];
    }
  }

  /**
   * 특정 문서 가져오기
   * @param {number} id - 문서 ID
   * @returns {Object|null} 문서 객체 또는 null
   */
  static getDocument(id) {
    const documents = this.getAllDocuments();
    return documents.find(d => d.id === id) || null;
  }

  /**
   * 문서 삭제
   * @param {number} id - 삭제할 문서 ID
   * @returns {boolean} 삭제 성공 여부
   */
  static deleteDocument(id) {
    try {
      const documents = this.getAllDocuments();
      const filtered = documents.filter(d => d.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete document:', error);
      return false;
    }
  }

  /**
   * 모든 문서 삭제
   * @returns {boolean} 삭제 성공 여부
   */
  static deleteAllDocuments() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to delete all documents:', error);
      return false;
    }
  }

  /**
   * 문서 검색
   * @param {string} query - 검색어
   * @returns {Array} 검색 결과 문서 배열
   */
  static searchDocuments(query) {
    const documents = this.getAllDocuments();
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return documents;
    }

    return documents.filter(doc =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 최근 문서 가져오기
   * @param {number} count - 가져올 문서 개수
   * @returns {Array} 최근 문서 배열
   */
  static getRecentDocuments(count = 5) {
    const documents = this.getAllDocuments();
    return documents.slice(0, count);
  }

  /**
   * 스토리지 용량 체크
   * @returns {Object} 용량 정보 객체
   */
  static checkStorageSize() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY) || '';
      const size = new Blob([data]).size;
      const maxSize = 5 * 1024 * 1024; // 5MB (LocalStorage 일반적 제한의 절반)

      return {
        used: size,
        max: maxSize,
        percentage: (size / maxSize) * 100,
        available: maxSize - size
      };
    } catch (error) {
      console.error('Failed to check storage size:', error);
      return {
        used: 0,
        max: 0,
        percentage: 0,
        available: 0
      };
    }
  }

  /**
   * 설정 저장
   * @param {Object} settings - 설정 객체
   */
  static saveSettings(settings) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * 설정 가져오기
   * @returns {Object} 설정 객체
   */
  static getSettings() {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * 기본 설정 가져오기
   * @returns {Object} 기본 설정 객체
   */
  static getDefaultSettings() {
    return {
      theme: 'light',
      autoSave: true,
      autoSaveInterval: 30000, // 30초
      defaultTemplate: 'clean',
      fontSize: 12,
      showLineNumbers: false,
      enableSpellCheck: true
    };
  }

  /**
   * 스토리지 초과 에러 표시
   */
  static showStorageFullError() {
    const event = new CustomEvent('storage-full', {
      detail: {
        message: '저장 공간이 부족합니다. 오래된 문서를 삭제해주세요.'
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * 스토리지 정리 (오래된 문서 삭제)
   * @param {number} keepCount - 유지할 문서 개수
   */
  static cleanupOldDocuments(keepCount = 10) {
    try {
      const documents = this.getAllDocuments();
      if (documents.length <= keepCount) {
        return;
      }

      const sorted = documents.sort((a, b) =>
        new Date(b.lastModified) - new Date(a.lastModified)
      );

      const kept = sorted.slice(0, keepCount);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(kept));

      return documents.length - kept.length;
    } catch (error) {
      console.error('Failed to cleanup documents:', error);
      return 0;
    }
  }

  /**
   * 문서 내보내기 (JSON)
   * @returns {string} JSON 문자열
   */
  static exportDocuments() {
    const documents = this.getAllDocuments();
    return JSON.stringify(documents, null, 2);
  }

  /**
   * 문서 가져오기 (JSON)
   * @param {string} jsonString - JSON 문자열
   * @returns {boolean} 가져오기 성공 여부
   */
  static importDocuments(jsonString) {
    try {
      const documents = JSON.parse(jsonString);

      if (!Array.isArray(documents)) {
        throw new Error('Invalid format');
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));
      return true;
    } catch (error) {
      console.error('Failed to import documents:', error);
      return false;
    }
  }

  /**
   * 문서 통계 가져오기
   * @returns {Object} 통계 객체
   */
  static getStatistics() {
    const documents = this.getAllDocuments();
    const totalChars = documents.reduce((sum, doc) => sum + doc.content.length, 0);
    const totalWords = documents.reduce((sum, doc) => {
      return sum + doc.content.split(/\s+/).length;
    }, 0);

    return {
      totalDocuments: documents.length,
      totalCharacters: totalChars,
      totalWords: totalWords,
      storageInfo: this.checkStorageSize()
    };
  }
}

// 스토리지 이벤트 리스너 (다른 탭에서의 변경 감지)
window.addEventListener('storage', (e) => {
  if (e.key === StorageManager.STORAGE_KEY) {
    const event = new CustomEvent('documents-changed', {
      detail: {
        oldValue: e.oldValue ? JSON.parse(e.oldValue) : null,
        newValue: e.newValue ? JSON.parse(e.newValue) : null
      }
    });
    window.dispatchEvent(event);
  }
});
