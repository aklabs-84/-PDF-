# 빠른 시작 가이드 (필수!)

## ⚠️ 중요: 반드시 웹 서버로 실행하세요!

**파일 시스템에서 직접 `index.html`을 열면 안 됩니다!**
다음과 같은 에러가 발생합니다:
- ❌ CORS 에러
- ❌ LocalStorage 접근 거부
- ❌ 폰트 로딩 실패

## ✅ 올바른 실행 방법

### 1단계: 한글 폰트 설치 (필수)

```bash
# fonts 디렉토리에 다음 파일들을 추가하세요:
cd fonts/

# 방법 1: 네이버에서 다운로드
# https://hangeul.naver.com/font 방문
# 나눔고딕, 나눔명조, 나눔펜 다운로드 후 복사

# 방법 2: GitHub에서 클론
git clone https://github.com/naver/nanumfont.git
cp nanumfont/NanumGothic.ttf ./
cp nanumfont/NanumMyeongjo.ttf ./
cp nanumfont/NanumPen.ttf ./
```

필수 파일:
- ✅ `fonts/NanumGothic.ttf`
- ✅ `fonts/NanumMyeongjo.ttf`
- ✅ `fonts/NanumPen.ttf`

### 2단계: 웹 서버 실행

프로젝트 루트 디렉토리에서:

**Python 사용 (추천)**
```bash
# Python 3
python3 -m http.server 8000

# 또는 Python 2
python -m SimpleHTTPServer 8000
```

**Node.js 사용**
```bash
# http-server 설치 (처음 한 번만)
npm install -g http-server

# 실행
http-server -p 8000
```

**PHP 사용**
```bash
php -S localhost:8000
```

**VS Code 사용**
1. "Live Server" 확장 설치
2. `index.html` 우클릭 → "Open with Live Server"

### 3단계: 브라우저에서 열기

```
http://localhost:8000
```

## 🎉 테스트

1. **에디터에 텍스트 입력**
   ```markdown
   # 안녕하세요

   이것은 테스트입니다.
   ```

2. **템플릿 선택** (선택사항)
   - 툴바에서 "템플릿 선택" 버튼 클릭
   - Clean, Business, Academic, Creative 중 선택

3. **PDF 변환**
   - "PDF 변환" 버튼 클릭
   - PDF 파일이 자동으로 다운로드됩니다!

## 🐛 문제 해결

### "Access to storage is not allowed" 에러
**원인**: 파일 시스템에서 직접 열었습니다.
**해결**: 위의 웹 서버 실행 방법을 따르세요.

### "jsPDF is not defined" 에러
**원인**: 인터넷 연결이 없거나 CDN 로딩 실패
**해결**:
1. 인터넷 연결 확인
2. 브라우저 캐시 삭제 후 새로고침 (Ctrl+Shift+R)

### PDF에 한글이 깨짐
**원인**: 폰트 파일이 없습니다.
**해결**: 1단계의 폰트 설치를 완료하세요.

### CORS 에러
**원인**: 파일 시스템에서 직접 열었습니다.
**해결**: 웹 서버를 통해 실행하세요.

## 📖 추가 문서

- 상세 설명: [README.md](README.md)
- 설치 가이드: [SETUP.md](SETUP.md)
- 폰트 가이드: [fonts/README.md](fonts/README.md)
- 프로젝트 현황: [PROJECT_STATUS.md](PROJECT_STATUS.md)

## 🚀 단축키

| 단축키 | 기능 |
|--------|------|
| `Ctrl/Cmd + S` | 저장 |
| `Ctrl/Cmd + B` | 굵게 |
| `Ctrl/Cmd + I` | 기울임 |
| `Ctrl/Cmd + P` | PDF 변환 |

---

**도움이 필요하신가요?**
- [GitHub Issues](https://github.com/yourusername/korean-pdf-converter/issues)
- 이메일: support@example.com
