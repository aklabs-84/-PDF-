# 한글 PDF 변환기 (Korean PDF Converter)

마크다운으로 작성된 한글 문서를 아름다운 PDF로 변환하는 무료 웹 애플리케이션입니다.

## 주요 기능

### 📝 마크다운 에디터
- 실시간 미리보기
- 문법 하이라이팅
- 자동 저장 (30초마다)
- 단축키 지원 (Ctrl+B, Ctrl+I, Ctrl+S 등)
- 전체화면 모드

### 📄 PDF 변환
- 한글 폰트 완벽 지원 (나눔고딕, 나눔명조, 나눔펜)
- 4가지 전문 템플릿 (Clean, Business, Academic, Creative)
- 커스터마이징 가능한 페이지 설정
- 페이지 번호, 헤더, 푸터 추가
- 고품질 PDF 출력

### 📂 파일 관리
- 드래그 앤 드롭 지원
- 다중 파일 일괄 변환
- 로컬 스토리지 자동 저장
- 문서 검색 및 관리
- 마크다운/HTML 내보내기

### 🎨 사용자 경험
- 다크/라이트 테마
- 반응형 디자인 (PC, 태블릿, 모바일)
- 직관적인 UI/UX
- 빠른 성능
- 오프라인 지원

## 빠른 시작

### 온라인 사용
웹 브라우저에서 바로 사용하세요:
```
https://your-domain.com
```

### 로컬 실행
1. 저장소 클론:
```bash
git clone https://github.com/yourusername/korean-pdf-converter.git
cd korean-pdf-converter
```

2. 웹 서버로 실행:
```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000
```

3. 브라우저에서 접속:
```
http://localhost:8000
```

## 사용 방법

### 1. 마크다운 작성
에디터에 마크다운 문법으로 문서를 작성합니다:

```markdown
# 제목 1
## 제목 2

**굵은 글씨** _기울임_ `코드`

- 목록 항목 1
- 목록 항목 2

[링크](https://example.com)
```

### 2. 실시간 미리보기
오른쪽 패널에서 실시간으로 결과를 확인합니다.

### 3. 템플릿 선택
"템플릿 선택" 버튼을 클릭하여 원하는 스타일을 선택합니다:
- **Clean**: 심플하고 깔끔한 디자인
- **Business**: 비즈니스 문서용 전문적인 스타일
- **Academic**: 학술 논문 및 보고서용
- **Creative**: 창의적이고 독특한 디자인

### 4. PDF 변환
"PDF 변환" 버튼을 클릭하여 PDF 파일을 다운로드합니다.

## 지원하는 마크다운 문법

- 제목 (H1-H6)
- 문단
- 굵게, 기울임, 취소선
- 목록 (순서 있음/없음)
- 링크
- 이미지
- 인용구
- 코드 블록
- 표 (테이블)
- 수평선
- 체크박스

## 단축키

| 단축키 | 기능 |
|--------|------|
| `Ctrl + S` | 문서 저장 |
| `Ctrl + B` | 굵게 |
| `Ctrl + I` | 기울임 |
| `Ctrl + K` | 링크 삽입 |
| `Ctrl + P` | PDF 변환 |
| `F11` | 전체화면 |

## 브라우저 지원

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Markdown**: Marked.js
- **PDF**: jsPDF, jsPDF-AutoTable
- **Storage**: LocalStorage API
- **Libraries**: Highlight.js, JSZip

## 프로젝트 구조

```
korean-pdf-converter/
├── index.html              # 메인 HTML
├── css/
│   ├── main.css           # 메인 스타일
│   └── themes.css         # 테마 스타일
├── js/
│   ├── app.js             # 애플리케이션 진입점
│   ├── editor/            # 에디터 관련
│   ├── pdf/               # PDF 생성 관련
│   ├── storage/           # 로컬 스토리지 관련
│   ├── file/              # 파일 처리 관련
│   └── ui/                # UI 관리 관련
├── fonts/                 # 한글 폰트 파일
├── templates/             # PDF 템플릿 설정
└── assets/                # 이미지 및 아이콘
```

## 개발 로드맵

### v1.0 (현재)
- ✅ 기본 마크다운 에디터
- ✅ PDF 변환 기능
- ✅ 한글 폰트 지원
- ✅ 4가지 템플릿
- ✅ 로컬 스토리지

### v1.1 (예정)
- 📋 클라우드 저장소 연동 (Google Drive, Dropbox)
- 📋 협업 기능
- 📋 버전 관리
- 📋 고급 템플릿 추가

### v1.2 (예정)
- 📋 플러그인 시스템
- 📋 커스텀 폰트 업로드
- 📋 수식 지원 (LaTeX)
- 📋 다이어그램 지원 (Mermaid)

## 기여하기

기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 문의 및 지원

- 이슈 리포트: [GitHub Issues](https://github.com/yourusername/korean-pdf-converter/issues)
- 이메일: support@example.com

## 감사의 말

이 프로젝트는 다음 오픈소스 라이브러리를 사용합니다:
- [Marked.js](https://marked.js.org/)
- [jsPDF](https://github.com/parallax/jsPDF)
- [Tailwind CSS](https://tailwindcss.com/)
- [Highlight.js](https://highlightjs.org/)
- [Nanum Fonts](https://hangeul.naver.com/font)

---

Made with ❤️ by Korean PDF Converter Team
