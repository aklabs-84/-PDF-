# 작업 로그 - 03: Undo/Redo 기능 및 복사 알림창 연동

**작업일자**: 2026-02-25
**작업자**: Antigravity (서기)
**요약**: 에디터 상단 툴바에 수정한 내용을 뒤로 되돌리거나 앞으로 다시 실행할 수 있는 Undo/Redo 버튼 아이콘을 추가하고 동작을 구현했습니다. 아울러 '내보내기'나 '복사' 실행을 성공적으로 수행했을 때 사용자에게 안내해 주는 Toast 팝업 알림바를 연동했습니다.

## 1. 이슈 사항 및 요구사항 명세
- 에디터를 사용하면서 실수로 지운 텍스트를 되살리거나, 실행 취소를 하기 위해 단축키 외에도 가시적인 UI(버튼)가 필요하다는 피드백이 있었습니다.
- 기존 브라우저 기본 로직(Ctrl+Z)에 의지할 경우 자바스크립트에 의한 텍스트 변동은 올바르게 추적하지 못할 가능성이 있어 자체 History 상태 관리 로직 구축이 필요해졌습니다.
- HTML 문서 복사 등의 작업을 성공적으로 수행했을 때 사용자에게 피드백이 부족하여 안내 팝업이 필요했습니다.

## 2. 해결 방안 및 구현 내용

### 2.1 에디터 이전/다음 (Undo/Redo) 상태 관리 구현
- **[수정] `js/editor/editor-manager.js`**
  - 생성자(Constructor)에 이력 추적용 `this.history` 배열 변수와 커서를 가리키는 `this.historyIndex` 변수를 선언. 최대 저장 개수를 50개(`maxHistoryLength: 50`)로 설정했습니다.
  - 일반 타이핑이나 이벤트 입력에 의해 `textarea` 콘텐츠가 변경될 때마다 디바운스(`debounce`)를 적용한 `saveHistoryState` 함수가 호출되어, 배열에 현재 문자열 및 커서 위치를 `push` 합니다.
  - `undo()`, `redo()` 메서드를 정의하여 사용자가 이전(Undo) 또는 다음(Redo) 명령을 호출 시, 배열에서 저장된 시점 위치를 꺼내어 `this.textarea.value` 에 대입하고 커서 영역을 복원시킨 다음 `updatePreview()` 를 트리거 하도록 구축했습니다.
  - 기존 단축키 `Ctrl+Z`, `Ctrl+Y` 도 해당 메서드와 연결하였습니다.

### 2.2 이전/다음 (Undo/Redo) 툴바 UI 추가
- **[수정] `index.html`**
  - 상단 메인 툴바의 파일 관리(저장) 영역 우측에 `history` 백/포워드 용도의 HTML 버튼 `<button id="undo-btn">` 및 `<button id="redo-btn">` 을 추가했습니다.
- **[수정] `js/ui/ui-manager.js`**
  - `setupToolbarButtons()` 컨트롤러 항목에 `undoBtn` 및 `redoBtn` 생성 및 이벤트 리스너를 바인딩하여, 클릭 시 `window.app.editorManager.undo()` 가 실행되도록 연결했습니다.

### 2.3 복사 알림 팝업 (Toast) 연동
- **[수정] `js/app.js`**
  - 기존 마크다운 'HTML 내보내기' 이벤트 (`exportHTML()`) 수정
  - HTML을 다운로드만 하는 기능에서 추가로 클립보드에 HTML 내용을 자동 복사(`copyToClipboard`)하고 수행 완료 후 `this.uiManager.showToast('success', 'HTML 코드가 클립보드에 복사되었습니다.')` 팝업을 띄우는 편의성을 추가했습니다.
  - (참고로 단일/전체 마크다운 복사는 사전에 이미 코드에 Toast 메시지가 선언되어 있었습니다.)

## 3. 남아 있는 문제나 추후 과제
- 없음 (현재 50개의 스냅샷 이력을 무리 없이 저장하고 복구할 수 있음)
