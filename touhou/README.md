# TouhouDive

동방 Project 원곡과 2차창작 어레인지를 계보로 연결해 탐색하고, 확인된 영상은 앱 안에서 재생하는 음악 탐색 앱입니다.

## v0.4.2 — Full Game Registry / UI Stability

### UI 대개편
- 홈 / 탐색 / 다이브 / 원곡 계보 / 보관함 / 기록을 실제 독립 화면처럼 분리
- 모바일 하단 고정 내비게이션 추가
- 모바일 사이드 메뉴는 보조 메뉴/테마 용도로 유지
- 거대한 랜딩 화면을 줄이고 홈 정보를 컴팩트하게 재배치
- 곡 카드를 썸네일 중심 16:9 미디어 카드로 재설계
- 모바일 2열 카드, PC 자동 반응형 카드 그리드
- 필터/정렬을 상단 sticky 도구 영역으로 정리
- 상세 패널 헤더와 액션 버튼 정리
- 미니플레이어가 모바일 하단 내비게이션을 가리지 않도록 위치 조정

### 오류 수정
- 로컬 seed와 TouhouDB 동일 곡이 이중으로 나타나던 중복 문제 개선
- TouhouDB ID와 로컬 ID를 canonical alias로 연결해 원곡 계보가 끊기던 문제 수정
- 빠르게 검색할 때 이전 원격 요청이 최신 결과를 덮어쓰던 race condition 수정
- 새로고침이 20분 메모리 캐시 때문에 실제 갱신되지 않던 문제 수정
- 원격 곡을 보관/재생한 뒤 새로 열면 보관함·기록에서 사라지던 문제 수정
- 모바일 사이드 메뉴 위를 scrim이 덮어 터치가 막힐 수 있던 z-index 오류 수정
- YouTube API 실패 시 잘못된 `youtube:id` URL을 iframe에 넣던 fallback 오류 수정
- YouTube API가 늦게 로드되어 이전 곡 플레이어가 뒤늦게 붙는 stale initialization 차단
- 전체 플레이어에서 뒤 페이지가 스크롤되는 문제 수정

### 데이터
- 로컬 검증 seed + TouhouDB 라이브 카탈로그
- 50곡 단위 페이지네이션
- 검색 / 원곡 / 2차창작 / 영상 필터
- 원곡 계보 lazy hydration
- 보관함/기록용 원격 곡 메타데이터 snapshot 저장

### 플레이어
- YouTube IFrame API
- NicoNico JS API
- 재생/일시정지, 이전/다음, 자동 다음곡
- 화면 이동 시 미니플레이어 유지
- MediaSession 잠금화면 컨트롤
- 원본 영상 바로가기


### v0.4.2 작품 레지스트리
- PC-98 TH01–05 5작품
- Windows 정수 본편 TH06–20 15작품
- 공식 소수점 외전 13작품
- 총 33게임을 로컬 작품 레지스트리로 관리
- 작품 선택은 TouhouDB `tagName` 검색과 연결
- 더 이상 현재 seed의 `work` 값만 보고 작품 목록을 생성하지 않음


## v0.5.0 — Deep Dive / Iceberg

- 2차창작 카드와 상세 화면에서 원곡으로 바로 이동
- TouhouDB Original version ID가 아직 로드되지 않았으면 상세 조회 후 원곡을 hydrate
- 다이브를 카드 목록형에서 수심형 전용 화면으로 교체
- 연결곡을 누를수록 탐사 깊이 증가
- 2차창작 다이브의 수면 쪽에 원곡 복귀 노드 표시
- 동방 음악 빙산 메뉴 추가
- 수면 / 얕은층 / 중층 / 심층 / 해구 / 심연 6단계
- 빙산은 현재 로드 데이터의 rating, favorite, 영상 유무, 관계량 기반 가시성 지표
- 빙산 곡을 누르면 해당 곡에서 바로 다이브 시작


## v0.5.1 — Iceberg Statistics

- 빙산 기준 전환: 가시성 / 인기도 / 즐겨찾기 / DB 조회(Hits) / 관계량
- 권역별 곡 수와 비율: 수면 / 얕은층 / 중층 / 심층 / 해구 / 심연
- 전체 곡, 원곡, 2차창작, 서클, 작품, 영상 보유 통계
- 선택 기준의 평균, 중앙값, 최고값 표시
- 각 빙산 층에 해당 기준값 범위 표시
- 상층은 좁고 중·심층이 넓은 실제 빙산형 분포 폭 사용
- DB 조회(Hits)는 TouhouDB/VocaDB 항목 조회 통계이며 영상 플랫폼 조회수와 구분


## v0.6.0 — UI / Loading / Ranking / Media Recovery

- 모바일 다이브를 절대좌표 노드에서 2열 수심 레인형으로 변경
- 로컬 원곡을 열거나 재생할 때 TouhouDB 제목 매칭으로 상세 메타/영상 보강
- 초기 카탈로그를 여러 페이지 자동 예열하여 다이브/랭킹 표본을 빠르게 확장
- 종합 순위: rating + 즐겨찾기 + DB 조회 + 관계량 + 재생 가능 영상 기반
- 카드 / 상세 / 다이브 / 빙산에 종합 순위 표시
- YouTube/Nico PV 후보를 여러 개 보존
- YouTube 비공개/삭제/임베드 제한 오류 감지 후 해당 영상 제외
- 같은 곡의 다른 PV 후보가 있으면 자동 대체
- 재생 불가 영상 ID는 기기에 저장해 다음부터 다시 선택하지 않음


## v0.6.1 — Full-scroll catalog / Archive-scale ranking

- 다이브 빈 상태가 모바일에서 얇은 선으로 접히던 높이 회귀 수정
- 다이브 메뉴 진입 시 직전 선택곡이 있으면 해당 곡으로 다시 다이브 시작
- 카탈로그 하단 진입 시 다음 50곡을 자동으로 이어받는 무한 페이지네이션
- 초기 예열 페이지 수 확대
- 종합순위를 현재 메모리 표본 순위가 아니라 128,040곡 아카이브 규모 환산 순위로 표시
- 상세에서는 아카이브 환산 순위와 현재 표본 순위를 함께 표시
- 128,040곡 전체를 한 번에 휴대폰 메모리에 적재하지 않고 서버 검색/페이지 단위로 탐색


## v0.7.0 — Rank percentile / Trusted media expansion

- 순위 표기를 항상 `128,040곡 중 n위` 형태로 통일
- 상위 퍼센트를 소수 둘째 자리까지 표시
- 0.01% 미만은 `상위 <0.01%`로 표시
- 재생 소스 화이트리스트: YouTube / NicoNico / SoundCloud / Piapro / Bilibili / Bandcamp
- Vimeo 제외
- 임베드 가능한 공급자는 인앱 재생, 화이트리스트 외부 링크만 있는 경우 외부 재생
- 비공개·삭제·임베드 제한 YouTube PV는 기존처럼 자동 제외 및 대체 후보 시도
- 운영자 공개 전체 CSV 저장소는 명시적 라이선스가 없어 전수 정적 복제는 보류


## v0.8.0 — Full TouhouDB Dataset

- GitHub Actions 서버 측에서 TouhouDB 전체 곡을 끝까지 페이지 수집
- 1,000곡 단위 정적 JSON 샤드 + manifest 생성
- 앱 시작 후 전체 샤드를 백그라운드로 모두 로드
- 전체 인덱스가 준비되면 라이브 50곡 페이지 캐시보다 전수 인덱스를 우선 사용
- 검색 / 빙산 / 통계 / 종합순위가 전수 인덱스를 사용
- 전수 종합순위는 빌드 단계에서 미리 계산하여 모바일에서 재정렬 비용 제거
- 홈 재생 수치는 현재 화면에 로드된 곡 수가 아니라 전체 인덱스의 신뢰 가능한 PV 후보 보유 곡 수
- 허용 미디어: YouTube / NicoNico / SoundCloud / Piapro / Bilibili / Bandcamp
- Vimeo 제외
- 화면 DOM에는 60곡씩만 표시하지만 검색/통계 데이터는 전체 메타 인덱스를 사용
- 전체 샤드는 별도 Cache Storage에 보관하여 앱 업데이트 후에도 재다운로드를 최소화
- 전체 데이터셋 갱신 시 샤드 캐시 자동 교체


## v0.8.1 — Full-index media expansion / fixed archive ranking

- TouhouDB 전체 189,002곡 정적 전곡 인덱스 사용
- PV뿐 아니라 WebLinks의 허용 도메인도 재생 후보로 수집
- 허용: YouTube / NicoNico / SoundCloud / Piapro / Bilibili / Bandcamp
- Vimeo 및 임의 도메인 제외
- 인앱 임베드 형식이 확실하지 않은 허용 링크는 외부 재생으로 유지
- 순위 표시는 항상 128,040곡 중 n위
- FULL INDEX의 189,002곡 실제 점수 백분위를 128,040곡 스케일로 변환
- 상위 퍼센트는 동일 전수 백분위 기반


## v0.9.0 — Ranking overhaul

- 종합순위 / 인기순위 / 원곡 영향력 분리
- 인기: rating + 즐겨찾기 + DB 조회 + 재생 소스 다양성
- 원곡 영향력: 파생 어레인지 수 + 파생 서클 수 + 파생 앨범 수
- 종합: 인기 + 원곡 영향력
- 메인 순위 표시는 128,040곡 스케일 유지
- 상세에서 인기순위와 원곡 영향력 순위를 별도 표시
- 원곡 상세에서 파생곡/서클/앨범 수 표시
- 허용된 외부 링크 후보를 곡 상세에 provider별 칩으로 표시
- Vimeo 및 임의 도메인 제외 유지


## v0.9.1 — Official original classification

- TouhouDB SongType=Original 전체를 공식 원곡으로 보던 오분류 수정
- 공식 원곡 = SongType Original + (ZUN 아티스트 또는 33개 공식 작품 레지스트리 매칭)
- 팬/동인 오리지널은 FAN ORIGINAL로 별도 표시
- 기타 미분류/비음악 항목은 OTHER 표시
- 공식 원곡 통계/모드는 공식 원전곡만 집계
- 허용 링크 후보와 v0.9 순위 개편 유지


## v0.9.2 — Strict official-original provenance

- 6,693곡까지 부풀었던 공식 원곡 오분류 수정
- 공식 원곡은 SongType=Original + parent 없음 필수
- ZUN 곡은 공식 원곡 후보
- U2 Akiyama / あきやまうに / NKZ / ziki_7 등 공식 참여 작곡가는 공식 작품 매칭까지 요구
- 작품 태그만으로 공식 원곡 처리하지 않음
- 팬 오리지널/독립 동인곡은 FAN ORIGINAL/secondary로 유지


## v0.9.3 — Local/full-index canonical merge fix

- 로컬 공식 원곡과 FULL INDEX 동일곡이 병합되지 않던 조기 반환 제거
- 로컬 곡이 global/popularity/influence rank와 파생곡 통계를 FULL INDEX에서 승계
- originalIds alias를 canonical ID로 집계하여 파생곡 수 누락 수정
- 네이티브페이스 검증: TouhouDB ID 74, full-index 종합 29위 / 인기 103위 / 공식 원곡 영향력 20위
- 파생 어레인지 1,190곡 · 846서클 · 1,013앨범 정보를 로컬 카드에도 반영
