# TouhouDive

동방 Project 공식 원곡과 2차창작 어레인지를 원곡 계보로 연결해 탐색하고, 확인된 영상은 앱 안에서 재생하는 음악 탐색 앱입니다.

## v0.3.0 — Full Catalog / Player Lifecycle

### 전체 곡 풀
- 로컬 seed는 빠른 첫 화면과 검증용 fallback으로 유지
- 실제 검색은 TouhouDB 전체 `/api/songs` 카탈로그와 연결
- 50곡 단위 페이지네이션으로 계속 불러오기
- 검색어, 원곡/2차창작 모드, PV 존재 여부, 정렬을 원격 검색에 반영
- 곡을 한꺼번에 거대한 JSON으로 내려받지 않아 모바일에서도 초기 로딩을 가볍게 유지
- 원곡 계보 ID가 아직 로드되지 않았으면 상세 화면에서 해당 원곡을 즉시 hydrate
- TouhouDB 연결 실패 시 기존 로컬 데이터로 계속 동작

TouhouDB는 VocaDB와 같은 오픈 API 계열을 사용하므로 곡, 아티스트, PV, 태그, 앨범 메타데이터를 페이지 단위로 가져옵니다.

### 인앱 플레이어
- YouTube IFrame API
- NicoNico JS API
- 재생/일시정지
- 이전/다음 큐
- 영상 종료 감지 후 자동 다음곡 ON/OFF
- 메뉴 이동 시 자동 미니플레이어
- 미니 → 전체 플레이어 복귀
- 재생 중 iframe/player 인스턴스를 유지해서 메뉴 이동 시 음원이 끊기지 않음
- MediaSession 메타데이터와 잠금화면 play/pause/next/prev
- 원본 영상 바로가기

### 데이터 계층
```
Local verified seed
        +
TouhouDB live catalog
        ↓
normalize / deduplicate
        ↓
original ↔ arrangement lineage
        ↓
search / dive / player queue
```

한 어레인지가 여러 원곡을 가리킬 수 있도록 내부 모델은 계속 `originalIds[]`를 사용합니다.

## 다음 단계
1. TouhouDB 라이브 결과 로컬 캐시/IndexedDB 적용
2. THBWiki/東方編曲録 보강 파이프라인
3. 서클·앨범·보컬 전용 페이지
4. 원곡별 어레인지 전체 페이지와 대규모 관계 그래프
5. Worker 서버측 캐시 및 중복 정규화
6. 영상 재생 가능 여부 주기적 검증
