# 한글 폰트 설치 가이드

PDF 변환에 한글 폰트가 필요합니다. 이 디렉토리에 다음 폰트 파일을 추가해주세요.

## 필요한 폰트 파일

이 디렉토리에 다음 파일들을 배치해야 합니다:

1. **NanumGothic.ttf** - 나눔고딕
2. **NanumMyeongjo.ttf** - 나눔명조
3. **NanumPen.ttf** - 나눔펜

## 폰트 다운로드 방법

### 방법 1: 네이버 한글한글아름답게 (공식)

1. https://hangeul.naver.com/font 방문
2. 나눔글꼴 다운로드
3. 압축 해제 후 TTF 파일을 이 디렉토리에 복사

### 방법 2: GitHub

```bash
# 나눔폰트 GitHub 저장소
git clone https://github.com/naver/nanumfont.git
cd nanumfont

# TTF 파일을 프로젝트의 fonts 디렉토리로 복사
cp NanumGothic.ttf /path/to/korean-pdf-converter/fonts/
cp NanumMyeongjo.ttf /path/to/korean-pdf-converter/fonts/
cp NanumPen.ttf /path/to/korean-pdf-converter/fonts/
```

### 방법 3: 직접 다운로드 (Ubuntu/Debian)

```bash
# 시스템에 설치된 나눔폰트 사용
sudo apt-get install fonts-nanum fonts-nanum-coding

# 폰트 파일 복사
cp /usr/share/fonts/truetype/nanum/NanumGothic.ttf ./fonts/
cp /usr/share/fonts/truetype/nanum/NanumMyeongjo.ttf ./fonts/
cp /usr/share/fonts/truetype/nanum/NanumPen.ttf ./fonts/
```

## 파일 구조 확인

폰트가 올바르게 설치되었는지 확인:

```bash
ls -la fonts/
# 다음 파일들이 있어야 합니다:
# NanumGothic.ttf
# NanumMyeongjo.ttf
# NanumPen.ttf
```

## 라이선스

나눔글꼴은 SIL Open Font License로 배포됩니다.
- 자유롭게 사용, 수정, 재배포 가능
- 상업적 사용 가능
- 폰트 자체를 판매하는 것만 금지

자세한 라이선스 정보: https://scripts.sil.org/OFL

## 문제 해결

### 폰트가 로드되지 않는 경우

1. 파일명이 정확한지 확인 (대소문자 구분)
2. 파일 권한 확인: `chmod 644 fonts/*.ttf`
3. 브라우저 콘솔에서 에러 메시지 확인
4. 웹 서버가 TTF 파일을 제공하는지 확인

### CORS 에러가 발생하는 경우

로컬에서 파일 시스템으로 열 경우 CORS 에러가 발생할 수 있습니다.
반드시 웹 서버를 통해 실행하세요:

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000
```

## 대체 폰트 사용

다른 한글 폰트를 사용하려면:

1. fonts 디렉토리에 TTF 파일 추가
2. `js/pdf/font-loader.js`에서 fontPaths 수정
3. `templates/templates.json`에서 font 속성 수정

## 참고

- 폰트 파일은 용량이 크므로 Git에 커밋하지 않는 것을 권장합니다
- `.gitignore`에 `fonts/*.ttf`가 추가되어 있습니다
- 프로덕션 배포 시 CDN 사용을 고려하세요
