/**
 * PasteHandler - 스마트 복사/붙여넣기 및 텍스트 자동 정리 핸들러
 * Rich Text (HTML)를 Markdown으로 변환하고 텍스트를 정리합니다.
 */
class PasteHandler {
  constructor(editorElement) {
    this.editorElement = editorElement;
    this.turndownService = null;
    
    this.initTurndown();
  }

  /**
   * Turndown 서비스 초기화 (옵션 설정)
   */
  initTurndown() {
    if (typeof TurndownService !== 'undefined') {
      this.turndownService = new TurndownService({
        headingStyle: 'atx',
        hr: '---',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced'
      });
      
      // 테이블 변환 규칙 추가 (기본 turndown은 table을 지원하지 않아 gfm 플러그인이 필요하지만
      // 플러그인이 없다면 렌더링을 유지하거나 텍스트로 보존하는 기본 룰이 들어감)
      // 가능하면 커스텀 룰을 넣어 확장성을 둡니다.
      this.turndownService.keep(['table', 'tr', 'td', 'th', 'tbody', 'thead']);
    } else {
      console.warn('TurndownService is not loaded. Smart HTML pasting will be disabled.');
    }
  }

  /**
   * Paste 이벤트 핸들링 (에디터에 붙여넣기 할 때)
   */
  handlePaste(e) {


    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');

    // HTML 데이터가 있고, turndown이 로드되어 있다면 마크다운으로 변환
    if (htmlData && this.turndownService) {
      e.preventDefault(); // 기본 붙여넣기 동작 막기
      
      try {
        // 임시 DOM에 넣어서 불필요한 메타 태그 무시
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlData;
        
        const markdown = this.turndownService.turndown(tempDiv.innerHTML);
        this._insertTextAtCursor(markdown);
      } catch (err) {
        console.error('Failed to parse pasted HTML:', err);
        // 에러 시 일반 텍스트로 폴백
        this._insertTextAtCursor(textData);
      }
    } 
    // HTML이 없다면 일반 텍스트 붙여넣기 (기본 동작 허용)
  }

  /**
   * 커서 위치에 텍스트 삽입
   * @private
   */
  _insertTextAtCursor(text) {
    const start = this.editorElement.selectionStart;
    const end = this.editorElement.selectionEnd;
    const value = this.editorElement.value;

    this.editorElement.value = value.substring(0, start) + text + value.substring(end);
    this.editorElement.selectionStart = this.editorElement.selectionEnd = start + text.length;

    // 변경 이벤트 강제 발생시켜 미리보기 및 라인 수 업데이트
    this.editorElement.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * 텍스트 자동 정리 (들여쓰기 통일, 빈 줄 정리)
   * 일반 텍스트가 붙여넣어졌을 때 사용자가 '텍스트 자동 정리' 버튼을 누르면 호출
   * 
   * [AI Formatting Hook]
   * 추후 OpenAI API를 연결한다면 이 부분에서 비동기 호출 후 반환값을 에디터에 넣도록 확장 가능.
   */
  formatText() {
    const val = this.editorElement.value;
    if (!val) return;

    let lines = val.split('\n');
    let formattedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // 1. 과도한 빈 줄 제거 (3줄 이상 빈줄을 2줄로)
        if (line.trim() === '' && formattedLines.length > 0 && formattedLines[formattedLines.length-1].trim() === '') {
            // 이미 직전 줄이 빈 줄이라면 이번 빈 줄은 스킵 (최대 1줄 빈줄 유지)
            // 좀 더 여유를 두고 싶다면 로직 조정
            if(formattedLines.length > 1 && formattedLines[formattedLines.length-2].trim() === '') {
                continue; 
            }
        }
        
        // 2. 문단 맨 앞의 불필요한 공백/탭 정리 (하지만 리스트형태의 들여쓰기는 보존 노력)
        const matchSpaces = line.match(/^(\s+)/);
        if (matchSpaces && matchSpaces[1].length > 4 && !line.match(/^\s*[-*0-9]/)) {
            // 들여쓰기가 과도하면서 리스트 기호가 없는 경우, 단순 정렬 오류로 보고 제거
            line = line.trimStart();
        }

        formattedLines.push(line);
    }
    
    // 에디터 적용
    this.editorElement.value = formattedLines.join('\n');
    this.editorElement.dispatchEvent(new Event('input', { bubbles: true }));
    
    if (window.app && window.app.uiManager) {
      window.app.uiManager.showToast('info', '텍스트 여백과 줄바꿈이 정리되었습니다.', 2000);
    }
  }
}
