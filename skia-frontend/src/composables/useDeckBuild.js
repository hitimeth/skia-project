import { ref, computed, watch, nextTick, onMounted } from 'vue';
import axios from 'axios';

export function useDeckBuild({
  gridRows = 8,
  gridCols = 6,
  boardCategory = 'celestial',
  fallbackBoardCategory = 'nightmare',
  maxTeamMembers = 15,
  initialSkillClass = '액티브공격',
  prefetchCommonCodes = false,
  cardWidth = 36,
  cardHeight = 36
} = {}) {
  const isAdmin = ref(true);
  const BASE_URL = import.meta.env.VITE_API_URL;
  const isPoolCollapsed = ref(false);
  const selectedBoardDeck = ref(null);
  const boardDecks = ref([]);
    // 🎯 깊악(deep_nightmare 등) 및 천결(celestial) 카테고리인 경우 '액티브공격'으로 강제 초기화
  const isDeepOrCelestial = 
    boardCategory === 'celestial' || 
    boardCategory === 'deep_nightmare' || 
    boardCategory === 'nightmare'; // 사용 중인 깊악/천결 카테고리명 추가

  const defaultSkillClass = isDeepOrCelestial ? '액티브공격' : (initialSkillClass || '액티브공격');
  
  const selectedSkillClass = ref(defaultSkillClass);
  const arenaRefs = ref({});
  const setArenaRef = (el, teamNo) => { if (el) arenaRefs.value[teamNo] = el; };
  const draggingChar = ref(null);
  const draggingFromTeam = ref(null);
  const rawHeroList = ref([]);
  const buffHeroPool = ref([]);
  const heroGradeFilter = ref('BUFF_LIST');
  const heroSearchKeyword = ref('');
  const teams = ref({ 1: [], 2: [], 3: [], '1_reverse': [] });
  const commonCodes = ref([]);
  const selectedHeroName = ref(null);

  const showBuffModal = ref(false);
  const isEditing = ref(false);
  const skiaCharEffects = ref([]);
  const buffForm = ref({ effect_seq: null, effect_code: '', char_id: '', rank_score: 1 });
  const effectSearchText = ref('');
  const heroSearchText = ref('');
  const isMounted = ref(false);



  
  // 🎯 [요청 1 추가] 효과코드 및 그룹코드 필터링 상태
  const effectCodeSearchText = ref(''); // 효과코드 입력 검색어
  const selectedGroupCode = ref('ALL');   // 그룹코드 선택 (ALL, CCC, DOT, STB 등)

  // 그룹코드 셀렉트 옵션
  const groupCodeOptions = [
    { label: '전체 그룹', value: 'ALL' },
    { label: 'CCC (제어)', value: 'CCC' },
    { label: 'DOT (지속피해)', value: 'DOT' },
    { label: 'SYG (시너지)', value: 'SYG' },
    { label: 'UTC (유틸)', value: 'UTC' },
    { label: 'STB (버프)', value: 'STB' },
    { label: 'DGB (상태)', value: 'DGB' },
    { label: 'SDB (디버프)', value: 'SDB' }
  ];

  // 1. 카메라 드래그 중인 팀 번호 저장 상태
  const draggingCameraTeam = ref(null);

// 1. 함수 정의
  const onCameraDragStart = (event, teamNo) => {
    draggingCameraTeam.value = teamNo;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('type', 'camera');
    event.dataTransfer.setData('teamNo', String(teamNo));
  };

  const onCameraDragEnd = () => {
    draggingCameraTeam.value = null;
  };

  const selectHero = (char) => {
    if (selectedHeroName.value === char.name) {
      selectedHeroName.value = null;
    } else {
      selectedHeroName.value = char.name;
    }
  };

  const activeChars = (teamNo) => teams.value[teamNo]?.filter(char => char.grid != null) || [];
  const getTeamCharCount = (teamNo) => activeChars(teamNo).length;

  const placedHeroIds = computed(() => {
    const ids = new Set();
    [1, 2, 3, '1_reverse'].forEach(teamNo => {
      (teams.value[teamNo] || []).forEach(char => {
        const id = char.id || char.char_id;
        if (char.grid && id) ids.add(String(id).toUpperCase());
      });
    });
    return ids;
  });

  const getAssignedTeam = (heroId) => {
    if (!heroId) return null;
    const teamKeys = [1, 2, 3];
    for (const teamNo of teamKeys) {
      const team = teams.value[teamNo];
      if (team && team.some(member => String(member.id || member.char_id) === String(heroId))) {
        return teamNo;
      }
    }
    return null;
  };

  const addHeroToTeam = (hero, targetTeam = teams.value) => {
    if (!teams.value[targetTeam]) {
      teams.value[targetTeam] = [];
    }
    
    if (teams.value[targetTeam].length >= 5) {
      alert('팀당 최대 5명까지 배치 가능합니다.');
      return;
    }
    
    teams.value[targetTeam].push(hero);
    calculateAllRanges();
  };

  const isHeroPlaced = (heroId) => {
    if (!heroId) return false;
    return placedHeroIds.value.has(String(heroId).toUpperCase());
  };

  const filteredHeroPool = computed(() => {
    let list = rawHeroList.value;
    if (heroGradeFilter.value !== 'ALL' && heroGradeFilter.value !== 'BUFF_LIST') {
      list = list.filter(h => h.grade === heroGradeFilter.value);
    }
    const q = heroSearchKeyword.value.trim().toLowerCase();
    if (q) {
      list = list.filter(h => h.name.toLowerCase().includes(q));
    }
    return list;
  });

  const buffSubFilter = ref('ALL');
  const groupedBuffHeroes = computed(() => {
    const query = heroSearchKeyword.value.trim().toLowerCase();
    if (!buffHeroPool.value || buffHeroPool.value.length === 0) return [];

    // Normalize API shape: buffHeroPool may already be grouped (group.heroes array)
    // or may be a flat list of rows per hero. Detect and convert flat rows into grouped entries.
    let pool = buffHeroPool.value;
    if (pool.length > 0 && !Array.isArray(pool[0].heroes)) {
      const map = new Map();
      pool.forEach(row => {
        const code = (row.effect_code || row.effectCode || row.effectCodeId || row.code_id || row.code || '').toString();
        const name = row.effect_name || row.effectName || row.name || '';
        const type = row.effect_type || row.type || '';

        if (!map.has(code)) {
          map.set(code, { effectCode: code, effectName: name, effect_type: type, effectType: type, heroes: [] });
        }

        const g = map.get(code);
        const heroId = row.char_id || row.charId || row.id || row.hero_id || row.heroId;
        const heroName = row.char_name || row.charName || row.hero_name || row.heroName || row.name || '';
        if (heroId) {
          g.heroes.push({ id: String(heroId), name: heroName, color: row.color || undefined });
        }
      });
      pool = Array.from(map.values());
    }

    return pool
      .map(group => {
        // 1. 속성명 안심 접근 (effectName 또는 effect_name 또는 name 등)
        const groupEffectName = group.effectName || group.effect_name || group.name || '';
        const isEffectMatched = groupEffectName.toLowerCase().includes(query);
        
        const matchedHeroes = (group.heroes || []).filter(h => 
          (h.name || h.char_name || '').toLowerCase().includes(query)
        );

        // 검색어가 있는데 효과명에도, 영웅 목록에도 없으면 제외
        if (query && !isEffectMatched && matchedHeroes.length === 0) return null;
        
        const heroesToDisplay = (query && !isEffectMatched) ? matchedHeroes : (group.heroes || []);
        
        // 2. effectType 판단 로직 타입 완화 (Boolean/String/1/0 대응 + 코드 기반 탐지)
        const rawType = (group.effectType || group.effect_type || '').toString();
        const rawCode = (group.effectCode || group.effect_code || group.groupCode || group.group_code || '').toString();
        let calculatedType = '버프';

        const isDebuff = group.isDebuff === true || group.isDebuff === 'true' || group.isDebuff === 1;
        const isCccFlag = group.isCcc === true || group.isCcc === 'true' || group.isCcc === 1;
        const isUtcFlag = group.isUtc === true || group.isUtc === 'true' || group.isUtc === 1;

        // 코드나 텍스트에 CCC/CC/CCCxx/CCxx, UTC/UT/UTCxx/UTxx 또는 한글 표기가 포함되어 있으면 해당 타입으로 간주
        // 예: CCC01, CCC10, CC01, UTC02, UT03 등 다양한 표기 허용 (언더스코어/하이픈 포함)
        const codeLooksLikeCcc = /(?:ccc[_-]?\d*|cc[_-]?\d*)/i.test(rawCode) || /군중|제어|control/i.test((rawType + ' ' + rawCode));
        const codeLooksLikeUtc = /(?:utc[_-]?\d*|ut[_-]?\d*)/i.test(rawCode) || /유틸|utility/i.test((rawType + ' ' + rawCode));

        // 우선 코드 기반(CCC/UTC 등) 판별을 먼저 수행하여 CCC로 시작하는 effectCode는 군중제어로 분류
        if (rawType === '군중제어' || rawType.toUpperCase() === 'CCC' || isCccFlag || codeLooksLikeCcc) {
          calculatedType = '군중제어';
        } else if (rawType === '유틸' || rawType.toUpperCase() === 'UTC' || isUtcFlag || codeLooksLikeUtc) {
          calculatedType = '유틸';
        } else if (rawType.toLowerCase() === '디버프' || isDebuff) {
          calculatedType = '디버프';
        }

        return { 
          ...group, 
          effectType: calculatedType, 
          heroes: heroesToDisplay 
        };
      })
      .filter(group => group && group.heroes && group.heroes.length > 0)
      .filter(group => {
        // 3. 서브 필터링
        if (buffSubFilter.value === 'BUFF') return group.effectType === '버프';
        if (buffSubFilter.value === 'DEBUFF') return group.effectType === '디버프';
        if (buffSubFilter.value === 'CCC') return group.effectType === '군중제어';
        if (buffSubFilter.value === 'UTC') return group.effectType === '유틸';
        return true;
      })
      .sort((a, b) => {
        const typeOrder = { '버프': 1, '디버프': 2, '군중제어': 3, '유틸': 4 };
        const orderA = typeOrder[a.effectType] || 99;
        const orderB = typeOrder[b.effectType] || 99;
        return orderA - orderB;
      });
  });

  const fetchCommonCodes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/common/codes`);
      commonCodes.value = response.data || [];
    } catch (e) {
      console.error('공통코드 조회 실패:', e);
    }
  };

  const fetchBoardDecks = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/decks/category/${boardCategory}`);
      boardDecks.value = response.data;
    } catch (error) {
      if (fallbackBoardCategory) {
        try {
          const response = await axios.get(`${BASE_URL}/api/decks/category/${fallbackBoardCategory}`);
          boardDecks.value = response.data;
        } catch (fallbackError) {
          console.error('덱 목록 조회 실패:', fallbackError);
        }
      } else {
        console.error('덱 목록 조회 실패:', error);
      }
    }
  };

  const fetchAllHeroPool = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/chars/all-pool`);
      if (response.data && response.data.length > 0) rawHeroList.value = response.data;
    } catch (error) {
      console.error('전체 영웅 목록 조회 실패:', error);
    }
  };

  const fetchBuffPool = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/chars/buff-pool`);
      if (response.data && response.data.length > 0) buffHeroPool.value = response.data;
    } catch (error) {
      console.error('버프 풀 조회 실패:', error);
    }
  };

  const fetchSkiaCharEffects = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/char-effects`);
      skiaCharEffects.value = res.data || [];
    } catch (e) {
      console.error('캐릭터 효과 조회 실패:', e);
    }
  };

  const parseMeterValue = (detailText, keyword) => {
    if (!detailText) return 0;
    const cleanText = detailText.replace(/\s/g, '');
    if (keyword) {
      const regex = new RegExp(`${keyword}([0-9.]+)m`);
      const match = cleanText.match(regex);
      if (match && match[1]) return parseFloat(match[1]);
    }
    const generalMatch = cleanText.match(/([0-9.]+)\s*m/);
    if (generalMatch && generalMatch[1]) return parseFloat(generalMatch[1]);
    return 0;
  };

  const getGridFromIndex = (i) => {
    const colIndexFromRight = Math.floor(i / gridRows);
    const col = (gridCols - 1) - colIndexFromRight;
    const row = i % gridRows;
    return { row, col };
  };

  const getIndexFromGrid = (row, col) => {
    const colIndexFromRight = (gridCols - 1) - col;
    return colIndexFromRight * gridRows + row;
  };

  const handleDeckCodeParse = async (code, teamNo) => {
    if (!code) return [];
    const cleanCode = String(code).trim().replace(/\s/g, '');
    const slots = [];
    const queryIds = new Set();
    let cursor = 0;
    const maxSlotCount = gridRows * gridCols;

    while (cursor < cleanCode.length && slots.length < maxSlotCount) {
      const char = cleanCode[cursor];
      if (char === '.') {
        slots.push(null);
        cursor += 1;
      } else {
        const charId = cleanCode.substring(cursor, cursor + 2).toUpperCase();
        slots.push(charId);
        if (charId && charId !== '..') queryIds.add(charId);
        cursor += 2;
      }
    }
    while (slots.length < maxSlotCount) slots.push(null);
    if (queryIds.size === 0) return [];

    try {

      
      const response = await axios.post(`${BASE_URL}/api/chars/batch`, { charIds: Array.from(queryIds) });
      const dbCharsMap = new Map((response.data || []).map(c => [String(c.id || c.char_id).toUpperCase(), c]));
      
      const refContainer = arenaRefs.value[teamNo] || arenaRefs.value['1_r'] || arenaRefs.value['1_reverse'];

// 🥊 cellHeight, cellWidth 기본값(36) 안전장치 추가
      const fallbackWidth = typeof cardWidth === 'number' ? cardWidth : 36;
      const fallbackHeight = typeof cardHeight === 'number' ? cardHeight : 36;

      const cellHeight = (refContainer && refContainer.getBoundingClientRect().height > 0)
        ? refContainer.getBoundingClientRect().height / gridRows 
        : fallbackHeight;
      const cellWidth = (refContainer && refContainer.getBoundingClientRect().width > 0)
        ? refContainer.getBoundingClientRect().width / gridCols 
        : fallbackWidth;
        
      const parsedList = [];
      const isReverse = String(teamNo).includes('reverse') || String(teamNo).includes('_r');

      for (let i = 0; i < maxSlotCount; i++) {
        const charId = slots[i];
        if (!charId) continue;
        const baseCharData = dbCharsMap.get(charId) || { id: charId, name: '미등록', color: '#94a3b8', skills: {}, buffs: {} };
        
        // 🥊 리버스 팀도 동일한 그리드 인덱스 함수를 사용하여 좌표 불일치 방지
        const gridPos = getGridFromIndex(i);
        let row = gridPos.row;
        let col = isReverse ? (gridCols - 1 - gridPos.col) : gridPos.col; // 리버스 반전 처리

        parsedList.push({
          ...JSON.parse(JSON.stringify(baseCharData)),
          instanceId: `${charId}_team${teamNo}_slot_${i}_${Date.now()}`,
          id: charId,
          grid: { row, col },
          position: {
            left: col * cellWidth + (cellWidth - cardWidth) / 2,
            top: row * cellHeight + (cellHeight - cardHeight) / 2
          }
        });
      }
      return parsedList;
    } catch (err) {
      console.error('덱 코드 파싱 실패:', err);
      return [];
    }
  };

  const loadSelectedBoardDeck = async () => {
    // 💡 덱을 불러올 때 기존 드래그 상태 리셋
    localCameraGridPositions.value = {};
    if (!selectedBoardDeck.value) return;
    selectedHeroName.value = null;
    const { deck_content1, deck_content2, deck_content3 } = selectedBoardDeck.value;

    teams.value[1] = await handleDeckCodeParse(deck_content1, 1);
    teams.value[2] = await handleDeckCodeParse(deck_content2, 2);
    teams.value[3] = await handleDeckCodeParse(deck_content3, 3);
    
    teams.value['1_reverse'] = await handleDeckCodeParse(deck_content1, '1_reverse');

    await nextTick();
    calculateAllRanges();
    updateCameraPixelPosition();
  };

  const onDragStart = (event, char, teamNo) => {
    draggingChar.value = char;
    draggingFromTeam.value = teamNo;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(char.instanceId));
  };

  const onDragStartFromPool = (event, hero) => {
    if (isHeroPlaced(hero.id || hero.char_id)) {
      event.preventDefault();
      return;
    }
    draggingChar.value = hero;
    draggingFromTeam.value = 'pool';
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/json', JSON.stringify(hero));
  };

  const onDragging = () => { calculateAllRanges(); };

// 📷 3. onDrop 내부의 카메라 처리 블록 수정
  const onDrop = async (event, teamNo) => {
    const refContainer = arenaRefs.value[teamNo];
    if (!refContainer) return;

    const containerRect = refContainer.getBoundingClientRect();
    const cellHeight = containerRect.height > 0 ? containerRect.height / gridRows : (cardHeight || 36);
    const cellWidth = containerRect.width > 0 ? containerRect.width / gridCols : (cardWidth || 36);

    const row = Math.max(0, Math.min(gridRows - 1, Math.floor((event.clientY - containerRect.top) / cellHeight)));
    const col = Math.max(0, Math.min(gridCols - 1, Math.floor((event.clientX - containerRect.left) / cellWidth)));

    const dragType = event.dataTransfer.getData('type');
    const sourceTeamNo = Number(event.dataTransfer.getData('teamNo'));

    // 📷 카메라 드래그앤드롭 처리
    if (dragType === 'camera' || draggingCameraTeam.value) {
      const currentTeam = sourceTeamNo || draggingCameraTeam.value;

      if (currentTeam !== teamNo) {
        draggingCameraTeam.value = null;
        return;
      }

      const colFromRight = (gridCols - 1) - col;
      const letterIndex = colFromRight * gridRows + row;
      const cameraChar = `#${String.fromCharCode(65 + letterIndex)}`;

      // A. 로컬 상태에만 드래그 위치 저장 (selectedBoardDeck 원본 객체는 건드리지 않음!)
      localCameraGridPositions.value[teamNo] = cameraChar;

      // B. 화면 픽셀 좌표 재계산
      await nextTick();
      if (typeof updateCameraPixelPosition === 'function') {
        updateCameraPixelPosition();
      }

      draggingCameraTeam.value = null;
      return;
    }

    if ((teams.value[teamNo] || []).some(c => c.grid?.row === row && c.grid?.col === col)) return;

    const isHeroAlreadyInAnyTeam = (charId) => {
      const targetId = String(charId).toUpperCase();
      return [1, 2, 3, '1_reverse'].some(tNo => 
        (teams.value[tNo] || []).some(c => String(c.id || c.char_id).toUpperCase() === targetId)
      );
    };

    if (draggingFromTeam.value === 'pool') {
      if (getTeamCharCount(teamNo) >= maxTeamMembers) {
        alert(`팀당 최대 ${maxTeamMembers}명까지만 배치할 수 있습니다.`);
        return;
      }
      try {
        const heroData = JSON.parse(event.dataTransfer.getData('application/json'));
        const targetCharId = heroData.id || heroData.char_id;
        if (!targetCharId) return;

        if (isHeroAlreadyInAnyTeam(targetCharId)) {
          alert('이미 전장에 배치된 영웅입니다.');
          draggingChar.value = null;
          draggingFromTeam.value = null;
          return;
        }

        const response = await axios.post(`${BASE_URL}/api/chars/batch`, { charIds: [String(targetCharId).toUpperCase()] });
        let masterCharData = response.data && response.data.length > 0 ? response.data[0] : null;
        if (!masterCharData) {
          masterCharData = rawHeroList.value.find(c => String(c.id).toUpperCase() === String(targetCharId).toUpperCase());
        }
        if (!masterCharData) {
          console.warn(`[${targetCharId}] 데이터를 찾지 못했습니다.`);
          return;
        }

        const newChar = {
          ...JSON.parse(JSON.stringify(masterCharData)),
          id: masterCharData.id || targetCharId,
          instanceId: `${targetCharId}_team${teamNo}_slot_${row}_${col}_${Date.now()}`,
          grid: { row, col },
          position: {
            left: col * cellWidth + (cellWidth - cardWidth) / 2,
            top: row * cellHeight + (cellHeight - cardHeight) / 2
          }
        };

        teams.value[teamNo] = [...(teams.value[teamNo] || []), newChar];
        await nextTick();
        calculateAllRanges();
      } catch (e) {
        console.error('보관함 Drop 처리 실패:', e);
      }
    } else if (draggingFromTeam.value) {
      const targetInstanceId = event.dataTransfer.getData('text/plain') || (draggingChar.value ? draggingChar.value.instanceId : null);
      if (!targetInstanceId) return;

      const sourceTeamList = teams.value[draggingFromTeam.value];
      if (!sourceTeamList) return;

      const targetCharIndex = sourceTeamList.findIndex(c => String(c.instanceId) === String(targetInstanceId));
      if (targetCharIndex === -1) return;

      const targetChar = { ...sourceTeamList[targetCharIndex] };
      const isCrossTeamMove = String(draggingFromTeam.value) !== String(teamNo);

      if (isCrossTeamMove) {
        const targetTeamHasHero = (teams.value[teamNo] || []).some(c => String(c.id || c.char_id).toUpperCase() === String(targetChar.id || targetChar.char_id).toUpperCase());
        if (targetTeamHasHero) {
          alert('해당 팀에 이미 같은 영웅이 존재합니다.');
          draggingChar.value = null;
          draggingFromTeam.value = null;
          return;
        }
      }

      targetChar.grid = { row, col };
      targetChar.position = {
        left: col * cellWidth + (cellWidth - cardWidth) / 2,
        top: row * cellHeight + (cellHeight - cardHeight) / 2
      };

      if (isCrossTeamMove) {
        if (getTeamCharCount(teamNo) >= maxTeamMembers) return;
        teams.value[draggingFromTeam.value] = sourceTeamList.filter((_, idx) => idx !== targetCharIndex);
        teams.value[teamNo] = [...(teams.value[teamNo] || []), targetChar];
      } else {
        const updatedList = [...teams.value[teamNo]];
        updatedList[targetCharIndex] = targetChar;
        teams.value[teamNo] = updatedList;
      }
    }

    draggingChar.value = null;
    draggingFromTeam.value = null;
    nextTick(() => calculateAllRanges());
  };

  const removeHero = (char, teamNo) => {
    if (selectedHeroName.value === char.name) selectedHeroName.value = null;
    teams.value[teamNo] = (teams.value[teamNo] || []).filter(c => c.instanceId !== char.instanceId);
    calculateAllRanges();
  };

  const clearTeam = (teamNo) => {
    if (!confirm(`팀 ${teamNo}의 배치를 초기화하시겠습니까?`)) return;
    teams.value[teamNo] = [];
    selectedHeroName.value = null;
    calculateAllRanges();
  };

  const activeStatusTab = ref(1);
  const activeBoardType = ref('buff');
  const getStatusTabLabel = computed(() => `T${activeStatusTab.value}`);

  const getHeroImage = (id) => id ? `${BASE_URL}/uploads/chars/${String(id).toUpperCase()}.jpg` : 'https://placehold.co/36?text=No+Img';
  const handleImageError = (e) => { e.target.src = 'https://placehold.co/36?text=No+Img'; };

const copyTeamDeckCode = async (teamNo) => {
    const gridCodeArray = Array(gridRows * gridCols).fill('.');
    const targetTeam = teams.value ? (teams.value[teamNo] || []) : [];

    targetTeam.forEach(char => {
      if (char && char.grid && char.id) {
        const idx = getIndexFromGrid(char.grid.row, char.grid.col);
        if (idx >= 0 && idx < gridRows * gridCols) {
          gridCodeArray[idx] = String(char.id).toUpperCase();
        }
      }
    });

    // 1. 기본 덱 문자열 생성 (48자리)
    let deckCode = gridCodeArray.join('');

    // 2. 📷 카메라 위치 정보 문자열(#W 등) 추출
    let rawPos = '';
    const deckData = selectedBoardDeck.value;

    if (deckData) {
      // DB 객체 내 다양한 카메라 필드 탐색
      rawPos = deckData[`cameraPosition${teamNo}`] || 
               deckData[`camera_pos${teamNo}`] || 
               deckData[`cameraPosition`] || 
               deckData[`camera_pos`] || '';

      // 원본 덱 콘텐츠 문자열(deck_content1 등) 내에 #W 형식으로 포함되어 있는 경우 파싱
      if (!rawPos) {
        const contentStr = deckData[`deck_content${teamNo}`] || deckData.deck_content1 || '';
        const match = String(contentStr).match(/#([A-Z])/i);
        if (match && match[1]) {
          rawPos = match[1];
        }
      }
    }

    // 3. 카메라 문자가 유효하면 #알파벳 형태로 붙임
    if (rawPos) {
      const cameraLetter = String(rawPos).replace('#', '').trim().toUpperCase();
      if (cameraLetter) {
        deckCode += `#${cameraLetter}`;
      }
    }

    // 4. 클립보드 복사 실행
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(deckCode);
        alert(`덱 코드가 복사되었습니다! (${deckCode})`);
      } else {
        copyToClipboardFallback(deckCode, teamNo);
      }
    } catch (err) {
      console.warn('Modern clipboard API 실패, Fallback 시도:', err);
      copyToClipboardFallback(deckCode, teamNo);
    }
  };

  const copyToClipboardFallback = (text, teamNo) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert(`덱 코드가 복사되었습니다!`);
      } else {
        alert('복사 실패: 브라우저 권한을 확인해주세요.');
      }
    } catch (err) {
      console.error('Fallback 복사 실패:', err);
      alert('클립보드 복사를 지원하지 않는 브라우저입니다.');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const copyToReverseTeam = async (sourceTeamNo = 1) => {
    const sourceTeam = teams.value[sourceTeamNo];

    if (!sourceTeam || sourceTeam.length === 0) {
      alert('복사할 원본 덱 데이터가 없습니다.');
      return;
    }

    const totalCells = gridRows * gridCols;
    const gridCodeArray = Array(totalCells).fill('.');

    const reverseTeamData = sourceTeam.map(hero => {
      const newHero = JSON.parse(JSON.stringify(hero));

      if (newHero.grid) {
        const reverseCol = (gridCols - 1) - newHero.grid.col;
        const reverseRow = newHero.grid.row;

        newHero.grid = {
          col: reverseCol,
          row: reverseRow
        };

        const idx = getIndexFromGrid(reverseRow, reverseCol);
        if (idx >= 0 && idx < totalCells && newHero.id) {
          gridCodeArray[idx] = String(newHero.id).toUpperCase();
        }
      }

      return newHero;
    });

    teams.value['1_reverse'] = reverseTeamData;
    let deckCode = gridCodeArray.join('');

    // 📷 리버스 덱용 카메라 위치 문자열 가져오기 및 런타임 에러 해결
    const deckData = selectedBoardDeck.value;
    let rawPos = '';
    if (deckData) {
      rawPos = deckData[`cameraPosition${sourceTeamNo}`] || 
               deckData[`camera_pos${sourceTeamNo}`] || 
               deckData.cameraPosition || 
               deckData.camera_pos || '';

      if (!rawPos) {
        const contentStr = deckData[`deck_content${sourceTeamNo}`] || deckData.deck_content1 || '';
        const match = String(contentStr).match(/#([A-Z])/i);
        if (match && match[1]) rawPos = match[1];
      }
    }

    if (rawPos) {
      const cameraLetter = String(rawPos).replace('#', '').trim().toUpperCase();
      if (cameraLetter) {
        deckCode += `#${cameraLetter}`;
      }
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(deckCode);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = deckCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      if (typeof calculateAllRanges === 'function') {
        calculateAllRanges();
      }

      alert(`팀 ${sourceTeamNo} 덱 복사! (${deckCode})`);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      alert('리버스 덱 변환은 완료되었으나 클립보드 복사에 실패했습니다.');
    }
  };

  const resetBuffForm = () => {
    isEditing.value = false;
    effectSearchText.value = '';
    heroSearchText.value = '';
    buffForm.value = { effect_seq: null, effect_code: '', char_id: '', rank_score: 1 };
  };

const openBuffModal = (options = {}) => {
  // 🎯 전달받은 width, height가 100 미만이거나 미지정이면 기본값(1100, 850) 사용
  const reqWidth = (options && options.width > 100) ? options.width : 1100;
  const reqHeight = (options && options.height > 100) ? options.height : 850;

  const width = Math.floor(reqWidth);
  const height = Math.floor(reqHeight);

  // 화면 중앙 위치 계산 (정수 변환)
  const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
  const top = Math.max(0, Math.floor((window.screen.height - height) / 2));

  const url = '/?view=buff-manage';
  const title = 'BuffHeroManagementWindow'; // 공백 없는 영문 target명

  const windowFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;

  const popupWindow = window.open(url, title, windowFeatures);

  if (popupWindow) {
    popupWindow.focus();
  } else {
    alert('팝업 차단이 설정되어 있습니다. 팝업 차단을 해제해 주세요.');
  }
};

  // 💡 부모 창에서 데이터를 새로고침할 필요가 있을 때 호출할 콜백 처리 (선택 사항)
  const refreshBuffData = async () => {
    await fetchSkiaCharEffects();
    await fetchBuffPool();
  };    

  const closeBuffModal = () => {
    showBuffModal.value = false;
    resetBuffForm();
  };

  const saveCharEffect = async () => {
    if (!buffForm.value.effect_code || !buffForm.value.char_id) return alert('모두 입력해주세요.');
    try {
      if (isEditing.value) {
        await axios.put(`${BASE_URL}/api/char-effects/${buffForm.value.effect_seq}`, buffForm.value);
      } else {
        const { effect_seq, ...p } = buffForm.value;
        await axios.post(`${BASE_URL}/api/char-effects`, p);
      }
      const code = buffForm.value.effect_code;
      const txt = effectSearchText.value;
      resetBuffForm();
      buffForm.value.effect_code = code;
      effectSearchText.value = txt;
      await fetchSkiaCharEffects();
      await fetchBuffPool();
    } catch (e) {
      console.error('캐릭터 효과 저장 실패:', e);
    }
  };

  const editCharEffect = (item) => {
    isEditing.value = true;
    buffForm.value = { ...item };
    effectSearchText.value = commonCodes.value.find(c => c.code_id === item.effect_code)?.code_name || item.effect_code;
    heroSearchText.value = rawHeroList.value.find(h => h.id === item.char_id)?.name || item.char_id;
  };

// 🎯 [요청 2 수정] DB 저장 전 임시 행 삭제 대응
  const deleteCharEffect = async (seq, index) => {
    if (!confirm('삭제하시겠습니까?')) return;
    
    // DB 저장 전인 임시 항목이면 배열에서 바로 제거
    if (!seq) {
      if (typeof index === 'number') {
        skiaCharEffects.value.splice(index, 1);
      }
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/api/char-effects/${seq}`);
      await fetchSkiaCharEffects();
      await fetchBuffPool();
    } catch (e) {
      console.error('캐릭터 효과 삭제 실패:', e);
    }
  };

  const ALLOWED_PREFIXES = ['CCC', 'DOT', 'SYG', 'UTC', 'STB', 'DGB', 'SDB'];
  const filteredEffectCodes = computed(() => {
    if (!commonCodes.value) return [];
    const q = effectSearchText.value.toLowerCase();
    return commonCodes.value.filter(c => c && ALLOWED_PREFIXES.some(p => c.code_id.startsWith(p)) && (c.code_name.toLowerCase().includes(q) || c.code_id.toLowerCase().includes(q)));
  });

  const filteredHeroIds = computed(() => {
    const q = heroSearchText.value.toLowerCase();
    return rawHeroList.value.filter(h => h.name.toLowerCase().includes(q) || h.id.toLowerCase().includes(q));
  });

// 🎯 [요청 1 & 3 수정] 효과코드/그룹코드 필터링 및 효과코드(effect_code) 기준 정렬
  const displayedEffects = computed(() => {
    let list = [...skiaCharEffects.value];

    // 1. 그룹코드 선택 필터링 (null 안전 처리)
    if (selectedGroupCode.value && selectedGroupCode.value !== 'ALL') {
      list = list.filter(item => 
        item && item.effect_code && String(item.effect_code).startsWith(selectedGroupCode.value)
      );
    }

    // 2. 효과코드 텍스트 필터링 (null 안전 처리)
    const qCode = effectCodeSearchText.value.trim().toLowerCase();
    if (qCode) {
      list = list.filter(item => 
        item && item.effect_code && String(item.effect_code).toLowerCase().includes(qCode)
      );
    }

    // 3. 효과코드(effect_code) 오름차순 정렬
    return list.sort((a, b) => String(a?.effect_code || '').localeCompare(String(b?.effect_code || '')));
  });
  const addNewEffectRow = () => {
    if (!buffForm.value.effect_code || !buffForm.value.char_id) {
      alert('효과코드와 캐릭터를 모두 입력해주세요.');
      return;
    }

    const newRow = {
      effect_seq: null,
      effect_code: buffForm.value.effect_code,
      char_id: buffForm.value.char_id,
      rank_score: buffForm.value.rank_score || 1,
      isNew: true
    };

    skiaCharEffects.value.push(newRow);
    resetBuffForm();
  };

  // 🎯 [요청 2 추가] 추가되거나 변경된 항목 일괄 저장 API 호출
  const saveAllCharEffects = async () => {
    try {
      const newItems = skiaCharEffects.value.filter(item => item.isNew || !item.effect_seq);
      
      if (newItems.length === 0) {
        alert('저장할 신규 변경 항목이 없습니다.');
        return;
      }

      for (const item of newItems) {
        const { effect_seq, isNew, ...payload } = item;
        await axios.post(`${BASE_URL}/api/char-effects`, payload);
      }

      alert('성공적으로 저장되었습니다.');
      await fetchSkiaCharEffects();
      await fetchBuffPool();
    } catch (e) {
      console.error('효과 매핑 일괄 저장 실패:', e);
      alert('저장 중 오류가 발생했습니다.');
    }
  };
  const MASTER_EFFECT_ORDER = [
    'UTC25', 'UTC26', 'STB03', 'STB07', 'STB08', 'STB22', 'STB01', 'STB25', 
    'STB10', 'STB12', 'STB24', 'STB13', 'STB16', 'STB21', 'STB05', 
    'STB26', 'STB19', 'STB14', 'SYG01', 'SYG02'
  ];

  const MASTER_EFFECT_CCCDOT_ORDER = [
    'DOT01', 'DOT02', 'DOT03', 'DOT04', 'DOT05', 'DOT06', 'CCC01', 'CCC02', 
    'CCC03', 'CCC04', 'CCC05', 'CCC06', 'CCC07', 'CCC08', 'CCC09', 'CCC10', 'CCC11'
  ];

  const MASTER_EFFECT_DEBUFF_ORDER = [
    'SDB10', 'SDB17', 'SDB03', 'SDB21', 'SDB20', 'SDB07', 'SDB19', 'SDB08', 'SDB09', 
    'SDB06', 'SDB04', 'SDB16', 'SDB18', 'SDB05', 'SDB12', 'SDB22', 'SDB23', 
    'SDB15', 'SDB14'
  ];

  const effectGroupedList = computed(() => {
    const groups = {};

    MASTER_EFFECT_ORDER.forEach(code => {
      if (!code) return;
      const nameShort = typeof getCodeName === 'function' ? getCodeName(code) : code;
      groups[code] = {
        effectCode: code,
        effectNameShort: nameShort,
        effectName: nameShort,
        sources: []
      };
    });

    [1, 2, 3].forEach(teamNo => {
      if (!teams.value || !teams.value[teamNo]) return;
      teams.value[teamNo].forEach(char => {
        if (!char.grid || !char.buffs) return;
        Object.values(char.buffs).forEach(buff => {
          if (buff && buff.target_code === 'TGT02') {
            const code = buff.effect_code || 'NONE';
            
            if (!groups[code]) {
              const shortName = typeof getCodeName === 'function' ? getCodeName(code) : code;
              groups[code] = {
                effectCode: code,
                effectNameShort: buff.effect_code_name_short || shortName || '기타 효과',
                effectName: buff.effect_code_name || buff.name || shortName || '기타 효과',
                sources: []
              };
            }

            let skillLabel = buff.skill_code === 'SKI01' ? 'N' : buff.skill_code === 'SKI02' ? 'C' : 'A';
            groups[code].sources.push({
              teamNo,
              charName: char.name,
              charValue: buff.effect_value || '0',
              skillDesc: skillLabel
            });
          }
        });
      });
    });

    const result = [];
    MASTER_EFFECT_ORDER.forEach(code => {
      if (code && groups[code]) {
        result.push(groups[code]);
        delete groups[code];
      }
    });
    Object.values(groups).forEach(item => result.push(item));

    return result;
  });

  const debuffGroupedList = computed(() => {
    const groups = {};
    const fullDebuffOrder = [...MASTER_EFFECT_DEBUFF_ORDER, ...MASTER_EFFECT_CCCDOT_ORDER];

    fullDebuffOrder.forEach(code => {
      if (!code || groups[code]) return;
      const nameShort = typeof getCodeName === 'function' ? getCodeName(code) : code;
      groups[code] = {
        effectCode: code,
        effectNameShort: nameShort,
        effectName: nameShort,
        sources: []
      };
    });

    [1, 2, 3].forEach(teamNo => {
      if (!teams.value || !teams.value[teamNo]) return;
      teams.value[teamNo].forEach(char => {
        if (!char.grid || !char.buffs) return;
        Object.values(char.buffs).forEach(buff => {
          if (buff && buff.effect_type === '디버프') {
            const code = buff.effect_code || 'NONE';
            
            if (!groups[code]) {
              const shortName = typeof getCodeName === 'function' ? getCodeName(code) : code;
              groups[code] = {
                effectCode: code,
                effectNameShort: buff.effect_code_name_short || shortName || '기타 디버프',
                effectName: buff.effect_code_name || buff.name || shortName || '기타 효과',
                sources: []
              };
            }

            let skillLabel = buff.skill_code === 'SKI01' ? 'N' : buff.skill_code === 'SKI02' ? 'C' : 'A';
            groups[code].sources.push({
              teamNo,
              charName: char.name,
              charValue: buff.effect_value || '0',
              skillDesc: skillLabel
            });
          }
        });
      });
    });

    const result = [];
    fullDebuffOrder.forEach(code => {
      if (code && groups[code]) {
        result.push(groups[code]);
        delete groups[code];
      }
    });
    Object.values(groups).forEach(item => result.push(item));

    return result;
  });

  const parseValueStr = (valueStr) => {
    if (!valueStr) return 0;
    const numericStr = String(valueStr).replace(/[^0-9.]/g, '');
    return numericStr ? parseFloat(numericStr) : 0;
  };

  const filteredEffectGroupedList = computed(() => {
    return effectGroupedList.value.map(g => {
      const src = g.sources.filter(s => s.teamNo === activeStatusTab.value);
      const sortedSrc = [...src].sort((a, b) => parseValueStr(b.charValue) - parseValueStr(a.charValue));
      return { ...g, sources: sortedSrc };
    });
  });

  const filteredDebuffGroupedList = computed(() => {
    return debuffGroupedList.value.map(g => {
      const src = g.sources.filter(s => s.teamNo === activeStatusTab.value);
      const sortedSrc = [...src].sort((a, b) => parseValueStr(b.charValue) - parseValueStr(a.charValue));
      return { ...g, sources: sortedSrc };
    });
  });

  const getFirstAvailableGridIndex = (teamNo) => {
    const occupied = new Set((teams.value[teamNo] || []).map(char => `${char.grid?.row},${char.grid?.col}`));
    for (let i = 0; i < gridRows * gridCols; i++) {
      const { row, col } = getGridFromIndex(i);
      if (!occupied.has(`${row},${col}`)) return i;
    }
    return -1;
  };

  const createFullHeroCard = (charId, teamNo, row, col) => {
    const baseHero = rawHeroList.value.find(h => String(h.id) === String(charId));
    if (!baseHero) {
      console.warn(`ID [${charId}]에 해당하는 영웅을 rawHeroList에서 찾을 수 없습니다.`);
      return null;
    }
    const refContainer = arenaRefs.value?.[teamNo];
    const cellHeight = refContainer ? refContainer.getBoundingClientRect().height / gridRows : cardHeight;
    const cellWidth = cellHeight;
    return {
      ...JSON.parse(JSON.stringify(baseHero)),
      instanceId: `${charId}_team${teamNo}_${row}_${col}_${Date.now()}`,
      grid: { row, col },
      position: {
        left: col * cellWidth + (cellWidth - cardWidth) / 2,
        top: row * cellHeight + (cellHeight - cardHeight) / 2
      },
      buffs: baseHero.buffs || {}
    };
  };

  const handleGridUpdate = async (teamNo, row, col, charId) => {
    if ((teams.value[teamNo] || []).some(c => c.grid?.row === row && c.grid?.col === col)) return;
    const newHeroCard = createFullHeroCard(charId, teamNo, row, col);
    if (!newHeroCard) return;
    teams.value[teamNo] = [...(teams.value[teamNo] || []), newHeroCard];
    await nextTick();
    calculateAllRanges();
  };

  const onHeroClickAdd = (hero) => {
    const targetTeam = 1;
    const emptySlotIndex = getFirstAvailableGridIndex(targetTeam);
    if (emptySlotIndex === -1) return alert('배치 공간이 없습니다.');
    const { row, col } = getGridFromIndex(emptySlotIndex);
    handleGridUpdate(targetTeam, row, col, hero.id);
  };

  function getArcPath(x, y, radius, startAngle, endAngle) {
    // 🥊 1. 모든 인자를 강제로 숫자로 변환
    const numX = Number(x);
    const numY = Number(y);
    const numRad = Number(radius);
    const numStart = Number(startAngle);
    const numEnd = Number(endAngle);

    // 🥊 2. 하나라도 숫자가 아니거나(NaN), 반지름이 0 이하면 즉시 빈 문자열 반환 (NaN Z 방지)
    if (isNaN(numX) || isNaN(numY) || isNaN(numRad) || isNaN(numStart) || isNaN(numEnd) || numRad <= 0) {
      return '';
    }

    const startRad = (numStart * Math.PI) / 180;
    const endRad = (numEnd * Math.PI) / 180;

    const x1 = numX + numRad * Math.cos(startRad);
    const y1 = numY + numRad * Math.sin(startRad);
    const x2 = numX + numRad * Math.cos(endRad);
    const y2 = numY + numRad * Math.sin(endRad);

    // 🥊 3. 계산된 좌표에 NaN이 섞여있는지 최종 검증
    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
      return '';
    }

    const largeArcFlag = numEnd - numStart <= 180 ? "0" : "1";

    return `M ${numX} ${numY} L ${x1} ${y1} A ${numRad} ${numRad} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  }

  const computedRanges = ref({ 1: [], 2: [], 3: []});

  console.log("🔥 [최신 소스 적용 확인용 마커] 2026-08-07 v1.0.1");
const calculateAllRanges = async () => {
  await nextTick();
  if (!isMounted.value) return;

  const teamKeys = ['1', '2', '3', '1_reverse'];
  const newComputedRanges = {};

  teamKeys.forEach(teamNo => {
    // ref 참조 (숫자/문자열 키 지원)
    const refContainer = arenaRefs.value ? (arenaRefs.value[teamNo] || arenaRefs.value[Number(teamNo)]) : null;
    
    if (!refContainer) {
      newComputedRanges[teamNo] = [];
      return; 
    }

    const containerRect = refContainer.getBoundingClientRect();
    if (!containerRect || containerRect.width === 0 || containerRect.height === 0) {
      newComputedRanges[teamNo] = [];
      return;
    }

    // 🎯 [핵심] 컨테이너 기준 격자 1칸의 절대 크기 측정
    const cellWidth = containerRect.width / gridCols;
    const cellHeight = containerRect.height / gridRows;

    if (!cellWidth || !cellHeight || isNaN(cellWidth) || isNaN(cellHeight) || cellWidth <= 0 || cellHeight <= 0) {
      newComputedRanges[teamNo] = [];
      return;
    }      
    
    const isReverse = String(teamNo).includes('reverse');
    const widthOffset = containerRect.width > 0 ? containerRect.width : (cellWidth * gridCols);
    const currentTeamList = teams.value[teamNo] || teams.value[Number(teamNo)] || [];

    newComputedRanges[teamNo] = currentTeamList.map(char => {
      if (!char || !char.grid || typeof char.grid.col !== 'number' || typeof char.grid.row !== 'number') {
        return null;
      }

      // 1. 캐릭터 중심점 (격자 칸 중심)
      const startX = Number((char.grid.col * cellWidth) + (cellWidth / 2));
      const startY = Number((char.grid.row * cellHeight) + (cellHeight / 2));

      if (isNaN(startX) || isNaN(startY)) return null;

      // 2. 현재 선택된 스킬 데이터 가져오기
      const currentSkillKey = selectedSkillClass.value;
      const totalSkills = char.skills || {};
      const skillNode = totalSkills[currentSkillKey] || {};

      let baseRange = 8.0;
      if (typeof skillNode === 'number') {
        baseRange = skillNode;
      } else if (skillNode && skillNode.range) {
        baseRange = parseFloat(skillNode.range);
      } else if (typeof totalSkills['일반공격'] === 'number') {
        baseRange = totalSkills['일반공격'];
      } else if (totalSkills['일반공격']?.range) {
        baseRange = parseFloat(totalSkills['일반공격'].range);
      }

      if (isNaN(baseRange) || baseRange <= 0) baseRange = 8.0;

      // 🎯 [사거리 점선 통일 기준] 
      const attackRange = baseRange * cellWidth * 0.038;

      const endX = isReverse ? startX - attackRange : startX + attackRange;
      const endY = startY;

      let shape = '원';
      let radius = 0;
      let rectWidth = 0;
      let rectHeight = 0;
      let pathD = '';
      let isForward = false;

      let centerX = endX;
      let centerY = endY;

      // 🎯 [버프 및 범위 파싱 광범위 매칭]
      const skillCodeMap = {
        '일반공격': 'SKI01',
        '치명타공격': 'SKI02',
        '액티브공격': 'SKI03'
      };
      const targetSkillCode = skillCodeMap[currentSkillKey] || 'SKI03';
      const buffsList = Array.isArray(char.buffs) ? char.buffs : [];
      
      const matchedBuff = buffsList.find(b => 
        (b.skill_code === targetSkillCode || (b.name && b.name.includes(currentSkillKey))) && 
        (b.range_type || b.range_detail || b.range_shape || b.shape_type || b.shape)
      ) || buffsList.find(b => b.range_type || b.range_detail || b.range_shape || b.shape_type || b.shape) || {};

      const rawType = 
        matchedBuff.range_type || matchedBuff.range_shape || matchedBuff.shape_type || matchedBuff.shape ||
        (typeof skillNode === 'object' ? (skillNode.range_type || skillNode.range_shape || skillNode.shape_type || skillNode.shape || skillNode.type || skillNode.attack_type) : '') ||
        char.range_type || char.range_shape || char.shape_type || char.shape || '';

      const rawDetail = 
        matchedBuff.range_detail || matchedBuff.detail || matchedBuff.desc ||
        (typeof skillNode === 'object' ? (skillNode.range_detail || skillNode.detail || skillNode.desc || skillNode.skill_desc) : '') ||
        char.range_detail || char.detail || char.skill_desc || '';

      const rType = String(rawType).toLowerCase();
      const rDetail = String(rawDetail).toLowerCase();

      const extractMeter = (text) => {
        if (!text) return 0;
        const match = text.match(/범위\s*([0-9.]+)\s*m/i) || text.match(/([0-9.]+)\s*m/i);
        return match ? parseFloat(match[1]) : 0;
      };

      // 자신/후방 기준 스킬인 경우 시작점으로
      if (rDetail.includes('자신') || rDetail.includes('후방') || rType.includes('자신')) {
        centerX = startX;
        centerY = startY;
      }

      if (isNaN(centerX)) centerX = endX;
      if (isNaN(centerY)) centerY = endY;

      // 🎯 [격자 1칸(cellWidth) 기준 단일화 환산 비율]
      const meterToPx = cellWidth * 0.22;

      const isHalfCircle = rType.includes('반원') || rDetail.includes('반원') || rType.includes('half') || rType.includes('semicircle');
      const isSector = rType.includes('부채꼴') || rDetail.includes('부채꼴') || rType.includes('fan') || rType.includes('sector');
      const isRect = rType.includes('직선') || rType.includes('사각형') || rType.includes('line') || rType.includes('rect') || rDetail.includes('폭') || rDetail.includes('길이');

      if (isHalfCircle) {
        shape = '반원';
        const meter = extractMeter(rDetail) || 3;
        radius = meter * meterToPx;
        const startAngle = isReverse ? 90 : -90;
        const endAngle = isReverse ? 270 : 90;
        pathD = (radius > 0) ? getArcPath(centerX, centerY, radius, startAngle, endAngle) : '';
      } 
      else if (isSector) {
        shape = '부채꼴';
        const meter = extractMeter(rDetail) || 3;
        radius = meter * meterToPx;
        const startAngle = isReverse ? 150 : -30;
        const endAngle = isReverse ? 210 : 30;
        pathD = (radius > 0) ? getArcPath(centerX, centerY, radius, startAngle, endAngle) : '';
      } 
      else if (isRect) {
        shape = '사각형';
        const wMatch = rDetail.match(/길이\s*([0-9.]+)/i);
        const hMatch = rDetail.match(/폭\s*([0-9.]+)/i);

        const wMeter = wMatch ? parseFloat(wMatch[1]) : extractMeter(rDetail);
        const hMeter = hMatch ? parseFloat(hMatch[1]) : 2;

        rectWidth = (wMeter || 3) * meterToPx;
        rectHeight = (hMeter || 2) * cellHeight * 0.45;

        if (rDetail.includes('전방') || rDetail.includes('후방') || rDetail.includes('직선')) {
          isForward = true;
          centerX = startX;
        }
      } 
      else {
        shape = '원';
        const meter = extractMeter(rDetail) || 2.5;
        radius = meter * meterToPx;
      }

      const finalDrawX = (isNaN(centerX) || centerX === undefined) ? endX : centerX;
      const finalDrawY = (isNaN(centerY) || centerY === undefined) ? endY : centerY;
      const safeEndX = isNaN(endX) ? startX : endX;
      const safeEndY = isNaN(endY) ? startY : endY;
      const safeWidthOffset = isNaN(widthOffset) ? 0 : widthOffset;
      const bossXOffset = isReverse ? safeWidthOffset : -safeWidthOffset;        

      return {
        instanceId: char.instanceId || char.id,
        name: char.name,
        color: char.color || '#3b82f6',
        startX,
        startY,
        endX: safeEndX,
        endY: safeEndY,
        shape,
        // 격자 1칸 크기에 꼭 맞춘 기본값 지정
        radius: isNaN(radius) || radius <= 0 ? cellWidth * 0.38 : radius,
        width: isNaN(rectWidth) || rectWidth <= 0 ? cellWidth * 1.0 : rectWidth,
        height: isNaN(rectHeight) || rectHeight <= 0 ? cellHeight * 0.75 : rectHeight,
        pathD: pathD || '',
        isForward,
        isReverse,
        drawX: finalDrawX,
        drawY: finalDrawY,
        bossStartX: startX + bossXOffset,
        bossEndX: safeEndX + bossXOffset,
        bossDrawX: finalDrawX + bossXOffset
      };
    }).filter(Boolean);
  });

  computedRanges.value = newComputedRanges;
};

  // 📷 1. 런타임 드래그 위치를 즉시 반영하기 위한 로컬 상태 추가
  const localCameraGridPositions = ref({});   

  // 🎯 각 팀별 카메라 위치 정보 계산 (우상단 기준 세로 순서 알파벳 파싱)
  const teamCameraGridPositions = computed(() => {
    const result = {};
    const deckData = selectedBoardDeck.value;
    if (!deckData) return result;

    [1, 2, 3].forEach(teamNo => {
      // 💡 A. 사용자가 직접 드래그해서 변경한 로컬 위치가 있다면 우선 사용
      let rawPos = localCameraGridPositions.value[teamNo] || '';

      // 💡 B. 로컬 위치가 없으면 덱 데이터/코드에서 파싱
      if (!rawPos && deckData) {
        rawPos = deckData[`cameraPosition${teamNo}`] || deckData[`camera_pos${teamNo}`] || '';
        
        if (!rawPos) {
          const contentStr = deckData[`deck_content${teamNo}`] || '';
          const match = String(contentStr).match(/#([A-Y])/i);
          if (match && match[1]) {
            rawPos = match[1];
          }
        }

        if (!rawPos && teamNo === 1) {
          rawPos = deckData.cameraPosition || deckData.camera_pos || '';
        }
      }

      if (!rawPos) return;

      const pos = String(rawPos).replace('#', '').trim().toUpperCase();
      if (!pos) return;

      const letterIndex = pos.charCodeAt(0) - 65; // 'A' = 0 ~ 'Y' = 24
      if (letterIndex < 0 || letterIndex >= 25) return;

      const colFromRight = Math.floor(letterIndex / 5);
      const row = letterIndex % 5;
      const col = 4 - colFromRight;
      const domIndex = row * 5 + col;

      result[teamNo] = { row, col, index: domIndex };
    });

    return result;
  });

  const cameraPositions = ref({});

  const updateCameraPixelPosition = () => {
    const gridPositions = teamCameraGridPositions.value;
    const newPositions = {};

    [1, 2, 3].forEach(teamNo => {
      const gridPos = gridPositions[teamNo];
      if (!gridPos) return;

      const arenaEl = arenaRefs.value ? arenaRefs.value[teamNo] : null;
      if (!arenaEl) return;

      const cells = arenaEl.querySelectorAll('.grid-cell, .board-cell, .cell');
      const targetCell = cells[gridPos.index] || (arenaEl.children ? arenaEl.children[gridPos.index] : null);

      if (!targetCell) return;

      const arenaRect = arenaEl.getBoundingClientRect();
      const cellRect = targetCell.getBoundingClientRect();

      newPositions[teamNo] = {
        left: cellRect.left - arenaRect.left,
        top: cellRect.top - arenaRect.top
      };
    });

    cameraPositions.value = newPositions;
  };

  const getCodeName = (code) => {
    if (!code) return '';
    const cleanCode = String(code).trim().toUpperCase();
    const found = Array.isArray(commonCodes.value)
      ? commonCodes.value.find(c => String(c.code_id).trim().toUpperCase() === cleanCode)
      : null;
    return found?.code_name_short || found?.code_name || code;
  };

  const checkAdminAuth = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      const user = JSON.parse(userData);
      const authResponse = await axios.get(`${BASE_URL}/api/admin/check-auth`, { params: { userId: user.user_id } });
      if (authResponse.data && authResponse.data.isAdmin) isAdmin.value = true;
    } catch (error) {
      console.error('관리자 인증 확인 실패:', error);
    }
  };

  onMounted(async () => {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'REFRESH_BUFF_POOL' && typeof refreshBuffData === 'function') {
        refreshBuffData();
      }
    });
    await fetchCommonCodes();
    await fetchBoardDecks();
    await fetchAllHeroPool();
    await fetchBuffPool();
    await checkAdminAuth();
    isMounted.value = true;
    calculateAllRanges();
    updateCameraPixelPosition();
  });

  watch(
    () => selectedBoardDeck.value?.id || selectedBoardDeck.value?.deck_seq || selectedBoardDeck.value,
    async (newVal) => {
      // 1. 드래그했던 로컬 카메라 위치 기록 완전 초기화
      localCameraGridPositions.value = {};

      if (!isMounted.value || !newVal) {
        cameraPositions.value = {};
        return;
      }

      // 2. 덱이 변경되었으므로 덱 파싱 및 픽셀 위치 재계산 수행
      await loadSelectedBoardDeck();
    },
    { immediate: true }
  );

  return {
    isAdmin,
    isPoolCollapsed,
    selectedBoardDeck,
    boardDecks,
    selectedSkillClass,
    arenaRefs,
    setArenaRef,
    draggingChar,
    draggingFromTeam,
    rawHeroList,
    buffHeroPool,
    heroGradeFilter,
    heroSearchKeyword,
    teams,
    commonCodes,
    selectedHeroName,
    selectHero,
    showBuffModal,
    isEditing,
    skiaCharEffects,
    buffForm,
    effectSearchText,
    heroSearchText,
    activeChars,
    getTeamCharCount,
    placedHeroIds,
    getAssignedTeam,
    isHeroPlaced,
    filteredHeroPool,
    buffSubFilter,
    groupedBuffHeroes,
    fetchCommonCodes,
    fetchBoardDecks,
    fetchAllHeroPool,
    fetchBuffPool,
    fetchSkiaCharEffects,
    loadSelectedBoardDeck,
    handleDeckCodeParse,
    parseMeterValue,
    computedRanges,
    calculateAllRanges,
    onDragStart,
    onDragStartFromPool,
    onDragging,
    onDrop,
    onCameraDragStart,
    onCameraDragEnd,
    removeHero,
    clearTeam,
    activeStatusTab,
    activeBoardType,
    getStatusTabLabel,
    getHeroImage,
    handleImageError,
    copyTeamDeckCode,
    copyToReverseTeam,
    openBuffModal,
    refreshBuffData,    
    closeBuffModal,
    resetBuffForm,
    saveCharEffect,
    editCharEffect,
    deleteCharEffect,
    effectCodeSearchText,
    selectedGroupCode,
    groupCodeOptions,
    addNewEffectRow,
    saveAllCharEffects,    
    filteredEffectCodes,
    filteredHeroIds,
    displayedEffects,
    effectGroupedList,
    filteredEffectGroupedList,
    debuffGroupedList,
    filteredDebuffGroupedList,
    createFullHeroCard,
    handleGridUpdate,
    onHeroClickAdd,
    getFirstAvailableGridIndex,
    getCodeName,
    cameraPositions,
    teamCameraGridPositions,
    BASE_URL,
    maxTeamMembers,
    gridRows,
    gridCols
  };
}