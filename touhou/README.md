# TouhouDive

동방 Project 공식 원곡과 2차창작 어레인지를 **원곡 계보**로 연결해 탐색하는 VocaDive 계열 음악 앱입니다.

## v0.2.0 — Arrangement Graph / In-app Video

- 원곡과 2차창작을 하나의 검색창에서 탐색
- 전체 / 원곡 / 2차창작 3모드
- 어레인지 → 원곡, 원곡 → 어레인지 계보 표시
- 같은 원곡 / 서클 / 보컬 / 분위기 / 시대 기반 다이브
- YouTube / NicoNico / TouhouDB embed를 받을 수 있는 공통 인앱 플레이어
- 다른 메뉴로 이동하면 재생을 유지한 채 미니플레이어로 전환
- 보관함 / 최근 기록 / 랜덤 다이브 / 반응형 UI / 라이트·다크 모드
- PWA 오프라인 셸 캐시

## 현재 데이터

현재 저장소의 로컬 seed는 공식 게임 원곡 43곡과 검증용 2차창작 3곡입니다. 대규모 2차창작 카탈로그는 한 개의 거대한 JSON으로 넣지 않고, 이후 Worker/API 기반 페이지네이션 검색으로 확장합니다.

## 데이터 모델

```
original track
  └─ arrangement track
       ├─ circle
       ├─ album
       ├─ arranger
       ├─ vocalist
       ├─ lyricist
       └─ media (YouTube / NicoNico / TouhouDB)
```

한 어레인지가 여러 원곡을 사용할 수 있도록 `originalIds[]` N:N 구조를 사용합니다.

## 다음 단계

1. TouhouDB 기반 수집기
2. 원곡 자동 매칭 / 중복 제거
3. Worker API + 서버측 검색
4. 서클·앨범·보컬·이벤트 엔티티 분리
5. 영상 URL 검증 및 재생 가능 여부 캐시
6. 전 작품 / PC-98 / 공식 CD 원곡 확장
