<template>
  작업중 20261111~
  <div class="skia-char-info-wrapper">
    <!-- 상단 메인 탭 (신규영웅 / 영웅비교) -->
    <div class="main-tab-bar">
      <button 
        :class="['main-tab-btn', { active: activeDetailTab === 'new' }]" 
        @click="activeDetailTab = 'new'"
      >
        ✨ 신규영웅 (MR / MQ / MP)
      </button>
      <button 
        :class="['main-tab-btn', { active: activeDetailTab === 'compare' }]" 
        @click="activeDetailTab = 'compare'"
      >
        ⚔️ 영웅비교 (선택형 3종)
      </button>
    </div>

    <!-- ================= [1] TAB: 신규영웅 (MR, MQ, MP 1x3 디스플레이) ================= -->
    <div v-if="activeDetailTab === 'new'" class="horizontal-3col-board">
      <div 
        v-for="code in targetDeckCodes" 
        :key="code" 
        class="info-section-wrapper compact-section hero-card-column"
      >
        <div class="section-title-bar">
          <h3>캐릭터 버프 상세 정보</h3>
          <span class="info-badge">ID: {{ code }}</span>
        </div>
        
        <div class="vertical-scroll-board p-2">
          <!-- 데이터 존재 시 -->
          <div v-if="getHeroDetailByCode(code)" class="hero-detail-container">
            
            <!-- 상단 프로필 헤더 -->
            <div class="profile-header-card">
              <div class="profile-avatar-box">
                <img 
                  :src="getHeroImage(getHeroDetailByCode(code).id)" 
                  @error="handleImageError" 
                  class="hero-detail-avatar" 
                  :alt="getHeroDetailByCode(code).name"
                />
                <div class="hero-header-text">
                  <h4 class="hero-detail-title">{{ getHeroDetailByCode(code).name }}</h4>
                  <span class="hero-detail-code">ID: {{ code }}</span>
                </div>
              </div>
            </div>

            <!-- 기본 스킬/공격 정보 카드 -->
            <div class="effect-group-box info-group">
              <div class="buff-card-list">
                
                <!-- 1. 일반공격 -->
                <div class="buff-item-card card-info fit-card">
                  <div class="fit-row">
                    <div class="fit-left">
                      <span class="slim-label-box">일반</span>
                      <span class="buff-name text-truncate">
                        {{ getHeroDetailByCode(code).normal_damage_name || '공격력피해량' }}
                      </span>
                    </div>
                    <div class="fit-right">
                      <span class="buff-val text-yellow">
                        {{ getHeroDetailByCode(code).normal_damage }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 2. 치명타공격 -->
                <div class="buff-item-card card-info fit-card">
                  <div class="fit-row">
                    <div class="fit-left">
                      <span class="slim-label-box label-crit">치명타</span>
                      <span class="buff-name text-truncate">
                        {{ getHeroDetailByCode(code).critSdc02_damage_name || '치명타피해량' }}
                      </span>
                    </div>
                    <div class="fit-right">
                      <span class="buff-val text-yellow">
                        {{ getHeroDetailByCode(code).critSdc02_value }}
                      </span>
                      <span 
                        v-if="getHeroDetailByCode(code).critSdc02_damage && getHeroDetailByCode(code).critSdc02_damage !== '0%' && getHeroDetailByCode(code).critSdc02_damage !== '-'" 
                        class="buff-max-badge-sm"
                      >
                        MAX {{ getHeroDetailByCode(code).critSdc02_damage }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 3. 액티브스킬 -->
                <div class="buff-item-card card-info card-active-skill fit-card">
                  <div class="fit-row">
                    <div class="fit-left">
                      <span class="slim-label-box label-active">액티브</span>
                      <span class="buff-name text-truncate">{{ getHeroDetailByCode(code).activeSdc01_skill_name || '공격력피해량' }}</span>
                    </div>
                    <div class="fit-right">
                      <span class="buff-val text-red-main">{{ getHeroDetailByCode(code).activeSdc01_effect_value }}</span>
                      <template v-if="getHeroDetailByCode(code).activeSdc01_damage && getHeroDetailByCode(code).activeSdc01_damage !== '-' && getHeroDetailByCode(code).activeSdc01_damage !== getHeroDetailByCode(code).activeSdc01_effect_value">
                        <span class="buff-max-badge-sm">
                          MAX {{ getHeroDetailByCode(code).activeSdc01_damage }}
                        </span>
                      </template>
                    </div>
                  </div>

                  <!-- 액티브 하단 태그 -->
                  <div v-if="getHeroDetailByCode(code).activeSdc01_shape !== '-' || getHeroDetailByCode(code).activeSdc01_area !== '-'" class="info-row-secondary fit-meta">
                    <span v-if="getHeroDetailByCode(code).activeSdc01_shape !== '-'" class="meta-tag">{{ getHeroDetailByCode(code).activeSdc01_shape }}</span>
                    <span v-if="getHeroDetailByCode(code).activeSdc01_area !== '-'" class="meta-tag area-tag text-truncate">{{ getHeroDetailByCode(code).activeSdc01_area }}</span>
                  </div>
                </div>

              </div>
            </div>

            <!-- 버프/디버프 목록 -->
            <div class="hero-buff-list-box mt-2">                
              <div v-if="getHeroDetailByCode(code).buffs && getHeroDetailByCode(code).buffs.length > 0" class="buff-category-wrapper">
                
                <!-- 자신 버프 -->
                <div v-if="filterBuffs(getHeroDetailByCode(code).buffs, 'SELF_BUFF').length > 0" class="effect-group-box self-group">
                  <div class="group-header-label text-self">👤 자신 버프</div>
                  <div class="buff-card-list">
                    <div v-for="b in filterBuffs(getHeroDetailByCode(code).buffs, 'SELF_BUFF')" :key="b.buff_seq" class="buff-item-card card-self compact-buff-item">
                      <div class="buff-item-left">
                        <span class="skill-type-badge" :class="b.skill_code === 'SKI02' ? 'badge-crit' : b.skill_code === 'SKI01' ? 'badge-normal' : 'badge-active'">
                          {{ b.skill_code === 'SKI02' ? 'C' : b.skill_code === 'SKI01' ? 'N' : 'A' }}
                        </span>
                        <span class="buff-name text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                      </div>
                      <div class="buff-item-right">
                        <span class="buff-val-sm">{{ b.effect_value }}{{ b.unit || '%' }}</span>
                        <span v-if="b.duration" class="sub-info-sm">지속: {{ b.duration }}s</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 아군 버프 -->
                <div v-if="filterBuffs(getHeroDetailByCode(code).buffs, 'TEAM_BUFF').length > 0" class="effect-group-box team-group">
                  <div class="group-header-label text-team">🛡️ 아군 버프</div>
                  <div class="buff-card-list">
                    <div v-for="b in filterBuffs(getHeroDetailByCode(code).buffs, 'TEAM_BUFF')" :key="b.buff_seq" class="buff-item-card card-team compact-buff-item">
                      <div class="buff-item-left">
                        <span class="skill-type-badge" :class="b.skill_code === 'SKI02' ? 'badge-crit' : b.skill_code === 'SKI01' ? 'badge-normal' : 'badge-active'">
                          {{ b.skill_code === 'SKI02' ? 'C' : b.skill_code === 'SKI01' ? 'N' : 'A' }}
                        </span>
                        <span class="buff-name text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                      </div>
                      <div class="buff-item-right">
                        <span class="buff-val-sm text-green">{{ b.effect_value }}{{ b.unit || '%' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 적군 디버프 -->
                <div v-if="filterBuffs(getHeroDetailByCode(code).buffs, 'DEBUFF').length > 0" class="effect-group-box debuff-group">
                  <div class="group-header-label text-debuff">⚔️ 적군 디버프</div>
                  <div class="buff-card-list">
                    <div v-for="b in filterBuffs(getHeroDetailByCode(code).buffs, 'DEBUFF')" :key="b.buff_seq" class="buff-item-card card-debuff compact-buff-item">
                      <div class="buff-item-left">
                        <span class="skill-type-badge" :class="b.skill_code === 'SKI02' ? 'badge-crit' : b.skill_code === 'SKI01' ? 'badge-normal' : 'badge-active'">
                          {{ b.skill_code === 'SKI02' ? 'C' : b.skill_code === 'SKI01' ? 'N' : 'A' }}
                        </span>
                        <span class="buff-name text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                      </div>
                      <div class="buff-item-right">
                        <span class="buff-val-sm text-red">{{ b.effect_value }}{{ b.unit || '%' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              <div v-else class="empty-text">- 등록된 스킬/버프 정보가 없습니다. -</div>
            </div>

          </div>

          <div v-else class="empty-status-alert compact-alert">
            {{ loadingMap[code] ? '캐릭터 정보 조회 중...' : `ID: [${code}] 캐릭터 데이터를 불러올 수 없습니다.` }}
          </div>
        </div>
      </div>
    </div>

    <!-- ================= [2] TAB: 영웅비교 (자동완성 검색형 3종) ================= -->
    <div v-else-if="activeDetailTab === 'compare'" class="horizontal-3col-board">
      <div 
        v-for="index in 3" 
        :key="'compare-col-' + index" 
        class="info-section-wrapper compact-section hero-card-column"
      >
        <!-- 검색어 자동완성 바 -->
        <div class="section-title-bar select-title-bar search-autocomplete-bar">
          <div class="autocomplete-input-wrapper">
            <input 
              type="text" 
              v-model="compareSearchQueries[index - 1]"
              @focus="showDropdownFlags[index - 1] = true"
              @blur="onSearchBlur(index - 1)"
              placeholder="🔍 영웅 이름/ID 검색..."
              class="search-hero-input"
            />
            <button 
              v-if="compareSearchQueries[index - 1]" 
              @click="clearCompareHeroSlot(index - 1)" 
              class="clear-search-btn"
              title="선택 초기화"
            >
              ✕
            </button>
          </div>

          <ul 
            v-if="showDropdownFlags[index - 1] && getFilteredHeroList(compareSearchQueries[index - 1]).length > 0" 
            class="autocomplete-dropdown-list"
          >
            <li 
              v-for="h in getFilteredHeroList(compareSearchQueries[index - 1])" 
              :key="h.id"
              @mousedown.prevent="selectHeroFromAutocomplete(index - 1, h)"
              class="autocomplete-item"
            >
              <img :src="getHeroImage(h.id)" @error="handleImageError" class="mini-hero-thumb" />
              <div class="mini-hero-info">
                <span class="mini-hero-name">{{ h.name }}</span>
                <span class="mini-hero-id">ID: {{ h.id }}</span>
              </div>
            </li>
          </ul>
        </div>

        <div class="vertical-scroll-board p-2">
          <div v-if="compareHeroDetails[index - 1]" class="hero-detail-container">
            <div class="profile-header-card">
              <div class="profile-avatar-box">
                <img 
                  :src="getHeroImage(compareHeroDetails[index - 1].id)" 
                  @error="handleImageError" 
                  class="hero-detail-avatar" 
                />
                <div class="hero-header-text">
                  <h4 class="hero-detail-title">{{ compareHeroDetails[index - 1].name }}</h4>
                  <span class="hero-detail-code">ID: {{ compareHeroDetails[index - 1].id }}</span>
                </div>
              </div>
            </div>

            <!-- 스킬 정보 -->
            <div class="effect-group-box info-group">
              <div class="buff-card-list">
                <div class="buff-item-card card-info fit-card">
                  <div class="fit-row">
                    <div class="fit-left">
                      <span class="slim-label-box">일반</span>
                    </div>
                    <div class="fit-right">
                      <span class="buff-val text-yellow">{{ compareHeroDetails[index - 1].normal_damage }}</span>
                    </div>
                  </div>
                </div>

                <div class="buff-item-card card-info fit-card">
                  <div class="fit-row">
                    <div class="fit-left">
                      <span class="slim-label-box label-crit">치명타</span>
                    </div>
                    <div class="fit-right">
                      <span class="buff-val text-yellow">{{ compareHeroDetails[index - 1].critSdc02_value }}</span>
                    </div>
                  </div>
                </div>

                <div class="buff-item-card card-info card-active-skill fit-card">
                  <div class="fit-row">
                    <div class="fit-left">
                      <span class="slim-label-box label-active">액티브</span>
                    </div>
                    <div class="fit-right">
                      <span class="buff-val text-red-main">{{ compareHeroDetails[index - 1].activeSdc01_effect_value }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 🌟 버프/디버프 목록 (자신 버프, 아군 버프, 적군 디버프 통합 추가) -->
            <div class="hero-buff-list-box mt-2">
              <div v-if="compareHeroDetails[index - 1].buffs && compareHeroDetails[index - 1].buffs.length > 0" class="buff-category-wrapper">
                
                <!-- 1. 자신 버프 -->
                <div v-if="filterBuffs(compareHeroDetails[index - 1].buffs, 'SELF_BUFF').length > 0" class="effect-group-box self-group">
                  <div class="group-header-label text-self">👤 자신 버프</div>
                  <div class="buff-card-list">
                    <div v-for="b in filterBuffs(compareHeroDetails[index - 1].buffs, 'SELF_BUFF')" :key="b.buff_seq" class="buff-item-card card-self compact-buff-item">
                      <div class="buff-item-left">
                        <span class="skill-type-badge" :class="b.skill_code === 'SKI02' ? 'badge-crit' : b.skill_code === 'SKI01' ? 'badge-normal' : 'badge-active'">
                          {{ b.skill_code === 'SKI02' ? 'C' : b.skill_code === 'SKI01' ? 'N' : 'A' }}
                        </span>
                        <span class="buff-name text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                      </div>
                      <div class="buff-item-right">
                        <span class="buff-val-sm">{{ b.effect_value }}{{ b.unit || '%' }}</span>
                        <span v-if="b.duration" class="sub-info-sm">지속: {{ b.duration }}s</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 2. 아군 버프 (추가됨) -->
                <div v-if="filterBuffs(compareHeroDetails[index - 1].buffs, 'TEAM_BUFF').length > 0" class="effect-group-box team-group">
                  <div class="group-header-label text-team">🛡️ 아군 버프</div>
                  <div class="buff-card-list">
                    <div v-for="b in filterBuffs(compareHeroDetails[index - 1].buffs, 'TEAM_BUFF')" :key="b.buff_seq" class="buff-item-card card-team compact-buff-item">
                      <div class="buff-item-left">
                        <span class="skill-type-badge" :class="b.skill_code === 'SKI02' ? 'badge-crit' : b.skill_code === 'SKI01' ? 'badge-normal' : 'badge-active'">
                          {{ b.skill_code === 'SKI02' ? 'C' : b.skill_code === 'SKI01' ? 'N' : 'A' }}
                        </span>
                        <span class="buff-name text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                      </div>
                      <div class="buff-item-right">
                        <span class="buff-val-sm text-green">{{ b.effect_value }}{{ b.unit || '%' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 3. 적군 디버프 (추가됨) -->
                <div v-if="filterBuffs(compareHeroDetails[index - 1].buffs, 'DEBUFF').length > 0" class="effect-group-box debuff-group">
                  <div class="group-header-label text-debuff">⚔️ 적군 디버프</div>
                  <div class="buff-card-list">
                    <div v-for="b in filterBuffs(compareHeroDetails[index - 1].buffs, 'DEBUFF')" :key="b.buff_seq" class="buff-item-card card-debuff compact-buff-item">
                      <div class="buff-item-left">
                        <span class="skill-type-badge" :class="b.skill_code === 'SKI02' ? 'badge-crit' : b.skill_code === 'SKI01' ? 'badge-normal' : 'badge-active'">
                          {{ b.skill_code === 'SKI02' ? 'C' : b.skill_code === 'SKI01' ? 'N' : 'A' }}
                        </span>
                        <span class="buff-name text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                      </div>
                      <div class="buff-item-right">
                        <span class="buff-val-sm text-red">{{ b.effect_value }}{{ b.unit || '%' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              <div v-else class="empty-text">- 등록된 스킬/버프 정보가 없습니다. -</div>
            </div>

          </div>
          <div v-else class="empty-status-alert compact-alert select-placeholder">
            <span>{{ loadingCompareMap[index - 1] ? '영웅 정보 불러오는 중...' : `영웅 ${index}번 검색창에 이름이나 ID를 입력하세요` }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';
import { useDeckBuild } from '../composables/useDeckBuild.js';

const activeDetailTab = ref('new');
const targetDeckCodes = ['MR', 'MQ', 'MP'];

const {
  BASE_URL,
  filteredHeroPool,
  getHeroImage,
  handleImageError
} = useDeckBuild();

const allHeroPool = computed(() => filteredHeroPool.value || []);

const newHeroDetails = reactive({});
const loadingMap = reactive({});

const compareSearchQueries = ref(['', '', '']);
const showDropdownFlags = ref([false, false, false]);
const compareHeroIds = ref([null, null, null]);
const compareHeroDetails = reactive([null, null, null]);
const loadingCompareMap = reactive([false, false, false]);

const getFilteredHeroList = (query) => {
  if (!query) return allHeroPool.value.slice(0, 15);
  const q = query.trim().toLowerCase();
  return allHeroPool.value.filter(h => 
    (h.name && h.name.toLowerCase().includes(q)) || 
    (h.id && String(h.id).toLowerCase().includes(q))
  );
};

const selectHeroFromAutocomplete = (slotIndex, hero) => {
  compareSearchQueries.value[slotIndex] = hero.name;
  compareHeroIds.value[slotIndex] = hero.id;
  showDropdownFlags.value[slotIndex] = false;
  onCompareHeroSelect(slotIndex, hero.id);
};

const clearCompareHeroSlot = (slotIndex) => {
  compareSearchQueries.value[slotIndex] = '';
  compareHeroIds.value[slotIndex] = null;
  compareHeroDetails[slotIndex] = null;
  showDropdownFlags.value[slotIndex] = false;
};

const onSearchBlur = (slotIndex) => {
  setTimeout(() => {
    showDropdownFlags.value[slotIndex] = false;
  }, 150);
};

const formatHeroDetailData = (rawData) => {
  if (!rawData) return null;
  const rawBuffs = rawData.buffs || [];

  const findBuff = (skillCode, effectCode) => {
    return rawBuffs.find(b => {
      const matchSkill = String(b.skill_code || '').trim().toUpperCase() === skillCode.toUpperCase();
      if (!effectCode) return matchSkill;
      return matchSkill && String(b.effect_code || '').trim().toUpperCase() === effectCode.toUpperCase();
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

  const critName = critSkillSdc02 ? (critSkillSdc02.effect_code_name || critSkillSdc02.buff_name || '') : '';
  const critVal = critSkillSdc02 && critSkillSdc02.effect_value ? `${critSkillSdc02.effect_value}${critSkillSdc02.unit || '%'}` : '-';
  const critMaxDmg = critSkillSdc02 ? (critSkillSdc02.calculated_value || critVal) : '-';

  const activeName = activeSkillSdc01 ? (activeSkillSdc01.effect_code_name || activeSkillSdc01.buff_name || '') : '-';
  const activeVal = activeSkillSdc01 && activeSkillSdc01.effect_value ? `${activeSkillSdc01.effect_value}${activeSkillSdc01.unit || '%'}` : '-';
  const activeMaxDmg = activeSkillSdc01 ? (activeSkillSdc01.calculated_value || activeVal) : '-';

  return {
    ...rawData,
    buffs: rawBuffs,
    normal_damage_name: normalSkill.effect_code_name || normalSkill.buff_name || '',
    normal_damage: normalSkill.calculated_value || (normalSkill.effect_value ? `${normalSkill.effect_value}${normalSkill.unit || '%'}` : '0%'),

    critSdc02_damage_name: critName,
    critSdc02_value: critVal,
    critSdc02_damage: critMaxDmg,
    critSdc02_range: (critSkillBase.range !== null && critSkillBase.range !== undefined) ? `${critSkillBase.range}` : '-',

    activeSdc01_skill_name: activeName,
    activeSdc01_effect_value: activeVal,
    activeSdc01_damage: activeMaxDmg,
    activeSdc01_shape: activeSkillBase.range_type || activeSkillBase.range_shape || '-',
    activeSdc01_area: formatArea(activeSkillBase),
    activeSdc01_range: (activeSkillBase.range !== null && activeSkillBase.range !== undefined) ? `${activeSkillBase.range}` : '-',
    activeSdc01_cooldown: (activeSkillBase.cooldown !== null && activeSkillBase.cooldown !== undefined) ? `${activeSkillBase.cooldown}초` : '-'
  };
};

const fetchDetailByCode = async (code) => {
  if (!code) return;
  loadingMap[code] = true;
  try {
    const res = await axios.get(`${BASE_URL}/api/chars/detail/${code}`);
    newHeroDetails[code] = formatHeroDetailData(res.data);
  } catch (err) {
    console.error(`[${code}] 상세 정보 조회 실패:`, err);
    newHeroDetails[code] = null;
  } finally {
    loadingMap[code] = false;
  }
};

const getHeroDetailByCode = (code) => newHeroDetails[code];

const onCompareHeroSelect = async (slotIndex, charId) => {
  if (!charId) {
    compareHeroDetails[slotIndex] = null;
    return;
  }
  loadingCompareMap[slotIndex] = true;
  try {
    const res = await axios.get(`${BASE_URL}/api/chars/detail/${charId}`);
    compareHeroDetails[slotIndex] = formatHeroDetailData(res.data);
  } catch (err) {
    console.error(`슬롯 ${slotIndex + 1} 상세 조회 실패:`, err);
    compareHeroDetails[slotIndex] = null;
  } finally {
    loadingCompareMap[slotIndex] = false;
  }
};

const filterBuffs = (buffsList, categoryType) => {
  if (!buffsList || !Array.isArray(buffsList)) return [];

  return buffsList.filter(b => {
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

onMounted(() => {
  targetDeckCodes.forEach(code => fetchDetailByCode(code));
});
</script>

<style scoped>
@import "../assets/styles/deck-build.css";

.skia-char-info-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-tab-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.main-tab-btn {
  flex: 1;
  padding: 8px 10px;
  background: #1e293b;
  border: 1px solid #334155;
  color: #94a3b8;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.main-tab-btn.active {
  background: #3b82f6;
  color: #ffffff;
  border-color: #60a5fa;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

.horizontal-3col-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
  flex: 1;
  overflow: hidden;
}

.hero-card-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.section-title-bar h3 {
  font-size: 0.85rem !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-autocomplete-bar {
  position: relative;
  padding: 4px !important;
  overflow: visible !important;
  z-index: 50;
}

.autocomplete-input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.search-hero-input {
  width: 100%;
  padding: 5px 24px 5px 8px;
  background: #0f172a;
  border: 1px solid #3b82f6;
  color: #ffffff;
  border-radius: 4px;
  font-size: 0.8rem;
  outline: none;
}

.search-hero-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
}

.clear-search-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
}

.clear-search-btn:hover {
  color: #f87171;
}

.autocomplete-dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #0f172a;
  border: 1px solid #3b82f6;
  border-radius: 0 0 6px 6px;
  max-height: 180px;
  overflow-y: auto;
  z-index: 999;
  margin: 0;
  padding: 0;
  list-style: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  border-bottom: 1px solid #1e293b;
  transition: background 0.15s ease;
}

.autocomplete-item:hover {
  background: #1e293b;
}

.mini-hero-thumb {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #334155;
}

.mini-hero-info {
  display: flex;
  flex-direction: column;
}

.mini-hero-name {
  font-size: 0.78rem;
  font-weight: bold;
  color: #f8fafc;
}

.mini-hero-id {
  font-size: 0.65rem;
  color: #60a5fa;
}

.fit-card {
  padding: 6px 8px !important;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 6px;
}

.fit-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.fit-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.slim-label-box {
  width: 44px;
  height: 22px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: bold;
  color: #94a3b8;
  flex-shrink: 0;
}

.label-crit {
  color: #60a5fa;
  border-color: #2563eb;
}

.label-active {
  color: #f87171;
  border-color: #dc2626;
}

.buff-val {
  font-size: 0.85rem;
  font-weight: bold;
  white-space: nowrap;
}

.buff-max-badge-sm {
  background: #334155;
  color: #f59e0b;
  font-size: 0.63rem;
  padding: 1px 3px;
  border-radius: 3px;
  white-space: nowrap;
}

.fit-meta {
  margin-top: 2px;
  gap: 4px !important;
  padding-left: 50px;
}

.compact-buff-item {
  padding: 4px 6px !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compact-buff-item .buff-item-left {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.compact-buff-item .buff-item-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.buff-val-sm {
  font-size: 0.78rem;
  font-weight: bold;
  white-space: nowrap;
}

.sub-info-sm {
  font-size: 0.68rem;
  color: #94a3b8;
  white-space: nowrap;
}

.select-placeholder {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.4;
}
</style>