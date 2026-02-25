/**
 * SlashMenu Class
 * Handles the Notion-style slash command dropdown widget.
 */
class SlashMenu {
  constructor(editorManager) {
    this.editorManager = editorManager;
    this.textarea = editorManager.textarea;
    
    // UI Elements
    this.menuElement = null;
    this.mirrorDiv = null;
    
    // State
    this.isActive = false;
    this.slashIndex = -1; // Position of the '/' in the textarea
    this.selectedIndex = 0;
    
    this.commands = [
      { id: 'heading1', icon: 'H1', label: '제목 1', action: () => this.executeCommand('heading1') },
      { id: 'heading2', icon: 'H2', label: '제목 2', action: () => this.executeCommand('heading2') },
      { id: 'heading3', icon: 'H3', label: '제목 3', action: () => this.executeCommand('heading3') },
      { id: 'bold', icon: 'B', label: '굵게', action: () => this.executeCommand('bold') },
      { id: 'italic', icon: 'I', label: '기울임', action: () => this.executeCommand('italic') },
      { id: 'quote', icon: '❝', label: '인용구', action: () => this.executeCommand('quote') },
      { id: 'code', icon: '</>', label: '코드 블록', action: () => this.executeCommand('code') },
      { id: 'table', icon: '▦', label: '표', action: () => this.executeCommand('table') },
      { id: 'math', icon: '∑', label: '수식 (KaTeX)', action: () => this.executeCommand('math') },
      { id: 'mermaid', icon: '⑆', label: '다이어그램 (Mermaid)', action: () => this.executeCommand('mermaid') },
      { id: 'checkList', icon: '☑', label: '할 일 목록', action: () => this.executeCommand('checkList') }
    ];

    this.init();
  }

  init() {
    this.createMenu();
    this.createMirrorDiv();
    this.bindEvents();
  }

  createMenu() {
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'absolute z-50 hidden bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-48 py-2 text-sm';
    
    this.renderMenuItems();
    document.body.appendChild(this.menuElement);
  }

  renderMenuItems() {
    this.menuElement.innerHTML = '';
    this.commands.forEach((cmd, index) => {
      const item = document.createElement('div');
      item.className = `px-4 py-2 cursor-pointer flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${index === this.selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''}`;
      
      const iconSpan = document.createElement('span');
      iconSpan.className = 'font-bold w-5 text-center text-gray-500';
      iconSpan.textContent = cmd.icon;
      
      const labelSpan = document.createElement('span');
      labelSpan.textContent = cmd.label;

      item.appendChild(iconSpan);
      item.appendChild(labelSpan);
      
      item.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.renderMenuItems();
      });
      
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        cmd.action();
      });
      
      this.menuElement.appendChild(item);
    });
  }

  createMirrorDiv() {
    this.mirrorDiv = document.createElement('div');
    this.mirrorDiv.style.position = 'absolute';
    this.mirrorDiv.style.visibility = 'hidden';
    this.mirrorDiv.style.whiteSpace = 'pre-wrap';
    this.mirrorDiv.style.wordWrap = 'break-word';
    this.mirrorDiv.style.overflowWrap = 'break-word';
    document.body.appendChild(this.mirrorDiv);
  }

  syncMirrorStyles() {
    const style = window.getComputedStyle(this.textarea);
    const properties = [
      'boxSizing', 'width', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
      'letterSpacing', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'
    ];
    properties.forEach(prop => {
      this.mirrorDiv.style[prop] = style[prop];
    });
  }

  bindEvents() {
    // Input Event: Trigger or filter slash menu
    this.textarea.addEventListener('input', (e) => {
      const val = this.textarea.value;
      const caretPos = this.textarea.selectionStart;

      // Type '/'
      if (e.data === '/') {
        this.openMenu(caretPos);
      } else if (this.isActive) {
        // Close menu if user deletes the slash or moves far away
        if (caretPos <= this.slashIndex || val.charAt(this.slashIndex - 1) !== '/') {
          this.closeMenu();
        }
      }
    });

    // Keyboard Event: Navigation in menu
    this.textarea.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex + 1) % this.commands.length;
        this.renderMenuItems();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex - 1 + this.commands.length) % this.commands.length;
        this.renderMenuItems();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.commands[this.selectedIndex].action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeMenu();
      }
    });

    // Click outside to close
    document.addEventListener('mousedown', (e) => {
      if (this.isActive && !this.menuElement.contains(e.target) && e.target !== this.textarea) {
        this.closeMenu();
      }
    });
    
    // Close on Scroll
    this.textarea.addEventListener('scroll', () => {
      if (this.isActive) this.closeMenu();
    });
  }

  openMenu(caretPos) {
    this.isActive = true;
    this.slashIndex = caretPos;
    this.selectedIndex = 0;
    this.renderMenuItems();
    this.updateMenuPosition(caretPos);
    this.menuElement.classList.remove('hidden');
  }

  closeMenu() {
    this.isActive = false;
    this.menuElement.classList.add('hidden');
  }

  updateMenuPosition(caretPos) {
    this.syncMirrorStyles();
    
    const textBeforeCaret = this.textarea.value.substring(0, caretPos);
    this.mirrorDiv.textContent = textBeforeCaret;
    
    const span = document.createElement('span');
    span.textContent = '.';
    this.mirrorDiv.appendChild(span);
    
    const textareaRect = this.textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const mirrorRect = this.mirrorDiv.getBoundingClientRect();

    // calculate coords relative to textarea
    const top = textareaRect.top + (spanRect.top - mirrorRect.top) - this.textarea.scrollTop + window.scrollY;
    const left = textareaRect.left + (spanRect.left - mirrorRect.left) + window.scrollX;
    
    // Drop down below the slash logic
    const lineHeight = parseFloat(window.getComputedStyle(this.textarea).lineHeight);
    
    this.menuElement.style.top = `${top + lineHeight}px`;
    this.menuElement.style.left = `${left}px`;
  }

  executeCommand(commandId) {
    // Delete the '/' that spawned the menu
    const val = this.textarea.value;
    const beforeSlash = val.substring(0, this.slashIndex - 1);
    const afterSlash = val.substring(this.slashIndex);
    
    this.textarea.value = beforeSlash + afterSlash;
    this.textarea.setSelectionRange(this.slashIndex - 1, this.slashIndex - 1);
    
    this.closeMenu();

    // Trigger markdown helper mapped globally
    switch(commandId) {
      case 'heading1': window.dispatchEvent(new CustomEvent('markdown-heading1')); break;
      case 'heading2': window.dispatchEvent(new CustomEvent('markdown-heading2')); break;
      case 'heading3': window.dispatchEvent(new CustomEvent('markdown-heading3')); break;
      case 'bold': window.dispatchEvent(new CustomEvent('markdown-bold')); break;
      case 'italic': window.dispatchEvent(new CustomEvent('markdown-italic')); break;
      case 'quote': window.dispatchEvent(new CustomEvent('markdown-quote')); break;
      case 'code': window.dispatchEvent(new CustomEvent('markdown-code')); break;
      case 'table': window.dispatchEvent(new CustomEvent('markdown-table')); break;
      case 'math': window.dispatchEvent(new CustomEvent('markdown-math')); break;
      case 'mermaid': window.dispatchEvent(new CustomEvent('markdown-mermaid')); break;
      case 'checkList': window.dispatchEvent(new CustomEvent('markdown-check-list')); break;
    }
    
    this.textarea.focus();
  }
}
