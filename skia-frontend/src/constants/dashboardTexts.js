export const DASHBOARD_TEXTS = {
  // 1. 헤더 구역
  header: {
    nightmare: {
      title: '📊 깊은 밤의 악몽',
      tip: '모바일은 지원안합니다. (PC용) 덱 선택 후 수정가능합니다. 마우스 왼쪽버튼 현황판에서 위치확인, 오른쪽 버튼 클릭시 영웅제거 가능! 범위표시는 테스트중!<br/> AI로 데이타를 넣어서 안맞는 정보가 있습니다. 중첩은 이중으로 나옵니다. 참고용으로만 봐주세요',
      badge: '보스 분석 모드'
    },
    celestial: {
      title: '⚔️ 천상의 결투 테스트',
      tip: '모바일은 지원안합니다. (PC용) 덱 선택 후 수정가능합니다. 마우스 왼쪽버튼 현황판에서 위치확인, 오른쪽 버튼 클릭시 영웅제거 가능! 범위표시는 테스트중!<br/> AI로 데이타를 넣어서 안맞는 정보가 있습니다. 중첩은 이중으로 나옵니다. 참고용으로만 봐주세요',
      badge: '천상의 결투'
    },
    descent: {
      title: "📊 강림의 날 테스트",
      tip: "모바일은 지원안합니다. (PC용) 덱 선택 후 수정가능합니다. 마우스 왼쪽버튼 현황판에서 위치확인, 오른쪽 버튼 클릭시 영웅제거 가능! 범위표시는 테스트중!<br/> AI로 데이타를 넣어서 안맞는 정보가 있습니다. 중첩은 이중으로 나옵니다. 참고용으로만 봐주세요",
      badge: "보스 분석 모드"
    }
  },

  // 2. 컨트롤 상단 바
  controls: {
    nightmareDeckLabel: '악몽 추천 덱 5*5',
    celestialDeckLabel: '덱 불러오기',
    descentDeckLabel: "덱 불러오기",
    deckPlaceholder: '-- 공유 게시판에서 덱을 선택하세요 --',
    skillClassLabel: '스킬 분석 구분',
    skillOptions: [
      { value: '일반공격', label: '일반공격' },
      { value: '치명타공격', label: '치명타공격' },
      { value: '액티브공격', label: '액티브공격' }
    ]
  },

  // 3. 메인 워크스페이스
  arena: {
    teamCopyBtn: '덱복사',
    teamClearBtn: '비우기',
    bossBadgeNightmare: 'BOSS',
    bossBadgeCelestial: '천상'
  },

  // 4. 우측 현황판 구역
  statusBoard: {
    typeBuff: '⚔️ 아군 버프',
    typeDebuff: '💀 적군 디버프',
    buffTitle: '⚔️ 아군 버프 현황',
    debuffTitle: '💀 적군 디버프 현황',
    buffBadge: 'ACTIVE',
    debuffBadge: 'DEBUFFS',
    emptyBuff: '활성화된 버프가 없습니다.',
    emptyDebuff: '적용된 디버프가 없습니다.'
  },

  // 5. 하단 영웅 보관함 구역
  heroPool: {
    title: '👑 영웅 보관함',
    dragTip: '드래그하여 배치',
    toggleExpand: '▲ 펼치기',
    toggleCollapse: '▼ 접기',
    searchPlaceholder: '🔍 영웅 이름 검색...',
    manageBtn: '추천 영웅 관리',
    inTeamBadge: 'IN TEAM',
    noBuffHero: '해당하는 버프 영웅이 없습니다.',
    
    subFilters: [
      { key: "ALL", label: "전체" },
      { key: "BUFF", label: "버프" },
      { key: "DEBUFF", label: "디버프" },
      { key: "CCC", label: "군중제어" }, // 추가된 항목
      { key: "UTC", label: "유틸" }      // 추가된 항목
    ],

    gradeFilters: [
      { key: 'ALL', label: '전체' },
      { key: 'HIGH_LOAD', label: '하이로드' },
      { key: 'LEGEND+', label: '레전드+' },
      { key: 'LEGEND', label: '레전드' },
      { key: 'BUFF_LIST', label: '버프리스트' }
    ]
  },

  // 6. 추천 영웅 관리 모달 창
  modal: {
    title: '추천 영웅 관리 리스트',
    formTitleEdit: '추천 정보 수정',
    formTitleNew: '새 추천 영웅 등록',
    effectLabel: '효과검색',
    effectPlaceholder: '예: 치명타, 공격력 등 입력',
    heroLabel: '영웅검색',
    heroPlaceholder: '영웅 이름 입력',
    rankLabel: '순위',
    rankPlaceholder: '예: 1 (1순위)',
    btnCancel: '수정 취소',
    btnSubmitNew: '저장하기',
    btnSubmitEdit: '수정 완료',
    unregisteredHero: '미등록 영웅',
    noData: '등록된 데이터가 없습니다.',
    
    tableHeaders: ['번호', '효과 코드', '효과명', '영웅', '순위 스코어', '관리']
  }
};