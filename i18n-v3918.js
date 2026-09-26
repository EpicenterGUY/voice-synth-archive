/* VocaDive v39.18 — lightweight KO/JA UI localization */
(function(){
"use strict";
var KEY="vsa.ui.locale.v3918",locale="ko",applying=false;
try{locale=localStorage.getItem(KEY)==="ja"?"ja":"ko"}catch(e){}
var originals=new WeakMap(),attrOriginals=new WeakMap();

var JA=new Map(Object.entries({
"홈":"ホーム","탐색":"探す","검색":"検索","보관함":"ライブラリ","내 취향":"好み","우주":"ユニバース","MY":"MY",
"한국어":"韓国語","일본어":"日本語","라이트":"ライト","다크":"ダーク",
"추천":"おすすめ","신곡":"新着","숨은 곡":"隠れた曲","프로듀서":"プロデューサー","대표곡":"代表曲","최근곡":"最近の曲",
"곡 상세":"曲を見る","중심곡 상세":"中心曲を見る","곡 검색":"曲を検索","랜덤 워프":"ランダムワープ","핀 고정":"ピン留め","핀 해제":"ピン解除",
"전체 곡 검색":"全曲を検索","♡ 취향에 추가":"♡ 好みに追加","팔로우 해제":"フォロー解除",
"전체":"すべて","인기":"人気","팔로우":"フォロー","숨은 P":"知られざるP","내 취향 프로필":"好みの傾向",
"필터":"フィルター","검색 필터":"検索フィルター","초기화":"リセット","적용하고 검색":"適用して検索",
"전체 연도":"全期間","유명도 전체":"知名度すべて","보컬 전체":"ボーカルすべて","조회수":"再生数","제목":"タイトル",
"최근 변경":"最近更新","선택":"選択","선택 종료":"選択終了","삭제":"削除","관심없음":"興味なし","들어봄":"視聴済み",
"★ 최애":"★ お気に入り","♡ 관심":"♡ 気になる","♡ 관심곡":"♡ 気になる曲","⌕ 조사":"⌕ 後で調べる","⌕ 나중에 조사":"⌕ 後で調べる",
"곡 상태 변경":"曲の状態を変更","보관에서 삭제":"ライブラリから削除","다른 곡 ↻":"別の曲 ↻","모두 보기":"すべて見る",
"새로고침 ↻":"更新 ↻","프로듀서 찾기":"プロデューサーを探す","프로듀서 상세":"プロデューサー詳細",
"오늘의 보카로":"今日のボカロ","음성합성곡 찾기 · 추천 · 보관":"音声合成曲を探す・おすすめ・保存",
"최근 데이터에서 프로듀서 찾기":"最近のデータからPを探す",
"곡 검색과 기억 찾기를 따로":"曲名で探すか、記憶を手がかりに探すか選べます",
"지금 고른 조건으로 곡 보기":"現在の条件で曲を見る","기억 복원 탐정":"うろ覚え検索",
"보관한 곡과 반응을 바탕으로 취향을 정리해 추천해요.":"保存した曲や反応をもとに好みを整理しておすすめします。",
"오늘 들을 곡부터 신곡, 숨은 곡까지 한곳에서 둘러보세요.":"今日の1曲から新着、まだ知らない曲までまとめてチェックできます。",
"좋아하는 곡, 나중에 들을 곡, 관심 없는 곡을 한곳에서 정리해요.":"好きな曲、あとで聴く曲、興味のない曲をまとめて整理できます。",
"팔로우한 프로듀서의 새 곡을 모아봐요.":"フォロー中のプロデューサーの新曲をまとめて見られます。",
"아직 팔로우한 프로듀서가 없습니다.":"まだフォロー中のプロデューサーはいません。",
"최근 곡을 찾지 못했습니다.":"最近の曲は見つかりませんでした。",
"불러오는 중…":"読み込み中…","검색 중…":"検索中…","기능을 여는 중…":"読み込み中…",
"표시할 곡이 없습니다.":"表示できる曲がありません。","이 조건에 해당하는 곡이 없습니다.":"この条件に合う曲はありません。",
"니코니코 메타데이터에서 표시할 곡을 찾지 못했습니다.":"ニコニコの情報から曲を見つけられませんでした。",
"프로듀서 찾는 중…":"プロデューサーを確認中…",
"니코니코에 적힌 P명과 다른 표기를 함께 찾고 있어요.":"ニコニコに記載されたP名と別表記を確認しています。",
"니코니코에 적힌 P명과 별칭을 함께 확인했어요.":"ニコニコに記載されたP名と別名をまとめて確認しました。",
"대표곡이 바로 안 나오면 P명 태그로 한 번 더 찾아요. 곡을 누르면 VocaDive에서 바로 재생됩니다.":"代表曲が見つからない場合はP名タグでもう一度検索します。曲を押すとVocaDiveでそのまま再生します。",
"니코니코 정보":"ニコニコ情報","VocaDB 정보":"VocaDB情報",
"확인 곡":"確認した曲","누적 조회":"累計再生","최신 활동":"最新活動","조회수 중심":"再生数順","최근 등록순":"新着順",
"5만 조회 이하 반응률 중심":"5万再生以下・反応率順","조회수 중심 · 태그/제목/설명":"再生数順・タグ/タイトル/説明",
"프로듀서 허브":"プロデューサーハブ","프로듀서 직접 검색":"プロデューサーを直接検索",
"상세 검색 결과":"詳しい検索結果","검색 모드":"検索モード","추천":"おすすめ","취향 추천":"好みに合わせておすすめ",
"스마트 믹스":"スマートミックス","플레이리스트":"プレイリスト","내 취향":"好み",
"추천·탐정 도구":"おすすめ・曲探し","음성합성곡 탐색 도구":"音声合成曲を探す","추천과 발굴 기능은 여기에서 모아 볼 수 있습니다.":"おすすめや発掘機能をここにまとめています。",
"조회수 빙산":"再生数アイスバーグ","곡 순위":"曲ランキング","앱에서 검색":"アプリ内検索","이 검색어로 태그 빙산":"この語でタグ分析",
"음성합성 우주":"音声合成宇宙","보카로 우주":"ボカロ宇宙","우주 다시 만들기":"ユニバースを作り直す",
"현재 중심곡":"現在の中心曲","곡을 선택하면 우주가 시작됩니다.":"曲を選ぶとユニバースが始まります。",
"이 우주의 가까운 곡":"この曲に近い曲","중심곡과 연결된 이유":"中心曲との共通点","탐색에 쓰는 핵심 태그":"探索に使う主なタグ",
"한 곡을 중심으로 비슷한 원곡을 별자리처럼 펼쳐볼 수 있어요. 마음에 드는 곡을 새 중심으로 바꾸면서 계속 찾아보세요.":"1曲を中心に似たオリジナル曲を星座のように広げます。気になる曲を新しい中心にして探し続けられます。",
"검색 결과에서 ‘우주 보기’를 누르면 비슷한 곡들이 별자리처럼 연결됩니다.":"検索結果で「ユニバース」を押すと、似た曲が星座のようにつながります。",
"노래 추천 · 단계별 코스":"曲おすすめ・レベル別コース","입문 / 대표곡":"入門 / 代表曲","랜덤 추천 만들기":"おすすめを作る",
"원하는 느낌을 적거나 선택한 뒤 추천을 만들어보세요.":"気分や好みを入力・選択して、おすすめを作ってみてください。",
"내 취향 음성합성곡 추천기":"好みから音声合成曲をおすすめ","취향 랜덤 추천":"好みからランダムおすすめ",
"상관없음":"指定なし","유명곡 중심":"有名曲中心","적당히 알려짐":"ほどよく知られた曲","극심해":"超深層",
"검색할 핵심 단어를 문장에서 자동 추출합니다.":"文章から検索に使うキーワードを自動で取り出します。",
"친구 추천":"友人のおすすめ","플레이리스트 자동추천":"プレイリストの自動おすすめ",
"전체 니코동 검색":"ニコニコ全体を検索","보관":"保存","미니 플레이어":"ミニプレーヤー","니코동":"ニコニコ",
"연관 영상":"関連動画","가사":"歌詞","곡 정보":"曲情報","설명 · 메타데이터":"説明・メタデータ",
"보컬 태그 정보 없음":"ボーカルタグ情報なし","P 크레딧 확인 실패":"Pクレジットの確認に失敗しました",
"니코동·VocaDB에서 P 크레딧을 확인하지 못했습니다.":"ニコニコ・VocaDBでPクレジットを確認できませんでした。",
"페이지 잠금 상태를 복구했습니다.":"画面のロック状態を復旧しました。",
"업데이트":"アップデート","업데이트 적용 중":"アップデートを適用中","새 버전 적용":"新しいバージョンを適用",
"전체 음성합성":"音声合成すべて","음성합성 전체":"音声合成すべて","음성합성 오리지널 전체":"音声合成オリジナルすべて",
"다시 시도":"もう一度試す","진단 센터":"診断センター","화면을 열지 못했습니다.":"画面を開けませんでした。",
"페이지가 준비되지 않았습니다.":"ページの準備ができていません。","검색에 실패했습니다.":"検索に失敗しました。",
"검색어를 입력하세요.":"検索語を入力してください。","연결 대기":"接続待ち","최신 스냅샷 연결":"最新スナップショット接続",
"Worker 저장됨":"Worker 保存済み","대기 중":"待機中","데이터 상태":"データ状態",
"추천 코스를 만드는 중…":"おすすめを作成中…","추천 실패":"おすすめに失敗しました",
"취향을 입력하고 ‘취향 추천’을 눌러보세요.":"好みを入力して「おすすめ」を押してみてください。",
"공통 음악 태그 적음":"共通する音楽タグが少ない","다른 표기":"別表記",
"아직 이 프로듀서의 곡을 찾지 못했어요.":"まだこのプロデューサーの曲を見つけられていません。",
"곡 정리":"曲を整理","나중에 보기":"あとで見る","이 조건에 맞는 곡이 없어요.":"この条件に合う曲はありません。",
"아직 보여줄 곡이 없어요.":"まだ表示できる曲がありません。","아직 팔로우한 프로듀서가 없어요.":"まだフォロー中のプロデューサーはいません。",
"새 곡을 찾지 못했어요.":"新しい曲は見つかりませんでした。","P 찾기":"Pを探す",
"좋아하는 분위기나 키워드를 적고 추천을 눌러보세요.":"好きな雰囲気やキーワードを入力して、おすすめを押してみてください。",
"검색 결과의 곡마다 현재 기준 순위와 상위 비율을 보여줍니다.":"検索結果の各曲に現在基準の順位と上位割合を表示します。",
"원하는 느낌을 문장으로 적거나, 아래 조건을 골라서 섞어도 됩니다.":"好みの雰囲気を文章で入力するか、下の条件を組み合わせても使えます。",
"고른 조건 안에서 매번 다른 곡을 섞어 추천합니다. 같은 조건으로 다시 눌러도 조합이 달라집니다.":"選んだ条件の中から毎回違う組み合わせでおすすめします。同じ条件でも再実行すると内容が変わります。",
"문장과 여러 조건을 함께 써도 됩니다. 딱 맞는 곡만 고집하지 않고 비슷한 곡까지 넓게 찾아요.":"文章と複数条件を一緒に使えます。完全一致だけでなく、近い曲まで広く探します。",
"검색 결과에서 ‘우주 보기’를 누르면 비슷한 곡을 별자리처럼 이어서 보여줍니다.":"検索結果で「ユニバース」を押すと、似た曲を星座のようにつないで表示します。",
"추천을 만드는 중…":"おすすめを作成中…",
"휴대폰에서 앱 안 검색이 안 되면 Cloudflare Worker 주소를 연결해 주세요. 한 번 연결하면 통계·빙산·검색을 앱 안에서 바로 쓸 수 있습니다.":"スマホでアプリ内検索が使えない場合はCloudflare WorkerのURLを設定してください。一度設定すれば統計・アイスバーグ・検索をアプリ内で使えます。",
"오늘의 한 곡":"今日の1曲",
"오늘 첫 곡으로 골라봤어요. 마음에 들면 보관하거나 비슷한 곡을 이어서 찾아보세요.":"今日の最初の1曲に選びました。気に入ったら保存したり、似た曲を続けて探せます。",
"최근에 본 곡이에요. 이어서 듣거나 주변 곡을 더 찾아보세요.":"最近見た曲です。続きを聴いたり、似た曲を探したりできます。",
"이 기기에만 저장됨":"この端末にのみ保存",
"최근 기록":"最近の履歴","기록 지우기":"履歴を消す",
"아직 본 곡이 없어요.":"まだ見た曲はありません。","곡을 하나 열면 여기에서 바로 이어볼 수 있어요.":"曲を1つ開くと、ここからすぐ続きが見られます。",
"지금 취향에 맞춰 홈 순서를 조금 바꿨어요.":"今の好みに合わせてホームの並びを少し変えています。",
"곡을 보관하거나 반응을 남기면 홈이 조금씩 취향에 맞춰져요.":"曲を保存したり反応を残したりすると、ホームが少しずつ好みに合っていきます。",
"오늘은 뭘 들어볼까요?":"今日は何を聴きますか？","찾아보기":"探す","비슷한 곡":"似た曲","보컬 순위":"ボーカル順位",
"뭘 찾고 싶나요?":"何を探しますか？",
"곡 이름을 아는지, 기억이 흐릿한지, 그냥 새로운 곡이 듣고 싶은지부터 골라보세요.":"曲名が分かる、記憶があいまい、新しい曲を探したい。今の状況から選んでください。",
"곡명·P명으로 찾기":"曲名・P名で探す","검색어가 있다면 여기서 바로":"検索ワードがあるならここから",
"기억나는 단서로 찾기":"覚えている手がかりで探す","가사·PV·시기만 기억나도 괜찮아요":"歌詞・PV・時期だけでも探せます",
"비슷한 곡 이어 듣기":"似た曲を続けて探す","좋아하는 한 곡에서 시작":"好きな1曲からスタート",
"처음 보는 곡 찾기":"まだ知らない曲を探す","덜 알려진 곡을 넓게 발굴":"あまり知られていない曲を幅広く探します",
"조금 더 파고들기":"もう少し深掘り","추천 · P · 순위 · 빙산":"おすすめ・P・ランキング・アイスバーグ",
"최근 사용":"最近使ったもの","아까 보던 기능으로 돌아가기":"さっき使っていた機能に戻る",
"자주 쓰는 기능":"よく使う機能","자주 연 기능을 자동으로 모아요":"よく開く機能を自動でまとめます",
"연결 · 문제 해결":"接続・トラブル対応","여기서 연 기능은 최근 사용에 남아요.":"ここで開いた機能は「最近使ったもの」に残ります。",
"아직 최근 사용 기록이 없어요.":"まだ最近使った機能はありません。","몇 번 사용하면 자주 쓰는 기능이 여기에 모여요.":"何度か使うと、よく使う機能がここに並びます。",
"P 찾기":"Pを探す","최근 본 곡과 보관한 곡에서 프로듀서를 모아봐요":"最近見た曲や保存した曲からPをまとめます",
"많이 본 P":"よく見たP","P명으로 직접 찾기":"P名で直接探す",
"좋아했던 곡을 바탕으로 P를 찾고 대표곡까지 이어서 볼 수 있어요.":"好きだった曲を手がかりにPを探し、そのまま代表曲まで見られます。",
"곡명 검색과 기억을 단서로 찾는 기능을 나눠뒀어요.":"曲名で探す機能と、記憶を手がかりに探す機能を分けています。",
"빙산 · 통계":"アイスバーグ・統計","숨은 곡 발굴":"知られざる曲を探す","노래 추천":"曲のおすすめ",
"프로듀서 도감":"P図鑑","숨은 프로듀서 발굴":"知られざるPを探す","음원 순위":"音源ランキング","일반 검색":"検索",
"설정":"設定","진단 센터":"診断","내 취향 추천":"好みに合わせておすすめ",
"미니로 듣기":"ミニプレーヤー","다음 곡":"次の曲","비슷한 원곡 위주":"似ているオリジナル曲を中心に",
"곡 설명":"曲の説明","니코동·VocaDB에 등록된 설명":"ニコニコ・VocaDBに登録された説明",
"가사":"歌詞","VocaDB에 등록된 경우 표시":"VocaDBに登録されている場合に表示",
"가사를 확인하는 중…":"歌詞を確認中…","설명 정보를 확인하는 중…":"説明を確認中…","설명 정보가 없습니다.":"説明はありません。",
"조회":"再生","마이리스트":"マイリスト","댓글":"コメント","좋아요":"いいね","태그":"タグ",
"확인 중…":"確認中…","P 정보를 찾지 못했어요.":"P情報を見つけられませんでした。","P 정보 확인 실패":"P情報の確認に失敗しました","P 정보 없음":"P情報なし",
"보컬 태그 정보 없음":"ボーカルタグ情報なし","오리지널곡":"オリジナル曲","연관곡":"関連曲","연관곡을 아직 찾지 못했습니다.":"関連曲はまだ見つかっていません。",
"표시할 가사 내용이 없습니다.":"表示できる歌詞がありません。","VocaDB에 표시 가능한 가사가 등록되어 있지 않습니다.":"VocaDBに表示できる歌詞は登録されていません。",
"VocaDB 등록 가사":"VocaDB登録歌詞"

}));

var PLACEHOLDER_JA=new Map(Object.entries({
"곡명 · P명 · 보컬 · 태그 · sm번호":"曲名・P名・ボーカル・タグ・sm番号",
"곡명·P명·보컬·태그·sm번호 등 자유 검색":"曲名・P名・ボーカル・タグ・sm番号を検索",
"현재 불러온 결과 안에서 다시 검색":"現在の結果内を検索",
"보관한 곡 검색":"保存した曲を検索",
"최소":"最小","최대":"最大",
"예: 미쿠 2010년대 심해":"例：ミク 2010年代 深層"
}));

function trimTranslate(raw){
  var m=String(raw).match(/^(\s*)([\s\S]*?)(\s*)$/),lead=m?m[1]:"",body=m?m[2]:String(raw),tail=m?m[3]:"";
  if(!body)return raw;
  if(JA.has(body))return lead+JA.get(body)+tail;
  var x=body;
  var rules=[
    [/^(\d+)곡 표시$/, "$1曲表示"],
    [/^(\d+)곡 확인$/, "$1曲確認"],
    [/^(\d+)곡$/, "$1曲"],
    [/^(\d+)개$/, "$1件"],
    [/^출처: (.+)$/, "出典: $1"],
    [/^VocaDB 등록 가사 · 출처: (.+)$/, "VocaDB登録歌詞 · 出典: $1"],
    [/^(\d+)회$/, "$1回"],
    [/^최근$/, "最近"],
    [/^(\d+)곡 선택$/, "$1曲選択"],
    [/^총 (\d+)곡$/, "全$1曲"],
    [/^최애 (\d+)$/, "お気に入り $1"],
    [/^관심 (\d+)$/, "気になる $1"],
    [/^관심없음 (\d+)$/, "興味なし $1"],
    [/^조회 ([\d,]+) · (.+)$/, "再生 $1 · $2"],
    [/^조회 ([\d,]+)$/, "再生 $1"],
    [/^누적 ([\d,]+)회$/, "累計 $1回"],
    [/^(\d+)곡 · 누적 ([\d,]+)회 · (.+)$/, "$1曲 · 累計 $2回 · $3"],
    [/^최근 (\d+)일$/, "最近$1日"],
    [/^(\d+)년$/, "$1年"],
    [/^검색 · (.+)$/, "検索 · $1"],
    [/^필터 검색$/, "フィルター検索"],
    [/^추천 (\d+)곡$/, "おすすめ $1曲"],
    [/^(.+) 상세 ›$/, "$1 詳細 ›"]
  ];
  for(var i=0;i<rules.length;i++)if(rules[i][0].test(x))return lead+x.replace(rules[i][0],rules[i][1])+tail;
  return raw
}
function skipNode(node){
  var p=node.parentElement;if(!p)return true;
  if(p.closest("script,style,code,pre,textarea"))return true;
  if(p.closest(".song-title,.v399-watch-info h2,.v39-media-title,.v331-song b,.v333-follow-song b,.v28-title,.discovery-title,.gem-title,.v37-title,.u394-copy h3,.v332-lib-title,.v399-related-copy b,.node-label,.node-sub"))return true;
  return false
}
function translateTextNode(node,forceOriginal){
  if(!node||node.nodeType!==3||skipNode(node))return;
  var now=node.nodeValue;
  if(forceOriginal||!originals.has(node)){
    if(/[가-힣]/.test(now))originals.set(node,now);
  }else if(locale==="ja"&&!applying&&/[가-힣]/.test(now)){
    originals.set(node,now);
  }
  if(locale==="ja"){
    var source=originals.get(node)||now,ja=trimTranslate(source);
    if(ja!==now){applying=true;node.nodeValue=ja;applying=false}
  }else if(originals.has(node)){
    var ko=originals.get(node);
    if(node.nodeValue!==ko){applying=true;node.nodeValue=ko;applying=false}
  }
}
function attrStore(el){
  var x=attrOriginals.get(el);if(!x){x={};attrOriginals.set(el,x)}return x
}
function translateAttrs(el,forceOriginal){
  if(!el||el.nodeType!==1)return;
  ["placeholder","aria-label","title"].forEach(function(name){
    if(!el.hasAttribute(name))return;
    var cur=el.getAttribute(name),st=attrStore(el);
    if(forceOriginal||st[name]==null){
      if(/[가-힣]/.test(cur))st[name]=cur;
    }else if(locale==="ja"&&!applying&&/[가-힣]/.test(cur)){st[name]=cur}
    if(locale==="ja"&&st[name]!=null){
      var v=PLACEHOLDER_JA.get(st[name])||trimTranslate(st[name]);
      if(v!==cur){applying=true;el.setAttribute(name,v);applying=false}
    }else if(locale==="ko"&&st[name]!=null&&cur!==st[name]){
      applying=true;el.setAttribute(name,st[name]);applying=false
    }
  })
}
function walk(root,forceOriginal){
  if(!root)return;
  if(root.nodeType===3){translateTextNode(root,forceOriginal);return}
  if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
  if(root.nodeType===1)translateAttrs(root,forceOriginal);
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  var n;while((n=w.nextNode())){if(n.nodeType===3)translateTextNode(n,forceOriginal);else translateAttrs(n,forceOriginal)}
}
function ensureStyle(){
  if(document.getElementById("v3918I18nStyle"))return;
  var s=document.createElement("style");s.id="v3918I18nStyle";s.textContent=
  '.v3918-lang-switch{display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid #2b5a60;border-radius:999px;background:#08262c;box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}'+
  '.v3918-lang-switch button{min-height:29px;padding:0 9px;border:0;border-radius:999px;background:transparent;color:#8fb6b2;font-size:8px;font-weight:950;white-space:nowrap}'+
  '.v3918-lang-switch button.active{background:linear-gradient(135deg,#47bfb7,#4d77a9);color:#f5fffd;box-shadow:0 3px 12px rgba(49,181,171,.18)}'+
  '.v3918-lang-short{display:none}body[data-vsa-theme="light"] .v3918-lang-switch{background:#fff;border-color:#bfd9d4}body[data-vsa-theme="light"] .v3918-lang-switch button{color:#557773}'+
  '@media(max-width:699px){.v3918-lang-switch{padding:2px}.v3918-lang-switch button{min-height:28px;padding:0 7px;font-size:7px}.v3918-lang-full{display:none}.v3918-lang-short{display:inline}}';
  document.head.appendChild(s)
}
function updateSwitcher(){
  var sw=document.getElementById("v3918LangSwitch");if(!sw)return;
  sw.querySelectorAll("button[data-vsa-locale]").forEach(function(b){b.classList.toggle("active",b.dataset.vsaLocale===locale);b.setAttribute("aria-pressed",b.dataset.vsaLocale===locale?"true":"false")})
}
function ensureSwitcher(){
  ensureStyle();
  var status=document.querySelector(".topbar .status");if(!status||document.getElementById("v3918LangSwitch"))return;
  var sw=document.createElement("div");sw.id="v3918LangSwitch";sw.className="v3918-lang-switch";sw.setAttribute("role","group");sw.setAttribute("aria-label","언어 전환");
  sw.innerHTML='<button type="button" data-vsa-locale="ko" aria-label="한국어"><span class="v3918-lang-full">한국어</span><span class="v3918-lang-short">한</span></button><button type="button" data-vsa-locale="ja" aria-label="日本語"><span class="v3918-lang-full">日本語</span><span class="v3918-lang-short">日</span></button>';
  var theme=status.querySelector(".v3911-theme-toggle");if(theme)status.insertBefore(sw,theme);else status.appendChild(sw);
  sw.addEventListener("click",function(e){var b=e.target.closest("button[data-vsa-locale]");if(b)setLocale(b.dataset.vsaLocale)});
  updateSwitcher()
}
function updateLocaleDates(){
  document.querySelectorAll("[data-vsa-song-date]").forEach(function(el){
    var raw=el.getAttribute("data-vsa-song-date");if(!raw)return;
    var d=new Date(raw);if(!Number.isFinite(d.getTime()))return;
    el.textContent=d.toLocaleDateString(locale==="ja"?"ja-JP":"ko-KR")
  })
}
function setLocale(next){
  next=next==="ja"?"ja":"ko";locale=next;
  try{localStorage.setItem(KEY,locale)}catch(e){}
  document.documentElement.lang=locale==="ja"?"ja":"ko-KR";
  document.body.dataset.vsaLocale=locale;
  walk(document.body,false);updateLocaleDates();updateSwitcher();
  try{window.dispatchEvent(new CustomEvent("vsa:localechange",{detail:{locale:locale}}))}catch(e){}
  setTimeout(function(){
    try{if(window.VSAHome37&&typeof window.VSAHome37.render==="function")window.VSAHome37.render()}catch(e){}
    try{if(window.VSAI18n)window.VSAI18n.refresh()}catch(e){}
  },0)
}
var observer=new MutationObserver(function(ms){
  if(applying)return;
  if(locale!=="ja"){ensureSwitcher();return}
  ms.forEach(function(m){
    if(m.type==="characterData")translateTextNode(m.target,false);
    else if(m.type==="attributes")translateAttrs(m.target,false);
    else m.addedNodes.forEach(function(n){walk(n,true)})
  });
  ensureSwitcher();updateSwitcher()
});
function boot(){
  ensureSwitcher();
  document.documentElement.lang=locale==="ja"?"ja":"ko-KR";
  document.body.dataset.vsaLocale=locale;
  if(locale==="ja")walk(document.body,true);
  updateLocaleDates();
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["placeholder","aria-label","title"]});
  setTimeout(function(){ensureSwitcher();if(locale==="ja")walk(document.body,false)},500)
}
window.VSAI18n={getLocale:function(){return locale},setLocale:setLocale,t:function(ko){return locale==="ja"?trimTranslate(ko):ko},refresh:function(){walk(document.body,false)}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot()
})();