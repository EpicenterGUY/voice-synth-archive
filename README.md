# VocaDive

니코니코 기반 **음성합성 원곡 콘텐츠 피드 · 발굴 · 추천 · 통합검색 · 보카로 우주 · 데이터 탐색** 앱입니다.

## 현재 목표

- VOCALOID / UTAU / Synthesizer V / CeVIO / VoiSona / NEUTRINO / VOICEVOX 계열 오리지널곡 통계
- 조회수 빙산, 곡 순위, 백분위
- 숨은 명곡 발굴
- 초보 / 중수 / 고수 추천 코스
- 취향 기반 추천
- 보카로/음성합성 우주
- 잊어버린 곡을 단서로 찾는 **기억 복원 탐정**
- 한국어 자연어 → 일본어/한자 검색 단서 확장
- 이미지 / 허밍 / 녹음 파일 보조 단서

## 실행

현재 앱은 정적 HTML로 동작합니다.

```text
index.html
worker/niconico-worker.js
```

니코니코 Snapshot Search API를 브라우저에서 직접 호출하면 CORS 문제가 생길 수 있어 Cloudflare Worker 중계를 사용합니다.

## 개발 원칙

이 프로젝트의 핵심은 단순 인기곡 통계가 아니라 **“기억 속에서 잊어버린 음성합성곡을 다시 찾는 것”**입니다.

탐정 시스템은 단서가 적어도 검색을 시작하고, 후보를 본 뒤 추가 질문과 피드백으로 점차 범위를 좁히는 방향으로 발전시킵니다.

## 현재 버전

App: v39.63.0
Worker: v10


## 네이티브 앱 토대

v39.62.0부터 기존 웹/PWA를 유지하면서 Capacitor 기반 Android/iOS 앱으로 패키징할 수 있는 토대를 포함합니다.

```bash
npm install
npm run build:app
npx cap add android
npx cap sync android
npx cap open android
```

현재 단계에서는 기존 기능을 유료로 잠그지 않습니다. Free/Pro 권한 계층, 계정/클라우드 동기화 API 추상화, D1용 계정·구매·권한·동기화 스키마만 먼저 분리해 두었습니다.

자세한 구조는 `docs/app-foundation.md`를 참고하세요.


## Android Shell 0.1

v39.63.0부터 Android 네이티브 수명주기와 하드웨어 뒤로가기를 실제 앱 셸에 연결했습니다.

- 전체 플레이어 → 뒤로가기 → 미니플레이어
- 기능 화면 → 뒤로가기 → 이전 VocaDive 화면
- 홈 루트 → 뒤로가기 → 앱 최소화
- 백그라운드 진입 시 재생 큐/음량/현재곡/라우트 저장
- 복귀 시 플레이어 표면 복구
- 프로세스 재시작 시 마지막 곡을 자동재생 없이 미니플레이어로 복원

Android debug APK는 `.github/workflows/android-debug.yml`에서 자동/수동 빌드할 수 있습니다.
