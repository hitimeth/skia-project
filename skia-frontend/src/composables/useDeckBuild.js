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

  const isDeepOrCelestial =
    boardCategory === 'celestial' ||
    boardCategory === 'deep_nightmare' ||
    boardCategory === 'nightmare';

  const defaultSkillClass = isDeepOrCelestial ? '액티브공격' : (initialSkillClass || '액티브공격');

  const selectedSkillClass = ref(defaultSkillClass);
  const arenaRefs = ref({});
  const setArenaRef = (el, teamNo) => { if (el) arenaRefs.value[teamNo] = el; };
  const draggingChar = ref(null);
  const draggingFromTeam = ref(null);
  const rawHeroList = ref([]);
  const buffHeroPool = ref([]);

  // 오른쪽 영웅 보관함 필터 상태: 'ALL', 'HIGH_LOAD', 'LEGEND+', 'LEGEND' 또는 해시태그 키('CRIT_RES' 등)
  const heroPoolFilter = ref('LEGEND+');
  const heroSearchKeyword = ref('');
  const teams = ref({ 1: [], 2: [], 3: [], '1_reverse': [] });
  const commonCodes = ref([]);
  const selectedHeroName = ref(null);

  const isMounted = ref(false);
  const draggingCameraTeam = ref(null);

  // =========================================================================
  // 🏷️ 코드 접두사 + 약어 기반 해시태그(7종) 분류 헬퍼
  // =========================================================================
  const classifyEffectTag = (effectCode, shortName = '', fullName = '') => {
    const code = String(effectCode || '').trim().toUpperCase();
    const text = `${shortName} ${fullName}`.trim();

    if (code.startsWith('DGB')) return 'DMG_DEALT'; // #피해량
    if (code.startsWith('CCC') || code.startsWith('SYG')) return 'CC_SYNERGY'; // #CC&시너지
    if (code.startsWith('DOT')) return 'DAMAGE'; // #피해
    if (code.startsWith('SDB')) return 'DEBUFF'; // #디버프
    if (code.startsWith('UTC')) return 'UTIL'; // #유틸

    // STB (아군 스탯 버프): 치확&저항 / 피해 / 이외
    if (code.startsWith('STB')) {
      if (text.includes('확') || text.includes('저')) return 'CRIT_RES'; // #치확&저항
      if (text.includes('피')) return 'DAMAGE'; // #피해
      return 'ETC'; // #이외
    }

    // 코드가 비어있거나 예외 코드인 경우 텍스트 기반 폴백
    if (text.includes('확') || text.includes('저')) return 'CRIT_RES';
    if (text.includes('피')) return 'DAMAGE';
    return 'ETC';
  };

  const isEffectTagMode = computed(() => {
    return ['CRIT_RES', 'DAMAGE', 'ETC', 'DMG_DEALT', 'CC_SYNERGY', 'DEBUFF', 'UTIL'].includes(heroPoolFilter.value);
  });

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
      if (team && team.some(member => String(member.id || member.char_id).toUpperCase() === String(heroId).toUpperCase())) {
        return teamNo;
      }
    }
    return null;
  };

  const isHeroPlaced = (heroId) => {
    if (!heroId) return false;
    return placedHeroIds.value.has(String(heroId).toUpperCase());
  };

  // 등급별 필터링된 영웅 보관함
  const filteredHeroPool = computed(() => {
    let list = rawHeroList.value;
    if (!isEffectTagMode.value && heroPoolFilter.value !== 'ALL') {
      list = list.filter(h => h.grade === heroPoolFilter.value);
    }
    const q = heroSearchKeyword.value.trim().toLowerCase();
    if (q) {
      list = list.filter(h => (h.name || '').toLowerCase().includes(q));
    }
    return list;
  });

  // 해시태그별 그룹화된 영웅 보관함 (오른쪽 패널용 - 수치 포함)
  const groupedTagHeroes = computed(() => {
    if (!isEffectTagMode.value) return [];
    const query = heroSearchKeyword.value.trim().toLowerCase();
    if (!buffHeroPool.value || buffHeroPool.value.length === 0) return [];

    const formatEffectVal = (rawVal) => {
      if (rawVal === null || rawVal === undefined || rawVal === '') return '';
      const num = Number(rawVal);
      if (isNaN(num) || num <= 0) return '';
      return `${num}%`;
    };

    let pool = buffHeroPool.value;
    if (pool.length > 0 && !Array.isArray(pool[0].heroes)) {
      const map = new Map();
      pool.forEach(row => {
        const code = String(row.effect_code || row.effectCode || row.code_id || row.code || '').trim();
        const name = row.effect_name || row.effectName || row.code_name || row.name || '';
        const shortName = row.effect_name_short || row.effectNameShort || row.code_name_short || name;
        const type = row.effect_type || row.type || '';

        if (!map.has(code)) {
          map.set(code, { effectCode: code, effectName: name, effectNameShort: shortName, effectType: type, heroes: [] });
        }
        const g = map.get(code);
        const heroId = row.char_id || row.charId || row.id;
        const heroName = row.char_name || row.charName || row.name || '';
        if (heroId) {
          g.heroes.push({
            id: String(heroId),
            name: heroName,
            color: row.color || undefined,
            effectValue: formatEffectVal(row.effect_value ?? row.effectValue)
          });
        }
      });
      pool = Array.from(map.values());
    }

    return pool
      .map(group => {
        // 백엔드가 내려줄 수 있는 모든 코드/이름 키 대응
        const code = String(
          group.effectCode || group.effect_code || group.code_id || group.code || group.id || ''
        ).trim().toUpperCase();

        const effectName = group.effectName || group.effect_name || group.code_name || group.name || getCodeName(code) || '';
        const effectNameShort = group.effectNameShort || group.effect_name_short || group.code_name_short || getCodeName(code) || effectName;
        const tagKey = classifyEffectTag(code, effectNameShort, effectName);

        if (tagKey !== heroPoolFilter.value) return null;

        const normalizedHeroes = (group.heroes || []).map(h => ({
          ...h,
          id: String(h.id || h.char_id || h.charId),
          name: h.name || h.char_name || h.charName || '',
          effectValue: h.effectValue || formatEffectVal(h.effect_value ?? h.effectValue)
        }));

        const isEffectMatched = effectName.toLowerCase().includes(query) || effectNameShort.toLowerCase().includes(query);
        const matchedHeroes = normalizedHeroes.filter(h =>
          h.name.toLowerCase().includes(query)
        );

        if (query && !isEffectMatched && matchedHeroes.length === 0) return null;
        const heroesToDisplay = (query && !isEffectMatched) ? matchedHeroes : normalizedHeroes;

        return {
          ...group,
          effectCode: code,
          effectName,
          effectNameShort,
          tagKey,
          heroes: heroesToDisplay
        };
      })
      .filter(group => group && group.heroes && group.heroes.length > 0);
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

  const isSyncingEffects = ref(false);

  const syncCharEffects = async () => {
    if (isSyncingEffects.value) return;
    if (!confirm('skia_char_buff 기준으로 영웅 보관함 효과 데이터를 일괄 동기화하시겠습니까?\n(자동 동기화 항목은 최신 수치로 덮어씌워집니다.)')) {
      return;
    }

    try {
      isSyncingEffects.value = true;
      const response = await axios.post(`${BASE_URL}/api/admin/sync-char-effects`);
      if (response.data?.success) {
        alert(response.data.message || '동기화가 완료되었습니다.');
        await fetchBuffPool();
      } else {
        alert(response.data?.message || '동기화에 실패했습니다.');
      }
    } catch (error) {
      console.error('효과 데이터 동기화 오류:', error);
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      isSyncingEffects.value = false;
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

        const gridPos = getGridFromIndex(i);
        const row = gridPos.row;
        const col = isReverse ? (gridCols - 1 - gridPos.col) : gridPos.col;

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

  const onDrop = async (event, teamNo) => {
    activeStatusTab.value = teamNo;

    const refContainer = arenaRefs.value[teamNo];
    if (!refContainer) return;

    const containerRect = refContainer.getBoundingClientRect();
    const cellHeight = containerRect.height > 0 ? containerRect.height / gridRows : (cardHeight || 36);
    const cellWidth = containerRect.width > 0 ? containerRect.width / gridCols : (cardWidth || 36);

    const row = Math.max(0, Math.min(gridRows - 1, Math.floor((event.clientY - containerRect.top) / cellHeight)));
    const col = Math.max(0, Math.min(gridCols - 1, Math.floor((event.clientX - containerRect.left) / cellWidth)));

    const dragType = event.dataTransfer.getData('type');
    const sourceTeamNo = Number(event.dataTransfer.getData('teamNo'));

    if (dragType === 'camera' || draggingCameraTeam.value) {
      const currentTeam = sourceTeamNo || draggingCameraTeam.value;
      if (currentTeam !== teamNo) {
        draggingCameraTeam.value = null;
        return;
      }

      const colFromRight = (gridCols - 1) - col;
      const letterIndex = colFromRight * gridRows + row;
      const cameraChar = `#${String.fromCharCode(65 + letterIndex)}`;
      localCameraGridPositions.value[teamNo] = cameraChar;

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
        if (!masterCharData) return;

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

  // 하단 현황판 포커스 팀 & 해시태그 탭 상태
  const activeStatusTab = ref(1);
  const activeBoardType = ref('CRIT_RES'); // 'CRIT_RES', 'DAMAGE', 'ETC', 'DMG_DEALT', 'CC_SYNERGY', 'DEBUFF', 'UTIL', 'INFO'

  const selectStatusTeam = (teamNo) => {
    activeStatusTab.value = teamNo;
  };

  const getStatusTabLabel = computed(() => {
    if (activeStatusTab.value === '1_reverse') return '팀 1 (리버스)';
    return `팀 ${activeStatusTab.value}`;
  });

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

    let deckCode = gridCodeArray.join('');
    let rawPos = '';
    const deckData = selectedBoardDeck.value;

    if (deckData) {
      rawPos = deckData[`cameraPosition${teamNo}`] ||
               deckData[`camera_pos${teamNo}`] ||
               deckData[`cameraPosition`] ||
               deckData[`camera_pos`] || '';

      if (!rawPos) {
        const contentStr = deckData[`deck_content${teamNo}`] || deckData.deck_content1 || '';
        const match = String(contentStr).match(/#([A-Z])/i);
        if (match && match[1]) rawPos = match[1];
      }
    }

    if (rawPos) {
      const cameraLetter = String(rawPos).replace('#', '').trim().toUpperCase();
      if (cameraLetter) deckCode += `#${cameraLetter}`;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(deckCode);
        alert(`덱 코드가 복사되었습니다! (${deckCode})`);
      } else {
        copyToClipboardFallback(deckCode);
      }
    } catch (err) {
      copyToClipboardFallback(deckCode);
    }
  };

  const copyToClipboardFallback = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      if (document.execCommand('copy')) alert('덱 코드가 복사되었습니다!');
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
        newHero.grid = { col: reverseCol, row: reverseRow };
        const idx = getIndexFromGrid(reverseRow, reverseCol);
        if (idx >= 0 && idx < totalCells && newHero.id) {
          gridCodeArray[idx] = String(newHero.id).toUpperCase();
        }
      }
      return newHero;
    });

    teams.value['1_reverse'] = reverseTeamData;
    let deckCode = gridCodeArray.join('');

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
      if (cameraLetter) deckCode += `#${cameraLetter}`;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(deckCode);
      } else {
        copyToClipboardFallback(deckCode);
      }
      if (typeof calculateAllRanges === 'function') calculateAllRanges();
      alert(`팀 ${sourceTeamNo} 덱 복사! (${deckCode})`);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  // =========================================================================
  // 📊 하단 현황판용 효과 통합 집계 (7종 해시태그 기준 필터링)
  // =========================================================================
  const MASTER_ALL_EFFECT_CODES = [
    // 치확&저항 (STB)
    'STB07', 'STB09', 'STB10', 'STB17', 'STB13', 'STB18', 'STB19', 'STB11',
    // 피해 (STB + DOT)
    'STB08', 'STB22', 'STB12', 'STB24', 'STB16', 'STB21', 'STB14', 'STB20',
    'DOT01', 'DOT02', 'DOT03', 'DOT04', 'DOT05', 'DOT06',
    // 이외 (STB)
    'STB01', 'STB25', 'STB02', 'STB28', 'STB15', 'STB27', 'STB03', 'STB04', 'STB05', 'STB26', 'STB06', 'STB23',
    // 피해량 (DGB)
    'DGB01', 'DGB02', 'DGB03', 'DGB04', 'DGB05', 'DGB06', 'DGB07', 'DGB08', 'DGB09',
    'DGB10', 'DGB11', 'DGB12', 'DGB13', 'DGB14', 'DGB15', 'DGB16', 'DGB17', 'DGB18',
    'DGB19', 'DGB20', 'DGB21', 'DGB22', 'DGB23', 'DGB24', 'DGB25', 'DGB26', 'DGB31',
    // CC&시너지 (CCC + SYG)
    'SYG01', 'SYG02',
    'CCC01', 'CCC02', 'CCC03', 'CCC04', 'CCC05', 'CCC06', 'CCC07', 'CCC08',
    'CCC09', 'CCC10', 'CCC11', 'CCC12', 'CCC13', 'CCC14', 'CCC15',
    // 디버프 (SDB)
    'SDB08', 'SDB09', 'SDB12', 'SDB10', 'SDB24', 'SDB11', 'SDB07', 'SDB04', 'SDB13',
    'SDB19', 'SDB05', 'SDB16', 'SDB03', 'SDB06', 'SDB14', 'SDB21', 'SDB20', 'SDB17',
    'SDB02', 'SDB22', 'SDB15', 'SDB18', 'SDB23', 'SDB25', 'SDB30',
    // 유틸 (UTC)
    'UTC25', 'UTC26', 'UTC22', 'UTC28', 'UTC27', 'UTC29', 'UTC21', 'UTC24',
    'UTC01', 'UTC30', 'UTC02', 'UTC03', 'UTC23', 'UTC04', 'UTC05', 'UTC06', 'UTC07', 'UTC31',
    'UTC08', 'UTC09', 'UTC10', 'UTC11', 'UTC12', 'UTC13', 'UTC14', 'UTC15', 'UTC16', 'UTC17', 'UTC18', 'UTC19', 'UTC20'
  ];

  const allEffectGroupedList = computed(() => {
    const groups = {};

    MASTER_ALL_EFFECT_CODES.forEach(code => {
      const nameShort = getCodeName(code);
      groups[code] = {
        effectCode: code,
        effectNameShort: nameShort,
        effectName: nameShort,
        tagKey: classifyEffectTag(code, nameShort, nameShort),
        sources: []
      };
    });

    [1, 2, 3, '1_reverse'].forEach(teamNo => {
      if (!teams.value || !teams.value[teamNo]) return;
      teams.value[teamNo].forEach(char => {
        if (!char.grid || !char.buffs) return;
        Object.values(char.buffs).forEach(buff => {
          if (!buff) return;
          const code = String(buff.effect_code || '').trim().toUpperCase();
          if (!code) return;

          // 아군 적용 버프(TGT02)이거나 적군 디버프/상태이상(SDB/DOT/CCC/디버프)인 경우 집계
          const isDebuffCode = code.startsWith('SDB') || code.startsWith('DOT') || code.startsWith('CCC') || buff.effect_type === '디버프';
          const isTeamBuff = buff.target_code === 'TGT02' || code.startsWith('STB') || code.startsWith('DGB') || code.startsWith('SYG') || code.startsWith('UTC');

          if (!isDebuffCode && !isTeamBuff) return;

          if (!groups[code]) {
            const shortName = getCodeName(code);
            groups[code] = {
              effectCode: code,
              effectNameShort: buff.effect_code_name_short || shortName || code,
              effectName: buff.effect_code_name || buff.name || shortName || code,
              tagKey: classifyEffectTag(code, buff.effect_code_name_short || shortName, buff.effect_code_name || buff.name),
              sources: []
            };
          }

          const skillLabel = buff.skill_code === 'SKI01' ? 'N' : buff.skill_code === 'SKI02' ? 'C' : 'A';
          groups[code].sources.push({
            teamNo,
            charName: char.name,
            charValue: buff.effect_value || '0',
            skillDesc: skillLabel
          });
        });
      });
    });

    const result = [];
    MASTER_ALL_EFFECT_CODES.forEach(code => {
      if (groups[code]) {
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

  // 선택된 팀(activeStatusTab) + 선택된 해시태그(activeBoardType)에 맞는 현황판 아이템 목록
  const filteredBoardEffectList = computed(() => {
    if (activeBoardType.value === 'INFO') return [];
    return allEffectGroupedList.value
      .filter(g => g.tagKey === activeBoardType.value)
      .map(g => {
        const src = g.sources.filter(s => String(s.teamNo) === String(activeStatusTab.value));
        const sortedSrc = [...src].sort((a, b) => parseValueStr(b.charValue) - parseValueStr(a.charValue));
        return { ...g, sources: sortedSrc };
      });
  });

  function getArcPath(x, y, radius, startAngle, endAngle) {
    const numX = Number(x);
    const numY = Number(y);
    const numRad = Number(radius);
    const numStart = Number(startAngle);
    const numEnd = Number(endAngle);

    if (isNaN(numX) || isNaN(numY) || isNaN(numRad) || isNaN(numStart) || isNaN(numEnd) || numRad <= 0) {
      return '';
    }

    const startRad = (numStart * Math.PI) / 180;
    const endRad = (numEnd * Math.PI) / 180;

    const x1 = numX + numRad * Math.cos(startRad);
    const y1 = numY + numRad * Math.sin(startRad);
    const x2 = numX + numRad * Math.cos(endRad);
    const y2 = numY + numRad * Math.sin(endRad);

    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return '';

    const largeArcFlag = numEnd - numStart <= 180 ? "0" : "1";
    return `M ${numX} ${numY} L ${x1} ${y1} A ${numRad} ${numRad} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  }

  const computedRanges = ref({ 1: [], 2: [], 3: [] });

  const calculateAllRanges = async () => {
    await nextTick();
    if (!isMounted.value) return;

    const teamKeys = ['1', '2', '3', '1_reverse'];
    const newComputedRanges = {};

    teamKeys.forEach(teamNo => {
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

        const startX = Number((char.grid.col * cellWidth) + (cellWidth / 2));
        const startY = Number((char.grid.row * cellHeight) + (cellHeight / 2));
        if (isNaN(startX) || isNaN(startY)) return null;

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

        if (rDetail.includes('자신') || rDetail.includes('후방') || rType.includes('자신')) {
          centerX = startX;
          centerY = startY;
        }

        if (isNaN(centerX)) centerX = endX;
        if (isNaN(centerY)) centerY = endY;

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
        } else if (isSector) {
          shape = '부채꼴';
          const meter = extractMeter(rDetail) || 3;
          radius = meter * meterToPx;
          const startAngle = isReverse ? 150 : -30;
          const endAngle = isReverse ? 210 : 30;
          pathD = (radius > 0) ? getArcPath(centerX, centerY, radius, startAngle, endAngle) : '';
        } else if (isRect) {
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
        } else {
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

  const localCameraGridPositions = ref({});

  const teamCameraGridPositions = computed(() => {
    const result = {};
    const deckData = selectedBoardDeck.value;
    if (!deckData) return result;

    [1, 2, 3].forEach(teamNo => {
      let rawPos = localCameraGridPositions.value[teamNo] || '';
      if (!rawPos && deckData) {
        rawPos = deckData[`cameraPosition${teamNo}`] || deckData[`camera_pos${teamNo}`] || '';
        if (!rawPos) {
          const contentStr = deckData[`deck_content${teamNo}`] || '';
          const match = String(contentStr).match(/#([A-Y])/i);
          if (match && match[1]) rawPos = match[1];
        }
        if (!rawPos && teamNo === 1) {
          rawPos = deckData.cameraPosition || deckData.camera_pos || '';
        }
      }

      if (!rawPos) return;
      const pos = String(rawPos).replace('#', '').trim().toUpperCase();
      if (!pos) return;

      const letterIndex = pos.charCodeAt(0) - 65;
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

  // 캐릭터 상세 정보
  const selectedHeroDetailRaw = ref(null);
  const isLoadingHeroDetail = ref(false);

  const selectedHeroDetail = computed(() => {
    if (!selectedHeroDetailRaw.value) return null;

    const rawBuffs = selectedHeroDetailRaw.value.buffs || [];
    const { buffs, ...heroBase } = selectedHeroDetailRaw.value;

    const findBuff = (skillCode, effectCode) => {
      return rawBuffs.find(b => {
        const matchSkill = String(b.skill_code || '').trim().toUpperCase() === skillCode.toUpperCase();
        if (!effectCode) return matchSkill;
        const matchEffect = String(b.effect_code || '').trim().toUpperCase() === effectCode.toUpperCase();
        return matchSkill && matchEffect;
      });
    };

    const normalSkill = findBuff('SKI01') || {};
    const critSkillSdc02 = findBuff('SKI02', 'SDC02');
    const critSkillBase = findBuff('SKI02') || {};
    const activeSkillSdc01 = findBuff('SKI03', 'SDC01');
    const activeSkillBase = findBuff('SKI03') || {};

    const formatArea = (skill) => {
      if (!skill) return '-';
      if (skill.range_x && skill.range_y) return `${skill.range_x}m*${skill.range_y}m`;
      if (skill.range_detail && String(skill.range_detail).trim() !== '') return skill.range_detail;
      return '-';
    };

    const critName = critSkillSdc02 ? (critSkillSdc02.effect_code_name || critSkillSdc02.buff_name || critSkillSdc02.name || '') : '';
    const critVal = critSkillSdc02 && critSkillSdc02.effect_value ? `${critSkillSdc02.effect_value}${critSkillSdc02.unit || '%'}` : '-';
    const critMaxDmg = critSkillSdc02 ? (critSkillSdc02.calculated_value || (critSkillSdc02.effect_value ? `${critSkillSdc02.effect_value}${critSkillSdc02.unit || '%'}` : '-')) : '-';
    const critRange = (critSkillBase.range !== null && critSkillBase.range !== undefined) ? `${critSkillBase.range}` : '-';

    const activeName = activeSkillSdc01 ? (activeSkillSdc01.effect_code_name || activeSkillSdc01.buff_name || activeSkillSdc01.name || '') : '-';
    const activeVal = activeSkillSdc01 && activeSkillSdc01.effect_value ? `${activeSkillSdc01.effect_value}${activeSkillSdc01.unit || '%'}` : '-';
    const activeMaxDmg = activeSkillSdc01 ? (activeSkillSdc01.calculated_value || (activeSkillSdc01.effect_value ? `${activeSkillSdc01.effect_value}${activeSkillSdc01.unit || '%'}` : '-')) : '-';

    return {
      ...heroBase,
      buffs: rawBuffs,
      normal_damage_name: normalSkill.effect_code_name || normalSkill.buff_name || '',
      normal_damage: normalSkill.calculated_value || (normalSkill.effect_value ? `${normalSkill.effect_value}${normalSkill.unit || '%'}` : '0%'),
      critSdc02_damage_name: critName,
      critSdc02_value: critVal,
      critSdc02_damage: critMaxDmg,
      critSdc02_range: critRange,
      activeSdc01_skill_name: activeName,
      activeSdc01_effect_value: activeVal,
      activeSdc01_damage: activeMaxDmg,
      activeSdc01_shape: activeSkillBase.range_type || activeSkillBase.range_shape || '-',
      activeSdc01_area: formatArea(activeSkillBase),
      activeSdc01_range: (activeSkillBase.range !== null && activeSkillBase.range !== undefined) ? `${activeSkillBase.range}` : '-',
      activeSdc01_cooldown: (activeSkillBase.cooldown !== null && activeSkillBase.cooldown !== undefined) ? `${activeSkillBase.cooldown}초` : '-'
    };
  });

  const fetchHeroDetail = async (charId) => {
    if (!charId) {
      selectedHeroDetailRaw.value = null;
      return;
    }
    try {
      isLoadingHeroDetail.value = true;
      const response = await axios.get(`${BASE_URL}/api/chars/detail/${charId}`);
      selectedHeroDetailRaw.value = response.data;
    } catch (error) {
      console.error('캐릭터 상세 정보 로드 실패:', error);
      selectedHeroDetailRaw.value = null;
    } finally {
      isLoadingHeroDetail.value = false;
    }
  };

  watch(() => selectedHeroName.value, (newHeroName) => {
    if (newHeroName) {
      const targetHero = rawHeroList.value.find(h => h.name === newHeroName || h.id === newHeroName)
                      || filteredHeroPool.value.find(h => h.name === newHeroName || h.id === newHeroName);
      if (targetHero && targetHero.id) {
        fetchHeroDetail(targetHero.id);
      }
    } else {
      selectedHeroDetailRaw.value = null;
    }
  });

  const getBuffsByCategory = (categoryType) => {
    if (!selectedHeroDetailRaw.value || !selectedHeroDetailRaw.value.buffs) return [];
    return selectedHeroDetailRaw.value.buffs.filter(b => {
      const isDebuff = b.effect_type === '디버프' ||
                       (b.effect_code && (b.effect_code.startsWith('SDB') || b.effect_code.startsWith('DOT') || b.effect_code.startsWith('CCC')));
      const target = String(b.target_type || b.target_code || '');
      const isTeam = (target.includes('아군') || target === 'TGT02') && !isDebuff;
      const isSelf = (target.includes('자신') || target === 'TGT01' || target === 'TPC02' || target === 'TGT03' || target === 'TGT04') && !isDebuff && !isTeam;

      if (categoryType === 'DEBUFF') return isDebuff;
      if (categoryType === 'SELF_BUFF') return isSelf;
      if (categoryType === 'TEAM_BUFF') return isTeam;
      return false;
    });
  };

  const handleHeroSelect = (char, teamNo = null) => {
    if (teamNo !== null) {
      activeStatusTab.value = teamNo;
    }
    selectHero(char);
  };

  onMounted(async () => {
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
      localCameraGridPositions.value = {};
      if (!isMounted.value || !newVal) {
        cameraPositions.value = {};
        return;
      }
      await loadSelectedBoardDeck();
    },
    { immediate: true }
  );

  return {
    isAdmin,
    isSyncingEffects,
    syncCharEffects,
    isPoolCollapsed,
    selectedBoardDeck,
    boardDecks,
    selectedSkillClass,
    arenaRefs,
    setArenaRef,
    rawHeroList,
    buffHeroPool,
    heroPoolFilter,
    isEffectTagMode,
    heroSearchKeyword,
    teams,
    commonCodes,
    selectedHeroName,
    selectHero,
    activeChars,
    getTeamCharCount,
    getAssignedTeam,
    isHeroPlaced,
    filteredHeroPool,
    groupedTagHeroes,
    loadSelectedBoardDeck,
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
    selectStatusTeam,
    activeBoardType,
    getStatusTabLabel,
    getHeroImage,
    handleImageError,
    copyTeamDeckCode,
    copyToReverseTeam,
    filteredBoardEffectList,
    cameraPositions,
    selectedHeroDetail,
    isLoadingHeroDetail,
    handleHeroSelect,
    getBuffsByCategory
  };
}