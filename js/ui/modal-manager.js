/**
 * ModalManager - 모달 관리 클래스
 * 모달 창 생성, 표시, 숨김 기능 제공
 */
class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
  }

  /**
   * 모달 생성 및 표시
   * @param {string} id - 모달 ID
   * @param {Object} options - 모달 옵션
   */
  show(id, options = {}) {
    // 기존 모달이 있으면 제거
    if (this.activeModal) {
      this.close(this.activeModal);
    }

    const modal = this.createModal(id, options);
    document.body.appendChild(modal);

    this.modals.set(id, modal);
    this.activeModal = id;

    // 애니메이션을 위한 작은 지연
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);

    // ESC 키로 닫기
    this.setupKeyHandler(id);
  }

  /**
   * 모달 생성
   * @param {string} id - 모달 ID
   * @param {Object} options - 모달 옵션
   * @returns {HTMLElement} 모달 요소
   */
  createModal(id, options) {
    const {
      title = '모달',
      content = '',
      buttons = [],
      size = 'medium',
      closeOnBackdrop = true
    } = options;

    const modal = document.createElement('div');
    modal.id = `modal-${id}`;
    modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 opacity-0 transition-opacity duration-200';

    const sizeClasses = {
      small: 'max-w-md',
      medium: 'max-w-2xl',
      large: 'max-w-4xl',
      xlarge: 'max-w-6xl'
    };

    modal.innerHTML = `
      <div class="modal-content bg-white dark:bg-gray-800 rounded-lg shadow-2xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-y-auto transform scale-95 transition-transform duration-200">
        <div class="modal-header flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${title}</h3>
          <button class="modal-close p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="modal-body p-6">
          ${content}
        </div>
        ${buttons.length > 0 ? `
          <div class="modal-footer flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            ${buttons.map(btn => `
              <button class="modal-button px-4 py-2 rounded-lg transition-colors ${btn.className || 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}" data-action="${btn.action}">
                ${btn.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    // 이벤트 리스너
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => this.close(id));

    if (closeOnBackdrop) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close(id);
        }
      });
    }

    // 버튼 이벤트
    const buttonElements = modal.querySelectorAll('.modal-button');
    buttonElements.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'close') {
          this.close(id);
        } else {
          this.triggerAction(id, action);
        }
      });
    });

    return modal;
  }

  /**
   * 모달 닫기
   * @param {string} id - 모달 ID
   */
  close(id) {
    const modal = this.modals.get(id);
    if (!modal) return;

    modal.classList.remove('active');

    setTimeout(() => {
      modal.remove();
      this.modals.delete(id);

      if (this.activeModal === id) {
        this.activeModal = null;
      }
    }, 200);
  }

  /**
   * 모든 모달 닫기
   */
  closeAll() {
    for (const id of this.modals.keys()) {
      this.close(id);
    }
  }

  /**
   * 키보드 핸들러 설정
   * @param {string} id - 모달 ID
   */
  setupKeyHandler(id) {
    const handler = (e) => {
      if (e.key === 'Escape' && this.activeModal === id) {
        this.close(id);
        document.removeEventListener('keydown', handler);
      }
    };

    document.addEventListener('keydown', handler);
  }

  /**
   * 액션 트리거
   * @param {string} id - 모달 ID
   * @param {string} action - 액션 이름
   */
  triggerAction(id, action) {
    const event = new CustomEvent('modal-action', {
      detail: {
        modalId: id,
        action: action
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * 확인 다이얼로그
   * @param {string} message - 메시지
   * @param {Function} onConfirm - 확인 콜백
   * @param {Function} onCancel - 취소 콜백
   */
  confirm(message, onConfirm, onCancel) {
    const id = 'confirm-' + Date.now();

    this.show(id, {
      title: '확인',
      content: `<p class="text-gray-700 dark:text-gray-300">${message}</p>`,
      size: 'small',
      buttons: [
        { label: '취소', action: 'cancel', className: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600' },
        { label: '확인', action: 'confirm', className: 'bg-blue-600 text-white hover:bg-blue-700' }
      ]
    });

    const handler = (e) => {
      if (e.detail.modalId === id) {
        if (e.detail.action === 'confirm' && onConfirm) {
          onConfirm();
        } else if (e.detail.action === 'cancel' && onCancel) {
          onCancel();
        }
        this.close(id);
        window.removeEventListener('modal-action', handler);
      }
    };

    window.addEventListener('modal-action', handler);
  }

  /**
   * 알림 다이얼로그
   * @param {string} message - 메시지
   * @param {Function} onClose - 닫기 콜백
   */
  alert(message, onClose) {
    const id = 'alert-' + Date.now();

    this.show(id, {
      title: '알림',
      content: `<p class="text-gray-700 dark:text-gray-300">${message}</p>`,
      size: 'small',
      buttons: [
        { label: '확인', action: 'close', className: 'bg-blue-600 text-white hover:bg-blue-700' }
      ]
    });

    if (onClose) {
      const handler = (e) => {
        if (e.detail.modalId === id) {
          onClose();
          window.removeEventListener('modal-action', handler);
        }
      };
      window.addEventListener('modal-action', handler);
    }
  }

  /**
   * 프롬프트 다이얼로그
   * @param {string} message - 메시지
   * @param {string} defaultValue - 기본값
   * @param {Function} onSubmit - 제출 콜백
   */
  prompt(message, defaultValue = '', onSubmit) {
    const id = 'prompt-' + Date.now();

    this.show(id, {
      title: '입력',
      content: `
        <p class="text-gray-700 dark:text-gray-300 mb-3">${message}</p>
        <input type="text" id="prompt-input-${id}" value="${defaultValue}"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
      `,
      size: 'small',
      buttons: [
        { label: '취소', action: 'cancel', className: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600' },
        { label: '확인', action: 'submit', className: 'bg-blue-600 text-white hover:bg-blue-700' }
      ]
    });

    const handler = (e) => {
      if (e.detail.modalId === id) {
        if (e.detail.action === 'submit' && onSubmit) {
          const input = document.getElementById(`prompt-input-${id}`);
          onSubmit(input.value);
        }
        this.close(id);
        window.removeEventListener('modal-action', handler);
      }
    };

    window.addEventListener('modal-action', handler);

    // 입력 필드에 포커스
    setTimeout(() => {
      const input = document.getElementById(`prompt-input-${id}`);
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  /**
   * 로딩 모달
   * @param {string} message - 메시지
   * @returns {string} 모달 ID
   */
  loading(message = '처리 중...') {
    const id = 'loading-' + Date.now();

    this.show(id, {
      title: '',
      content: `
        <div class="flex flex-col items-center py-4">
          <div class="spinner border-4 border-blue-600 mb-4"></div>
          <p class="text-gray-700 dark:text-gray-300">${message}</p>
        </div>
      `,
      size: 'small',
      closeOnBackdrop: false
    });

    // 닫기 버튼 숨기기
    const modal = this.modals.get(id);
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.style.display = 'none';
    }

    return id;
  }

  /**
   * 진행률 모달
   * @param {string} message - 메시지
   * @returns {Object} 모달 컨트롤러
   */
  progress(message = '처리 중...') {
    const id = 'progress-' + Date.now();

    this.show(id, {
      title: message,
      content: `
        <div class="py-4">
          <div class="progress-bar mb-2">
            <div class="progress-bar-fill" id="progress-fill-${id}" style="width: 0%"></div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 text-center" id="progress-text-${id}">0%</p>
        </div>
      `,
      size: 'small',
      closeOnBackdrop: false
    });

    // 닫기 버튼 숨기기
    const modal = this.modals.get(id);
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.style.display = 'none';
    }

    return {
      id: id,
      update: (percent, text) => {
        const fill = document.getElementById(`progress-fill-${id}`);
        const textEl = document.getElementById(`progress-text-${id}`);
        if (fill) fill.style.width = `${percent}%`;
        if (textEl) textEl.textContent = text || `${Math.round(percent)}%`;
      },
      close: () => this.close(id)
    };
  }
}
