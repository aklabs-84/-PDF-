# 한글 PDF 변환기 - 설치 및 실행 가이드

## 빠른 시작

### 1. 한글 폰트 설치 (필수)

PDF 생성에 한글 폰트가 필요합니다.

```bash
# 방법 1: 네이버 한글한글아름답게에서 다운로드
# https://hangeul.naver.com/font 방문하여 나눔글꼴 다운로드

# 방법 2: GitHub에서 클론
git clone https://github.com/naver/nanumfont.git
cp nanumfont/NanumGothic.ttf fonts/
cp nanumfont/NanumMyeongjo.ttf fonts/
cp nanumfont/NanumPen.ttf fonts/
```

필요한 폰트 파일:
- `fonts/NanumGothic.ttf`
- `fonts/NanumMyeongjo.ttf`
- `fonts/NanumPen.ttf`

자세한 내용은 [fonts/README.md](fonts/README.md)를 참조하세요.

### 2. 로컬 웹 서버 실행

**중요**: 파일 시스템에서 직접 index.html을 열면 CORS 에러가 발생합니다.
반드시 웹 서버를 통해 실행하세요.

#### Python 사용
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Node.js 사용
```bash
# http-server 설치 (처음 한 번만)
npm install -g http-server

# 서버 실행
http-server -p 8000
```

#### PHP 사용
```bash
php -S localhost:8000
```

#### VS Code Live Server 확장 사용
1. VS Code에서 "Live Server" 확장 설치
2. index.html 우클릭 → "Open with Live Server"

### 3. 브라우저에서 접속

```
http://localhost:8000
```

## 프로젝트 구조

```
korean-pdf-converter/
├── index.html              # 메인 HTML
├── css/
│   ├── main.css           # 메인 스타일
│   └── themes.css         # 테마 스타일
├── js/
│   ├── app.js             # 메인 애플리케이션
│   ├── editor/
│   │   ├── editor-manager.js      # 에디터 관리
│   │   └── markdown-helper.js     # 마크다운 도구
│   ├── pdf/
│   │   ├── pdf-generator.js       # PDF 생성
│   │   ├── template-engine.js     # 템플릿 관리
│   │   └── font-loader.js         # 폰트 로더
│   ├── storage/
│   │   └── storage-manager.js     # 로컬 스토리지
│   ├── file/
│   │   └── file-handler.js        # 파일 처리
│   └── ui/
│       ├── ui-manager.js          # UI 관리
│       └── modal-manager.js       # 모달 관리
├── fonts/                  # 한글 폰트 (설치 필요)
├── templates/
│   └── templates.json     # PDF 템플릿 설정
└── assets/                # 이미지 및 아이콘
```

## 기능 테스트

### 1. 마크다운 에디터
- 왼쪽 에디터에 텍스트 입력
- 오른쪽에서 실시간 미리보기 확인
- 툴바 버튼으로 서식 적용

### 2. 파일 업로드
- "파일 열기" 버튼 클릭 또는
- 파일을 브라우저 창에 드래그 앤 드롭
- 지원 형식: .txt, .md, .markdown

### 3. PDF 변환
- "템플릿 선택" 버튼으로 스타일 선택
- "PDF 변환" 버튼 클릭
- PDF 파일 자동 다운로드

### 4. 자동 저장
- 30초마다 자동으로 로컬 스토리지에 저장
- "내 문서" 버튼으로 저장된 문서 확인
- 최대 20개 문서 보관

## 단축키

| 단축키 | 기능 |
|--------|------|
| `Ctrl/Cmd + S` | 문서 저장 |
| `Ctrl/Cmd + B` | 굵게 |
| `Ctrl/Cmd + I` | 기울임 |
| `Ctrl/Cmd + K` | 링크 삽입 |
| `Ctrl/Cmd + P` | PDF 변환 |
| `Tab` | 들여쓰기 |
| `Shift + Tab` | 내어쓰기 |
| `F11` | 전체화면 |

## 브라우저 호환성

### 지원 브라우저
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### 필요한 브라우저 기능
- ES6+ JavaScript
- LocalStorage API
- File API
- Drag and Drop API
- Canvas API (PDF 생성용)

## 문제 해결

### 1. 폰트가 로드되지 않는 경우

**증상**: PDF에 한글이 깨져서 나옴

**해결**:
```bash
# 폰트 파일 확인
ls -la fonts/

# 다음 파일들이 있어야 함:
# NanumGothic.ttf
# NanumMyeongjo.ttf
# NanumPen.ttf

# 권한 확인 및 수정
chmod 644 fonts/*.ttf
```

### 2. CORS 에러

**증상**: 브라우저 콘솔에 CORS 에러 표시

**해결**: 파일 시스템이 아닌 웹 서버로 실행
```bash
python -m http.server 8000
```

### 3. 라이브러리 로드 실패

**증상**: "marked is not defined" 등의 에러

**해결**: 인터넷 연결 확인 (CDN 사용)
- 오프라인 환경에서는 라이브러리 로컬 설치 필요

### 4. 로컬 스토리지 용량 초과

**증상**: "저장 공간이 부족합니다" 메시지

**해결**:
1. "내 문서"에서 오래된 문서 삭제
2. 브라우저 데이터 정리
3. 최대 20개 문서만 보관됨 (자동 정리)

### 5. PDF 생성 실패

**증상**: PDF 변환 시 에러 발생

**가능한 원인**:
- 한글 폰트 미설치
- 메모리 부족 (매우 긴 문서)
- 브라우저 호환성 문제

**해결**:
1. 폰트 파일 재확인
2. 문서를 여러 개로 분할
3. 최신 브라우저 사용

## 개발 환경 설정

### 코드 수정 후 테스트

```bash
# 1. 웹 서버 실행
python -m http.server 8000

# 2. 브라우저 캐시 비우기
# Chrome: Ctrl+Shift+R (강력 새로고침)
# Firefox: Ctrl+Shift+R
# Safari: Cmd+Option+R

# 3. 브라우저 개발자 도구 확인
# F12 또는 우클릭 > 검사
```

### 디버깅

브라우저 콘솔에서 다음 객체에 접근 가능:
```javascript
// 메인 앱
window.app

// 에디터 매니저
window.app.editorManager

// 템플릿 엔진
window.app.templateEngine

// PDF 생성기
window.app.pdfGenerator

// 통계 확인
window.app.getStatistics()
```

## 배포

### GitHub Pages

```bash
# 1. GitHub 저장소 생성
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/repo.git
git push -u origin main

# 2. GitHub Pages 활성화
# Settings > Pages > Source: main branch
```

### Vercel

```bash
# 1. Vercel 설치
npm install -g vercel

# 2. 배포
vercel
```

### Netlify

```bash
# 1. Netlify CLI 설치
npm install -g netlify-cli

# 2. 배포
netlify deploy
```

## 추가 설정

### 커스텀 폰트 추가

1. `fonts/` 디렉토리에 TTF 파일 추가
2. `js/pdf/font-loader.js` 수정:
```javascript
this.fontPaths = {
  'NanumGothic': 'fonts/NanumGothic.ttf',
  'NanumMyeongjo': 'fonts/NanumMyeongjo.ttf',
  'NanumPen': 'fonts/NanumPen.ttf',
  'CustomFont': 'fonts/CustomFont.ttf'  // 추가
};
```

3. `templates/templates.json`에 새 템플릿 추가

### 템플릿 커스터마이징

`templates/templates.json` 파일을 수정하여 새로운 템플릿을 추가하거나 기존 템플릿을 수정할 수 있습니다.

## 성능 최적화

### 1. 폰트 미리로드

```javascript
// app.js에서 초기화 시
await app.pdfGenerator.fontLoader.preloadAllFonts();
```

### 2. 대용량 문서 처리

- 100페이지 이상: 문서 분할 권장
- 1000줄 이상: 미리보기 지연 로딩

### 3. 캐싱

- 브라우저 캐시 활용
- Service Worker 구현 (선택사항)

## 라이선스

MIT License

## 기여

풀 리퀘스트는 언제나 환영합니다!

## 문의

이슈가 있거나 제안사항이 있으시면 GitHub Issues를 이용해주세요.

---

**Made with ❤️ by Korean PDF Converter Team**
