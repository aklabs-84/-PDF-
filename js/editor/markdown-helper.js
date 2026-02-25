/**
 * MarkdownHelper - 마크다운 편집 도구 클래스
 * 텍스트 서식, 삽입 기능 제공
 */
class MarkdownHelper {
  constructor(textarea) {
    this.textarea = textarea;
  }

  /**
   * 선택된 텍스트 가져오기
   * @returns {Object} 선택 정보
   */
  getSelection() {
    return {
      start: this.textarea.selectionStart,
      end: this.textarea.selectionEnd,
      text: this.textarea.value.substring(
        this.textarea.selectionStart,
        this.textarea.selectionEnd
      )
    };
  }

  /**
   * 텍스트 삽입/교체
   * @param {string} replacement - 삽입할 텍스트
   * @param {number} cursorOffset - 커서 오프셋 (선택적)
   */
  replaceSelection(replacement, cursorOffset = 0) {
    const selection = this.getSelection();
    const before = this.textarea.value.substring(0, selection.start);
    const after = this.textarea.value.substring(selection.end);

    this.textarea.value = before + replacement + after;

    // 커서 위치 설정
    const newCursorPos = selection.start + replacement.length + cursorOffset;
    this.textarea.setSelectionRange(newCursorPos, newCursorPos);
    this.textarea.focus();

    // 변경 이벤트 발생
    this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * 텍스트 래핑 (앞뒤로 문자열 추가)
   * @param {string} before - 앞 문자열
   * @param {string} after - 뒤 문자열
   * @param {string} placeholder - 선택 없을 때 기본 텍스트
   */
  wrapSelection(before, after, placeholder = '') {
    const selection = this.getSelection();
    const text = selection.text || placeholder;
    const replacement = before + text + after;

    this.replaceSelection(replacement, text ? 0 : -after.length);
  }

  /**
   * 굵게
   */
  bold() {
    this.wrapSelection('**', '**', '굵은 텍스트');
  }

  /**
   * 기울임
   */
  italic() {
    this.wrapSelection('_', '_', '기울임 텍스트');
  }

  /**
   * 취소선
   */
  strikethrough() {
    this.wrapSelection('~~', '~~', '취소선 텍스트');
  }

  /**
   * 인라인 코드
   */
  inlineCode() {
    this.wrapSelection('`', '`', 'code');
  }

  /**
   * 제목 삽입
   * @param {number} level - 제목 레벨 (1-6)
   */
  heading(level = 1) {
    const selection = this.getSelection();
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
    const text = selection.text || `제목 ${level}`;

    // 줄의 시작 위치 찾기
    const lines = this.textarea.value.substring(0, selection.start).split('\n');
    const lineStart = selection.start - lines[lines.length - 1].length;

    // 현재 줄의 내용
    const lineEnd = this.textarea.value.indexOf('\n', selection.start);
    const currentLineEnd = lineEnd === -1 ? this.textarea.value.length : lineEnd;
    const currentLine = this.textarea.value.substring(lineStart, currentLineEnd);

    // 이미 제목인 경우 제거
    const headingMatch = currentLine.match(/^#+\s/);
    if (headingMatch) {
      const newLine = currentLine.substring(headingMatch[0].length);
      const before = this.textarea.value.substring(0, lineStart);
      const after = this.textarea.value.substring(currentLineEnd);
      this.textarea.value = before + newLine + after;
      this.textarea.setSelectionRange(lineStart, lineStart + newLine.length);
    }

    // 새 제목 추가
    const replacement = `${hashes} ${text}`;
    const before = this.textarea.value.substring(0, lineStart);
    const after = this.textarea.value.substring(currentLineEnd);

    this.textarea.value = before + replacement + after;
    this.textarea.setSelectionRange(
      lineStart + hashes.length + 1,
      lineStart + replacement.length
    );
    this.textarea.focus();
    this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * 링크 삽입
   * @param {string} url - URL (선택적)
   * @param {string} title - 링크 텍스트 (선택적)
   */
  link(url = null, title = null) {
    const selection = this.getSelection();
    const linkText = title || selection.text || '링크 텍스트';
    const linkUrl = url || 'https://example.com';

    const replacement = `[${linkText}](${linkUrl})`;
    this.replaceSelection(replacement, 0);
  }

  /**
   * 수식 (KaTeX) 삽입
   */
  math() {
    const selection = this.getSelection();
    let replacement = '';
    
    // 블록 수식 (선택된 텍스트가 여러 줄이거나 비어있을 때)
    if (!selection.text || selection.text.includes('\n')) {
      const text = selection.text || 'f(x) = ...';
      replacement = `\n$$ \n${text} \n$$ \n`;
      this.replaceSelection(replacement, 0);
    } else {
      // 인라인 수식
      replacement = `$${selection.text}$`;
      this.replaceSelection(replacement, 0);
    }
  }

  /**
   * 다이어그램 (Mermaid) 삽입
   */
  mermaid() {
    const selection = this.getSelection();
    const defaultGraph = "graph TD\n    A --> B";
    const replacement = `\n\`\`\`mermaid\n${selection.text || defaultGraph}\n\`\`\`\n`;
    this.replaceSelection(replacement, 0);
  }

  /**
   * 이미지 삽입
   * @param {string} url - 이미지 URL (선택적)
   * @param {string} alt - 대체 텍스트 (선택적)
   */
  image(url = null, alt = null) {
    const imageUrl = url || 'https://example.com/image.jpg';
    const altText = alt || '이미지 설명';

    const replacement = `![${altText}](${imageUrl})`;
    this.replaceSelection(replacement, 0);
  }

  /**
   * 순서 없는 목록
   */
  unorderedList() {
    this.insertList('-');
  }

  /**
   * 순서 있는 목록
   */
  orderedList() {
    this.insertList('1.');
  }

  /**
   * 목록 삽입
   * @param {string} prefix - 목록 접두사
   */
  insertList(prefix) {
    const selection = this.getSelection();
    const text = selection.text || '목록 항목';

    const lines = text.split('\n');
    const formatted = lines.map((line, index) => {
      if (line.trim() === '') return line;

      // 순서 있는 목록인 경우 번호 증가
      const actualPrefix = prefix.match(/^\d+\./)
        ? `${index + 1}.`
        : prefix;

      return `${actualPrefix} ${line}`;
    }).join('\n');

    this.replaceSelection(formatted, 0);
  }

  /**
   * 체크박스 목록
   */
  checkList() {
    const selection = this.getSelection();
    const text = selection.text || '할 일';

    const lines = text.split('\n');
    const formatted = lines.map(line => {
      if (line.trim() === '') return line;
      return `- [ ] ${line}`;
    }).join('\n');

    this.replaceSelection(formatted, 0);
  }

  /**
   * 인용구
   */
  quote() {
    const selection = this.getSelection();
    const text = selection.text || '인용 텍스트';

    const lines = text.split('\n');
    const formatted = lines.map(line => `> ${line}`).join('\n');

    this.replaceSelection(formatted, 0);
  }

  /**
   * 코드 블록
   * @param {string} language - 언어 (선택적)
   */
  codeBlock(language = '') {
    const selection = this.getSelection();
    const text = selection.text || '코드를 입력하세요';

    const replacement = `\`\`\`${language}\n${text}\n\`\`\``;
    this.replaceSelection(replacement, text ? 0 : -4);
  }

  /**
   * 수평선
   */
  horizontalRule() {
    const selection = this.getSelection();
    const before = this.textarea.value.substring(0, selection.start);
    const after = this.textarea.value.substring(selection.end);

    // 줄바꿈 추가 여부 확인
    const needsNewlineBefore = before.length > 0 && !before.endsWith('\n');
    const needsNewlineAfter = after.length > 0 && !after.startsWith('\n');

    const replacement =
      (needsNewlineBefore ? '\n' : '') +
      '---' +
      (needsNewlineAfter ? '\n' : '');

    this.replaceSelection(replacement, 0);
  }

  /**
   * 테이블 삽입
   * @param {number} rows - 행 개수
   * @param {number} cols - 열 개수
   */
  table(rows = 3, cols = 3) {
    const headers = Array(cols).fill('헤더').map((h, i) => `${h}${i + 1}`);
    const separator = Array(cols).fill('---');

    let table = '| ' + headers.join(' | ') + ' |\n';
    table += '| ' + separator.join(' | ') + ' |\n';

    for (let i = 0; i < rows; i++) {
      const cells = Array(cols).fill('셀').map((c, j) => `${c}${i + 1}-${j + 1}`);
      table += '| ' + cells.join(' | ') + ' |\n';
    }

    this.replaceSelection(table, 0);
  }

  /**
   * 현재 줄 가져오기
   * @returns {Object} 줄 정보
   */
  getCurrentLine() {
    const pos = this.textarea.selectionStart;
    const text = this.textarea.value;

    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    const lineEnd = text.indexOf('\n', pos);
    const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;

    return {
      start: lineStart,
      end: actualLineEnd,
      text: text.substring(lineStart, actualLineEnd)
    };
  }

  /**
   * 들여쓰기
   */
  indent() {
    const selection = this.getSelection();
    const text = selection.text;

    if (text.includes('\n')) {
      // 여러 줄 선택
      const lines = text.split('\n');
      const indented = lines.map(line => '  ' + line).join('\n');
      this.replaceSelection(indented, 0);
    } else {
      // 단일 줄
      const line = this.getCurrentLine();
      const before = this.textarea.value.substring(0, line.start);
      const after = this.textarea.value.substring(line.end);
      this.textarea.value = before + '  ' + line.text + after;
      this.textarea.setSelectionRange(
        selection.start + 2,
        selection.end + 2
      );
      this.textarea.focus();
      this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /**
   * 내어쓰기
   */
  outdent() {
    const selection = this.getSelection();
    const text = selection.text;

    if (text.includes('\n')) {
      // 여러 줄 선택
      const lines = text.split('\n');
      const outdented = lines.map(line => {
        if (line.startsWith('  ')) return line.substring(2);
        if (line.startsWith('\t')) return line.substring(1);
        return line;
      }).join('\n');
      this.replaceSelection(outdented, 0);
    } else {
      // 단일 줄
      const line = this.getCurrentLine();
      let newText = line.text;

      if (newText.startsWith('  ')) {
        newText = newText.substring(2);
      } else if (newText.startsWith('\t')) {
        newText = newText.substring(1);
      } else {
        return; // 들여쓰기 없음
      }

      const before = this.textarea.value.substring(0, line.start);
      const after = this.textarea.value.substring(line.end);
      this.textarea.value = before + newText + after;

      const offset = line.text.length - newText.length;
      this.textarea.setSelectionRange(
        Math.max(line.start, selection.start - offset),
        Math.max(line.start, selection.end - offset)
      );
      this.textarea.focus();
      this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /**
   * 템플릿 삽입
   * @param {string} templateName - 템플릿 이름
   */
  insertTemplate(templateName) {
    const templates = {
      'readme': `# 프로젝트 제목

## 설명
프로젝트에 대한 간단한 설명

## 설치
\`\`\`bash
npm install
\`\`\`

## 사용법
\`\`\`bash
npm start
\`\`\`

## 라이선스
MIT`,

      'meeting': `# 회의록

**날짜**: ${new Date().toLocaleDateString('ko-KR')}
**참석자**:
**장소**:

## 안건
1.

## 논의 내용
-

## 결정 사항
-

## 다음 회의
**날짜**:
**안건**: `,

      'report': `# 보고서 제목

**작성자**:
**작성일**: ${new Date().toLocaleDateString('ko-KR')}

## 요약

## 서론

## 본론

## 결론

## 참고 문헌`
    };

    const template = templates[templateName];
    if (template) {
      this.replaceSelection(template, 0);
    }
  }

  /**
   * 단어 수 계산
   * @param {string} text - 텍스트
   * @returns {number} 단어 수
   */
  static countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * 문자 수 계산 (공백 제외)
   * @param {string} text - 텍스트
   * @returns {number} 문자 수
   */
  static countCharacters(text) {
    return text.replace(/\s/g, '').length;
  }

  /**
   * 줄 수 계산
   * @param {string} text - 텍스트
   * @returns {number} 줄 수
   */
  static countLines(text) {
    return text.split('\n').length;
  }

  /**
   * 제목 추출 (첫 번째 H1 또는 첫 줄)
   * @param {string} markdown - 마크다운 텍스트
   * @returns {string} 제목
   */
  static extractTitle(markdown) {
    const lines = markdown.trim().split('\n');

    // H1 태그 찾기
    for (const line of lines) {
      if (line.startsWith('# ')) {
        return line.substring(2).trim();
      }
    }

    // 첫 번째 비어있지 않은 줄
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        return trimmed.substring(0, 50);
      }
    }

    return '제목 없음';
  }
}
