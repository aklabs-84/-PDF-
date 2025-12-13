/*
  EMBEDDED_FONTS - 클라이언트에 미리 포함시킬 Base64 폰트 맵

  목적:
  - GitHub의 파일 뷰어나 CORS 환경에서 외부 fetch가 실패할 때
    폰트를 JS로 직접 포함하여 PDF 생성 시 항상 폰트를 사용할 수 있도록 함.

  사용법:
  1) 로컬에서 TTF 파일을 Base64로 인코딩:
     macOS / Linux:
       base64 -i fonts/NanumGothic.ttf > NanumGothic.b64

     Windows (PowerShell):
       [Convert]::ToBase64String([IO.File]::ReadAllBytes('fonts\\NanumGothic.ttf')) > NanumGothic.b64

  2) NanumGothic.b64 파일의 내용을 복사하여 아래 객체의 값으로 붙여넣기

  3) index.html에서 이 파일을 `font-loader.js`보다 먼저 로드해야 합니다.

  주의:
  - 폰트 파일을 저장소에 포함하면 저장소 용량이 늘어납니다.
  - 저작권에 유의하세요. 오픈소스/상업용 라이선스를 확인하세요.
*/

window.EMBEDDED_FONTS = window.EMBEDDED_FONTS || {
  // 예시 (아래 값은 빈 문자열입니다. 실제 Base64로 바꿔주세요):
  // 'NanumGothic': 'AAEAAAALAIAAAwAwT1MvM...'
};

export default window.EMBEDDED_FONTS;
