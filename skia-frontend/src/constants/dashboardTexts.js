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

  // 4. 해시태그 분류 공통 (영웅보관함 7종 + 현황판 8종)
  effectTagTabs: [
    { key: 'CRIT_RES', label: '#치확&저항' },
    { key: 'DAMAGE', label: '#피해' },
    { key: 'ETC', label: '#이외' },
    { key: 'DMG_DEALT', label: '#피해량' },
    { key: 'CC_SYNERGY', label: '#CC&시너지' },
    { key: 'DEBUFF', label: '#디버프' },
    { key: 'UTIL', label: '#유틸' }
  ],

  // 5. 하단 현황판 구역
  statusBoard: {
    boardTabs: [
      { key: 'CRIT_RES', label: '#치확&저항' },
      { key: 'DAMAGE', label: '#피해' },
      { key: 'ETC', label: '#이외' },
      { key: 'DMG_DEALT', label: '#피해량' },
      { key: 'CC_SYNERGY', label: '#CC&시너지' },
      { key: 'DEBUFF', label: '#디버프' },
      { key: 'UTIL', label: '#유틸' },
      { key: 'INFO', label: '#캐릭터' }
    ],
    emptyEffect: '활성화된 효과가 없습니다.'
  },

  // 6. 우측 영웅 보관함 구역
  heroPool: {
    title: '👑 영웅 보관함',
    dragTip: '드래그하여 배치',
    searchPlaceholder: '🔍 영웅 이름 검색...',
    inTeamBadge: 'IN',
    noBuffHero: '해당하는 영웅이 없습니다.',

    gradeFilters: [
      { key: 'LEGEND+', label: '레전드+' },
      { key: 'HIGH_LOAD', label: '하이로드' },
      { key: 'LEGEND', label: '레전드' },
      { key: 'ALL', label: '전체' }
    ]
  }
};