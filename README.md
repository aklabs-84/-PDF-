# 📝 마크다운 노트 (Markdown Note - v1.1)

웹이나 문서의 복잡한 텍스트를 복사(Ctrl+C)해서 붙여넣기(Ctrl+V)만 하면 깔끔한 마크다운으로 자동 정리해주고, AI를 통해 초안까지 다듬어주는 똑똑한 스마트 에디터입니다.

---

## ✨ 핵심 기능

### 🪄 AI 마법 정리 (Magic Markdown)
지저분한 텍스트나 날것의 초안을 AI가 분석하여 완벽한 마크다운 문서로 탈바꿈시켜 줍니다.
- **지원 모델**: Google Gemini 2.5 Flash Lite (추천), OpenAI GPT-5 Mini
- **스마트 검증**: API 키 입력 시 실시간 네트워크 테스트를 통해 유효한 키인지 즉시 확인합니다.
- **안전한 로컬 저장**: API 키는 브라우저(`localStorage`)에만 안전하게 보관됩니다.

### 🚀 스마트 붙여넣기 (Smart Paste)
인터넷 기사나 MS Word 문서 등 복잡한 서식의 텍스트를 붙여넣으면, 앱이 스스로 판단하여 표준 마크다운 문법으로 깔끔하게 변환(청소)해 줍니다. 

### 🎨 다이내믹 프리뷰 (Dynamic Preview)
- **실시간 렌더링**: 에디터에 입력하는 즉시 HTML로 변환된 결과를 확인할 수 있습니다.
- **콘텐츠 맞춤형 레이아웃**: 입력한 내용 길이에 맞춰 에디터와 미리보기 창의 높이가 자동으로 조절(Auto-fit)됩니다.
- **일원화된 스크롤**: 여러 개의 스크롤바가 생기는 불편함을 제거하고 전체 페이지 단일 스크롤로 쾌적한 탐색이 가능합니다.

### ⚡ Notion 스타일 슬래시 (`/`) 명령어
빈 줄에서 `/` 키를 입력하면 나타나는 드롭다운 메뉴를 통해 제목, 표, 이미지, 수식, 다이어그램 등 모든 서식을 빠르게 삽입할 수 있습니다.

### 🧮 고급 문법 지원
- **KaTeX (수학 수식)**: 복잡한 수학 수식을 LaTeX 문법으로 완벽하게 렌더링합니다. (소스코드 보존 복사 기능 포함)
- **Mermaid (다이어그램)**: 텍스트 기반으로 순서도, 상태도, 간트 차트 등을 그려낼 수 있습니다.
- **Syntax Highlighting**: 코드 블록 내 언어별 문법 강조 기능을 지원합니다.

### 🛠️ 편집 및 내보내기 편의성
- **Undo / Redo**: 히스토리를 추적하여 `Ctrl+Z`, `Ctrl+Y`로 안전하게 편집 상태를 오갈 수 있습니다.
- **다양한 내보내기**: 마크다운 파일(.md) 다운로드, HTML로 내보내기, PDF 저장 기능을 지원합니다.
- **토스트 알림**: 복사나 저장 성공 시 직관적인 알림 메시지를 제공합니다.

---

## 💡 빠른 사용 가이드

1. **설정**: 우측 상단 ⚙️ 아이콘을 눌러 Gemini 또는 OpenAI API 키를 등록하면 AI 기능을 사용할 수 있습니다.
2. **작성**: 좌측 창에 직접 입력하거나 외부 텍스트를 붙여넣으세요.
3. **서식 삽입**: `/` 명령어나 상단 툴바 버튼을 활용하세요.
4. **AI 정리**: 에디터 상단의 `✨ AI 정리` 버튼을 눌러 초안을 깔끔한 문서로 다듬어 보세요.
5. **가이드**: 초보자라면 상단의 **'학습 가이드'** 버튼을 클릭해 1분 만에 모든 기능을 익혀보세요.

---

## 🚀 빠른 로컬 실행

1. 저장소를 클론합니다:
```bash
git clone https://github.com/aklabs-84/markdown-note.git
cd markdown-note
```

2. 정적 웹 서버를 통해 실행합니다:
```bash
# Node.js (npx) 추천
npx serve . -p 8080

# 또는 Python 3 사용 시
python3 -m http.server 8080
```

3. 웹 브라우저에서 아래 주소로 접속합니다:
`http://localhost:8080`

---

## 🛠 기술 스택
- **Core**: Vanilla HTML5, CSS3, JavaScript (ES6+), Tailwind CSS
- **Parsing**: Marked.js, Turndown.js
- **Rendering**: KaTeX, Mermaid.js, Highlight.js
- **AI Services**: Google Gemini API, OpenAI API

---

## 🔗 관련 링크
- **라이브 데모**: [https://aklabs-84.github.io/markdown-note/](https://aklabs-84.github.io/markdown-note/)
- **개발사 (Aklabs)**: [https://litt.ly/aklabs](https://litt.ly/aklabs)
