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
  const selectedSkillClass = ref(initialSkillClass);
  const arenaRefs = ref({});
  const setArenaRef = (el, teamNo) => { if (el) arenaRefs.value[teamNo] = el; };
  const draggingChar = ref(null);
  const draggingFromTeam = ref(null);
  const rawHeroList = ref([]);
  const buffHeroPool = ref([]);
  const heroGradeFilter = ref('BUFF_LIST');
  const heroSearchKeyword = ref('');
  const teams = ref({ 1: [], 2: [], 3: [] });
  const commonCodes = ref([]);
  const selectedHeroName = ref(null);

  const showBuffModal = ref(false);
  const isEditing = ref(false);
  const skiaCharEffects = ref([]);
  const buffForm = ref({ effect_seq: null, effect_code: '', char_id: '', rank_score: 1 });
  const effectSearchText = ref('');
  const heroSearchText = ref('');

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
    [1, 2, 3].forEach(teamNo => {
      (teams.value[teamNo] || []).forEach(char => {
        const id = char.id || char.char_id;
        if (char.grid && id) ids.add(String(id).toUpperCase());
      });
    });
    return ids;
  });

  const getAssignedTeam = (heroId) => {
    if (!heroId) return null;
    for (let teamNo = 1; teamNo <= 3; teamNo++) {
      const team = teams.value[teamNo];
      if (team && team.some(member => String(member.id || member.char_id) === String(heroId))) {
        return teamNo;
      }
    }
    return null;
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

    return buffHeroPool.value
      .map(group => {
        const isEffectMatched = group.effectName?.toLowerCase().includes(query);
        const matchedHeroes = (group.heroes || []).filter(h => h.name?.toLowerCase().includes(query));
        if (query && !isEffectMatched && matchedHeroes.length === 0) return null;
        const heroesToDisplay = (query && !isEffectMatched) ? matchedHeroes : (group.heroes || []);
        const isDebuff = group.effectType === '디버프' || group.effect_type === '디버프' || group.isDebuff === true;
        return { ...group, effectType: isDebuff ? '디버프' : '버프', heroes: heroesToDisplay };
      })
      .filter(group => group && group.heroes.length > 0)
      .filter(group => {
        if (buffSubFilter.value === 'BUFF') return group.effectType === '버프';
        if (buffSubFilter.value === 'DEBUFF') return group.effectType === '디버프';
        return true;
      })
      .sort((a, b) => {
        if (a.effectType !== b.effectType) return a.effectType === '버프' ? -1 : 1;
        return 0;
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

  const getGridFromIndex = (i) => ({ row: i % gridRows, col: (gridCols - 1) - Math.floor(i / gridRows) });
  const getIndexFromGrid = (row, col) => (gridCols - 1 - col) * gridRows + row;

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
      const refContainer = arenaRefs.value[teamNo];
      if (!refContainer) return [];

      const containerRect = refContainer.getBoundingClientRect();
      const cellHeight = containerRect.height / gridRows;
      const cellWidth = containerRect.width / gridCols;
      const parsedList = [];

      for (let i = 0; i < maxSlotCount; i++) {
        const charId = slots[i];
        if (!charId) continue;
        const baseCharData = dbCharsMap.get(charId) || { id: charId, name: '미등록', color: '#94a3b8', skills: {}, buffs: {} };
        const { row, col } = getGridFromIndex(i);

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
    if (!selectedBoardDeck.value) return;
    selectedHeroName.value = null;
    const { deck_content1, deck_content2, deck_content3 } = selectedBoardDeck.value;
    teams.value[1] = await handleDeckCodeParse(deck_content1, 1);
    teams.value[2] = await handleDeckCodeParse(deck_content2, 2);
    teams.value[3] = await handleDeckCodeParse(deck_content3, 3);
    await nextTick();
    calculateAllRanges();
  };

  const computedRanges = ref({ 1: [], 2: [], 3: [] });
  const calculateAllRanges = async () => {
    await nextTick();
    [1, 2, 3].forEach(teamNo => {
      const refContainer = arenaRefs.value[teamNo];
      if (!refContainer) {
        computedRanges.value[teamNo] = [];
        return;
      }

      const containerRect = refContainer.getBoundingClientRect();
      const cellHeight = containerRect.height / gridRows;
      const cellWidth = containerRect.width / gridCols;
      const widthOffset = containerRect.width;

      computedRanges.value[teamNo] = (teams.value[teamNo] || []).map(char => {
        if (!char.grid) return null;

        const startX = (char.grid.col * cellWidth) + (cellWidth / 2);
        const startY = (char.grid.row * cellHeight) + (cellHeight / 2);
        const currentSkillKey = selectedSkillClass.value;
        const totalSkills = char.skills || {};
        const skillNode = totalSkills[currentSkillKey] || {};

        let baseRange = 3.0;
        if (typeof skillNode === 'number') {
          baseRange = skillNode;
        } else if (skillNode.range) {
          baseRange = parseFloat(skillNode.range);
        } else if (typeof totalSkills['일반공격'] === 'number') {
          baseRange = totalSkills['일반공격'];
        } else if (totalSkills['일반공격']?.range) {
          baseRange = parseFloat(totalSkills['일반공격'].range);
        }

        const globalScaleMultiplier = 1 / 30;
        const attackRange = baseRange >= 10
          ? baseRange * cellWidth * globalScaleMultiplier
          : (baseRange * 10) * cellWidth * globalScaleMultiplier;
        const endX = startX + attackRange;
        const endY = startY;

        let shape = '단일';
        let radius = 0;
        let rectWidth = 0;
        let rectHeight = 0;
        let centerX = endX;
        let centerY = endY;
        const activeScale = cellWidth * 10 * globalScaleMultiplier;

        const rType = String(skillNode.range_type || skillNode.shape || char.buffs?.['액티브공격']?.range_type || '').toLowerCase();
        const rDetail = String(skillNode.range_detail || skillNode.detail || char.buffs?.['액티브공격']?.range_detail || '').toLowerCase();

        if (rDetail.includes('자신') || rType.includes('자신')) {
          centerX = startX;
          centerY = startY;
        }

        if (rType.includes('부채꼴') || rType.includes('반원') || rDetail.includes('부채꼴') || rDetail.includes('반원')) {
          shape = '부채꼴';
          const meter = parseMeterValue(rDetail, '전방') || parseMeterValue(rDetail, 'm') || 10;
          radius = (meter * activeScale) * 0.5;
        } else if (rType.includes('원') || rDetail.includes('주변') || rDetail.includes('지정 범위') || rDetail.includes('범위적')) {
          shape = '원';
          const meter = parseMeterValue(rDetail, '주변') || parseMeterValue(rDetail, '범위') || parseMeterValue(rDetail, 'm') || 5;
          radius = (meter * activeScale) * 0.5;
        } else if (rType.includes('사각형') || rType.includes('직선') || rDetail.includes('폭') || rDetail.includes('길이')) {
          shape = '사각형';
          const wMeter = parseMeterValue(rDetail, '길이') || parseMeterValue(rDetail, 'm') || 6;
          const hMeter = parseMeterValue(rDetail, '폭') || 4;
          rectWidth = (wMeter * activeScale) * 0.5;
          rectHeight = (hMeter * activeScale) * 0.5;
        }

        return {
          instanceId: char.instanceId,
          name: char.name,
          color: char.color || '#3b82f6',
          startX,
          startY,
          endX,
          endY,
          shape,
          radius,
          width: rectWidth,
          height: rectHeight,
          drawX: centerX,
          drawY: centerY,
          bossStartX: startX - widthOffset,
          bossEndX: endX - widthOffset,
          bossDrawX: centerX - widthOffset
        };
      }).filter(Boolean);
    });
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
    const refContainer = arenaRefs.value[teamNo];
    if (!refContainer) return;

    const containerRect = refContainer.getBoundingClientRect();
    const cellHeight = containerRect.height / gridRows;
    const cellWidth = containerRect.width / gridCols;

    const row = Math.max(0, Math.min(gridRows - 1, Math.floor((event.clientY - containerRect.top) / cellHeight)));
    const col = Math.max(0, Math.min(gridCols - 1, Math.floor((event.clientX - containerRect.left) / cellWidth)));

    if ((teams.value[teamNo] || []).some(c => c.grid?.row === row && c.grid?.col === col)) return;

    const isHeroAlreadyInAnyTeam = (charId) => {
      const targetId = String(charId).toUpperCase();
      return [1, 2, 3].some(tNo => (teams.value[tNo] || []).some(c => String(c.id || c.char_id).toUpperCase() === targetId));
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
      const isCrossTeamMove = Number(draggingFromTeam.value) !== Number(teamNo);

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
    (teams.value[teamNo] || []).forEach(char => {
      if (char.grid && char.id) {
        const idx = getIndexFromGrid(char.grid.row, char.grid.col);
        if (idx >= 0 && idx < gridRows * gridCols) gridCodeArray[idx] = String(char.id).toUpperCase();
      }
    });
    try { await navigator.clipboard.writeText(gridCodeArray.join('')); } catch (err) {}
  };

  const resetBuffForm = () => {
    isEditing.value = false;
    effectSearchText.value = '';
    heroSearchText.value = '';
    buffForm.value = { effect_seq: null, effect_code: '', char_id: '', rank_score: 1 };
  };

  const openBuffModal = async () => {
    showBuffModal.value = true;
    await fetchCommonCodes();
    await fetchSkiaCharEffects();
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

  const deleteCharEffect = async (seq) => {
    if (!confirm('삭제하시겠습니까?')) return;
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

  const displayedEffects = computed(() => {
    const q = effectSearchText.value.trim();
    if (!q) return skiaCharEffects.value;
    const ids = commonCodes.value.filter(c => c.code_name.includes(q) || c.code_id.includes(q)).map(c => c.code_id);
    return skiaCharEffects.value.filter(i => i && ids.includes(i.effect_code));
  });

  const MASTER_EFFECT_ORDER = [
    'UTC25', 'UTC26',
    'STB07', 'STB08', 'STB22', 'STB01', 'STB25',
    'STB10', 'STB12', 'STB24', 'STB13', 'STB16', 'STB21',
    'STB03', 'STB05', 'STB26', 'STB19', 'SDB03', 'STB14',
    'SDB10', 'CCC10', 'SDB07', 'SYG01', 'SYG02'
  ];

  const getSortPriority = (code, dbSortOrder) => {
    const masterIndex = MASTER_EFFECT_ORDER.indexOf(code);
    const primaryOrder = masterIndex !== -1 ? masterIndex : 9999;
    const secondaryOrder = dbSortOrder ?? 9999;
    return { primaryOrder, secondaryOrder };
  };

  const parseValueStr = (valueStr) => {
    if (!valueStr) return 0;
    const numericStr = String(valueStr).replace(/[^0-9.]/g, '');
    return numericStr ? parseFloat(numericStr) : 0;
  };

  const effectGroupedList = computed(() => {
    const groups = {};
    [1, 2, 3].forEach(teamNo => {
      if (!teams.value[teamNo]) return;
      teams.value[teamNo].forEach(char => {
        if (!char.grid || !char.buffs) return;
        Object.values(char.buffs).forEach(buff => {
          if (buff && buff.target_code === 'TGT02') {
            const code = buff.effect_code || 'NONE';
            if (!groups[code]) {
              const { primaryOrder, secondaryOrder } = getSortPriority(code, buff.sort_order);
              groups[code] = {
                effectCode: code,
                effectNameShort: buff.effect_code_name_short || buff.name || '기타 효과',
                effectName: buff.effect_code_name || buff.name || '기타 효과',
                primaryOrder,
                secondaryOrder,
                sources: []
              };
            }
            let skillLabel = buff.skill_code === 'SKI01' ? 'N' : buff.skill_code === 'SKI02' ? 'C' : 'A';
            groups[code].sources.push({ teamNo, charName: char.name, charValue: buff.effect_value || '0', skillDesc: skillLabel });
          }
        });
      });
    });

    return Object.values(groups).sort((a, b) => {
      if (a.primaryOrder !== b.primaryOrder) return a.primaryOrder - b.primaryOrder;
      return a.secondaryOrder - b.secondaryOrder;
    });
  });

  const debuffGroupedList = computed(() => {
    const groups = {};
    [1, 2, 3].forEach(teamNo => {
      if (!teams.value[teamNo]) return;
      teams.value[teamNo].forEach(char => {
        if (!char.grid || !char.buffs) return;
        Object.values(char.buffs).forEach(buff => {
          if (buff && buff.effect_type === '디버프') {
            const code = buff.effect_code || 'NONE';
            if (!groups[code]) {
              const { primaryOrder, secondaryOrder } = getSortPriority(code, buff.sort_order);
              groups[code] = {
                effectCode: code,
                effectNameShort: buff.effect_code_name_short || '기타 디버프',
                effectName: buff.effect_code_name || buff.name || '기타 효과',
                primaryOrder,
                secondaryOrder,
                sources: []
              };
            }
            let skillLabel = buff.skill_code === 'SKI01' ? 'N' : buff.skill_code === 'SKI02' ? 'C' : 'A';
            groups[code].sources.push({ teamNo, charName: char.name, charValue: buff.effect_value || '0', skillDesc: skillLabel });
          }
        });
      });
    });

    return Object.values(groups).sort((a, b) => {
      if (a.primaryOrder !== b.primaryOrder) return a.primaryOrder - b.primaryOrder;
      return a.secondaryOrder - b.secondaryOrder;
    });
  });

  const filteredEffectGroupedList = computed(() => {
    return effectGroupedList.value.map(g => {
      const src = g.sources.filter(s => s.teamNo === activeStatusTab.value);
      if (!src.length) return null;
      const sortedSrc = [...src].sort((a, b) => parseValueStr(b.charValue) - parseValueStr(a.charValue));
      return { ...g, sources: sortedSrc };
    }).filter(Boolean);
  });

  const filteredDebuffGroupedList = computed(() => {
    return debuffGroupedList.value.map(g => {
      const src = g.sources.filter(s => s.teamNo === activeStatusTab.value);
      if (!src.length) return null;
      const sortedSrc = [...src].sort((a, b) => parseValueStr(b.charValue) - parseValueStr(a.charValue));
      return { ...g, sources: sortedSrc };
    }).filter(Boolean);
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
    const col = (gridCols - 1) - Math.floor(emptySlotIndex / gridRows);
    const row = emptySlotIndex % gridRows;
    handleGridUpdate(targetTeam, row, col, hero.id);
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
    if (prefetchCommonCodes) await fetchCommonCodes();
    await fetchBoardDecks();
    await fetchAllHeroPool();
    await fetchBuffPool();
    await checkAdminAuth();
  });

  watch(
    [selectedSkillClass, () => teams.value],
    async () => {
      await nextTick();
      calculateAllRanges();
    },
    { deep: true, immediate: true }
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
    removeHero,
    clearTeam,
    activeStatusTab,
    activeBoardType,
    getStatusTabLabel,
    getHeroImage,
    handleImageError,
    copyTeamDeckCode,
    openBuffModal,
    closeBuffModal,
    resetBuffForm,
    saveCharEffect,
    editCharEffect,
    deleteCharEffect,
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
    BASE_URL,
    maxTeamMembers,
    gridRows,
    gridCols
  };
}