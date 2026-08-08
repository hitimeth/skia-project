<template>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght=100..900&family=Pretendard:wght=100..900&display=swap" rel="stylesheet">

  <div class="arena-wrapper">    
    <!-- =======================================================================
         [최상단] 타이틀 & 추천 덱 불러오기 & 스킬 분석 구분
         ======================================================================= -->
    <div class="top-dashboard-zone">
      <div class="dashboard-header">
        <h2>{{ texts.header.celestial.title }}</h2>
        <p class="pool-tip" v-html="texts.header.celestial.tip"></p>
        <div class="content-tag">{{ texts.header.celestial.badge }}</div>
      </div>
      
      <div class="control-panel">
        <div class="input-group flex-fill">
          <label>{{ texts.controls.celestialDeckLabel }}</label>
          <select v-model="selectedBoardDeck" @change="loadSelectedBoardDeck" class="cyber-select flex-fill">
            <option :value="null">{{ texts.controls.deckPlaceholder }}</option>
            <option v-for="deck in boardDecks" :key="deck.board_id" :value="deck">
              [{{ deck.log_date }}] {{ deck.title }}
            </option>
          </select>
        </div>
        
        <div class="input-group">
          <label>{{ texts.controls.skillClassLabel }}</label>
          <select v-model="selectedSkillClass" class="cyber-select">
            <option v-for="opt in texts.controls.skillOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- =======================================================================
         [중단 메인] 3단 세로 분할 레이아웃 구역
         ======================================================================= -->
    <div class="main-workspace-zone">
      <div class="workspace-column unified-battlefield-column">
        <div v-for="teamNo in [1, 2, 3]" :key="'battle-pair-' + teamNo" class="battle-pair-row">
          
          <!-- [좌측] 아군 6*8 격자판 -->
          <div class="team-arena-section">
            <div class="team-title-banner alliance">
              <h3>🛡️ TEAM {{ teamNo }} <span class="char-count">({{ getTeamCharCount(teamNo) }}/15)</span></h3>
              <div style="display: flex; gap: 4px;">
                <button class="copy-team-btn" @click="copyTeamDeckCode(teamNo)">{{ texts.arena.teamCopyBtn }}</button>
                <button class="clear-team-btn" @click="clearTeam(teamNo)">{{ texts.arena.teamClearBtn }}</button>
              </div>
            </div>
            <div class="arena-container-celestial" :ref="el => setArenaRef(el, teamNo)" @dragover.prevent @drop="onDrop($event, teamNo)">
              <div class="skeleton_celestial">
                <div v-for="i in 48" :key="'t'+teamNo+'-cell-' + i" class="grid-cell alliance-cell"></div>
              </div>

              <!-- 아군 격자판 내 SVG 오버레이 -->
              <svg class="range-overlay-container">
                <g v-for="range in computedRanges[teamNo]" :key="'svg-t'+teamNo+'-' + range.instanceId">
                  <line :x1="range.startX" :y1="range.startY" :x2="range.endX" :y2="range.endY" :stroke="range.color" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7" />
                  <circle :cx="range.endX" :cy="range.endY" r="4.5" :fill="range.color" />
                  
                  <path v-if="range.shape === '부채꼴' && range.radius > 0" 
                    :d="`M ${range.drawX} ${range.drawY} L ${range.drawX + range.radius * 0.7} ${range.drawY - range.radius * 0.7} A ${range.radius} ${range.radius} 0 0 1 ${range.drawX + range.radius * 0.7} ${range.drawY + range.radius * 0.7} Z`" 
                    :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />

                  <circle v-else-if="range.shape === '원' && range.radius > 0" 
                    :cx="range.drawX" :cy="range.drawY" :r="range.radius" 
                    :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />

                  <rect v-else-if="range.shape === '사각형' && range.width > 0" 
                    :x="range.drawX" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" 
                    :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                </g>
              </svg>
     
              <div class="team-box">
                <div v-for="char in activeChars(teamNo)" 
                  :key="char.instanceId" 
                  class="char-card" 
                  :class="{ 'selected-hero': selectedHeroName === char.name }"
                  :id="'char-' + char.instanceId" 
                  draggable="true" 
                  @dragstart="onDragStart($event, char, teamNo)" 
                  @drag="onDragging" 
                  @click.stop="selectHero(char)"
                  @contextmenu.prevent="removeHero(char, teamNo)" 
                  :title="`${char.name}`" 
                  :style="{ top: char.position.top + 'px', left: char.position.left + 'px', borderColor: char.color || '#3b82f6' }">
                  <div class="avatar-box">
                    <img :src="getHeroImage(char.id)" @error="handleImageError" :alt="char.name" class="char-avatar" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- [우측] 적군 / 전장 6*8 격자판 -->
          <div class="boss-arena-section">
            <div class="boss-zone-header">
              <span class="boss-badge">{{ texts.arena.bossBadgeCelestial }}</span>
            </div>
            <div class="boss-arena-container-celestial" :ref="el => setArenaRef(el, teamNo + 3)" @dragover.prevent @drop="onDrop($event, teamNo + 3)">
              <div class="boss-grid-skeleton-celestial">
                <div v-for="i in 48" :key="'b'+teamNo+'-cell-' + i" class="grid-cell boss-cell"></div>
              </div>
              
              <svg class="range-overlay-container boss-range-svg">
                <g v-for="range in computedRanges[teamNo]" :key="'svg-boss-t'+teamNo+'-' + range.instanceId">
                  <line :x1="range.bossStartX" :y1="range.startY" :x2="range.bossEndX" :y2="range.endY" :stroke="range.color" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7" />
                  
                  <path v-if="range.shape === '부채꼴' && range.radius > 0" 
                    :d="`M ${range.bossDrawX} ${range.drawY} L ${range.bossDrawX + range.radius * 0.7} ${range.drawY - range.radius * 0.7} A ${range.radius} ${range.radius} 0 0 1 ${range.bossDrawX + range.radius * 0.7} ${range.drawY + range.radius * 0.7} Z`" 
                    :fill="range.color" fill-opacity="0.25" :stroke="range.color" stroke-width="2" />
                  
                  <circle v-else-if="range.shape === '원' && range.radius > 0" 
                    :cx="range.bossDrawX" :cy="range.drawY" :r="range.radius" 
                    :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                    
                  <rect v-else-if="range.shape === '사각형' && range.width > 0" 
                    :x="range.bossDrawX" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" 
                    :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                </g>
              </svg>
         
              <div class="boss-overlay-card">
                <div class="boss-avatar-wrapper">
                  <span class="boss-emoji-large">⚔️</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ➡️ (오른쪽 세로) 탭 및 현황판 -->
      <div class="workspace-column status-column">
        <div class="status-board-container-vertical">
          <div class="status-tab-menu">
            <button v-for="tab in [{val: 1, label: '🛡️ T1'}, {val: 2, label: '🛡️ T2'}, {val: 3, label: '🛡️ T3'}]" :key="tab.val" :class="['status-tab-btn', { active: activeStatusTab === tab.val }]" @click="activeStatusTab = tab.val">
              {{ tab.label }}
            </button>
          </div>

          <div class="board-type-tab-menu" style="display: flex; gap: 6px;">
            <button :class="['type-tab-btn', { active: activeBoardType === 'buff' }]" @click="activeBoardType = 'buff'">
              {{ texts.statusBoard.typeBuff }}
            </button>
            <button :class="['type-tab-btn', { active: activeBoardType === 'debuff' }]" @click="activeBoardType = 'debuff'">
              {{ texts.statusBoard.typeDebuff }}
            </button>
          </div>
          
          <!-- 아군 버프 현황판 -->
          <div v-if="activeBoardType === 'buff'" class="buff-section-wrapper compact-section">
            <div class="section-title-bar">
              <h3>{{ texts.statusBoard.buffTitle }} <span class="selected-team-text">({{ getStatusTabLabel }})</span></h3>
              <span class="active-badge">{{ texts.statusBoard.buffBadge }}</span>
            </div>
            <div class="vertical-scroll-board">
              <div class="grid-container" v-if="filteredEffectGroupedList.length > 0">
                <div v-for="item in filteredEffectGroupedList" :key="item.effectCode" class="grid-item">
                  <div class="item-header" :title="item.effectName">{{ item.effectNameShort }}</div>
                  <div class="item-body">
                    <div v-for="(src, idx) in item.sources" :key="src.charName + '-' + src.skillDesc + '-' + src.teamNo + '-' + idx" class="source-row">
                      <div class="char-info">
                        <span class="char-name" :class="{ 'highlight-yellow': selectedHeroName === src.charName }">
                          {{ src.charName }} 
                          <span class="skill-desc">[{{ src.skillDesc }}]</span>
                        </span>
                      </div>
                      <span class="effect-val-text">{{ src.charValue }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-status-alert compact-alert">{{ texts.statusBoard.emptyBuff }}</div>
            </div>
          </div>

          <!-- 적군 디버프 현황판 -->
          <div v-else class="debuff-section-wrapper compact-section">
            <div class="section-title-bar">
              <h3>{{ texts.statusBoard.debuffTitle }} <span class="selected-team-text">({{ getStatusTabLabel }})</span></h3>
              <span class="deactive-badge">{{ texts.statusBoard.debuffBadge }}</span>
            </div>
            <div class="vertical-scroll-board">
              <div class="grid-container" v-if="filteredDebuffGroupedList.length > 0">
                <div v-for="item in filteredDebuffGroupedList" :key="item.effectCode" class="grid-item">
                  <div class="item-header debuff-header" :title="item.effectName">{{ item.effectNameShort }}</div>
                  <div class="item-body">
                    <div v-for="(src, idx) in item.sources" :key="src.charName + '-' + src.skillDesc + '-' + src.teamNo + '-' + idx" class="source-row">
                      <div class="char-info">
                        <span class="char-name" :class="{ 'highlight-yellow': selectedHeroName === src.charName }">
                          {{ src.charName }} 
                          <span class="skill-desc">[{{ src.skillDesc }}]</span>
                        </span>
                      </div>
                      <span class="effect-val-text debuff-val-text">{{ src.charValue }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-status-alert compact-alert">{{ texts.statusBoard.emptyDebuff }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- =======================================================================
         [최하단 가로형] 👑 영웅 보관함
         ======================================================================= -->
    <div class="bottom-hero-pool-zone" :class="{ collapsed: isPoolCollapsed }">
      <div class="pool-toggle-header" @click="isPoolCollapsed = !isPoolCollapsed">
        <div class="left-controls">
          <h3>{{ texts.heroPool.title }} <span class="toggle-icon">{{ isPoolCollapsed ? texts.heroPool.toggleExpand : texts.heroPool.toggleCollapse }}</span></h3>
          <p class="pool-tip">{{ texts.heroPool.dragTip }}</p>
        </div>
        
        <div class="pool-filter-actions" @click.stop>
          <div v-if="heroGradeFilter === 'BUFF_LIST'" class="buff-sub-filter-bar">
            <button 
              v-for="sub in texts.heroPool.subFilters" 
              :key="sub.key"
              :class="['sub-filter-btn', sub.key === 'BUFF' ? 'buff-btn' : sub.key === 'DEBUFF' ? 'debuff-btn' : '', { active: buffSubFilter === sub.key }]" 
              @click="buffSubFilter = sub.key"
            >
              {{ sub.label }}
            </button>
          </div>

          <div class="filter-tab-bar">
            <button v-for="grade in texts.heroPool.gradeFilters" :key="grade.key" :class="['filter-tab-btn', { active: heroGradeFilter === grade.key }]" @click="heroGradeFilter = grade.key">
              {{ grade.label }}
            </button>
          </div>
          <input v-model="heroSearchKeyword" type="text" :placeholder="texts.heroPool.searchPlaceholder" class="hero-search-input" />
          <button class="manage-buff-btn" @click="openBuffModal">{{ texts.heroPool.manageBtn }}</button>
        </div>
      </div>

      <div class="pool-horizontal-scroll-container" v-show="!isPoolCollapsed">
        <div v-if="heroGradeFilter !== 'BUFF_LIST'" class="hero-three-row-grid">
          <div 
            v-for="hero in filteredHeroPool" 
            :key="hero.id" 
            class="pool-hero-item" 
            :class="{ 'in-team-disabled': isHeroPlaced(hero.id) }"
            :draggable="!isHeroPlaced(hero.id)" 
            @dragstart="onDragStartFromPool($event, hero)" 
            :style="{ borderColor: isHeroPlaced(hero.id) ? '#475569' : (hero.color || '#475569') }"
          >
            <div class="hero-avatar-wrapper">
              <img :src="getHeroImage(hero.id)" @error="handleImageError" :alt="hero.name" class="char-avatar" />
              <span v-if="isHeroPlaced(hero.id)" class="in-team-badge">{{ texts.heroPool.inTeamBadge }}</span>
            </div>
            <span class="hero-mini-name">{{ hero.name }}</span>
          </div>
        </div>
        <div v-else class="buff-grouped-three-row-container">
          <div v-for="group in groupedBuffHeroes" :key="group.effectCode || group.effectName" class="buff-group-box">
            <div class="buff-group-box-title" :class="group.effectType === '디버프' ? 'text-debuff' : 'text-buff'">
              {{ group.effectNameShort }}
            </div>
            <div class="buff-group-hero-grid">
              <div 
                v-for="hero in group.heroes" 
                :key="hero.id" 
                class="pool-hero-item" 
                :class="{ 'in-team-disabled': isHeroPlaced(hero.id) }"
                :draggable="!isHeroPlaced(hero.id)" 
                @dragstart="onDragStartFromPool($event, hero)" 
                :style="{ borderColor: isHeroPlaced(hero.id) ? '#475569' : (hero.color || '#475569') }"
              >
                <div class="hero-avatar-wrapper">
                  <img :src="getHeroImage(hero.id)" @error="handleImageError" :alt="hero.name" class="char-avatar" />
                  <span v-if="getAssignedTeam(hero.id)" class="in-team-badge">
                    T{{ getAssignedTeam(hero.id) }}
                  </span>
                </div>
                <span class="hero-mini-name">{{ hero.name }}</span>
              </div>
            </div>
          </div>
          <div v-if="groupedBuffHeroes.length === 0" class="no-data-msg">{{ texts.heroPool.noBuffHero }}</div>
        </div>
      </div>
    </div>

    <!-- 추천 영웅 관리 모달 팝업 창 -->
    <div v-if="showBuffModal" class="buff-modal-overlay" @click.self="closeBuffModal">
      <div class="buff-modal-content">
        <div class="modal-header">
          <h3>{{ texts.modal.title }}</h3>
          <button class="close-btn" @click="closeBuffModal">✕</button>
        </div>

        <div class="modal-form-section">
          <h4>{{ isEditing ? texts.modal.formTitleEdit : texts.modal.formTitleNew }}</h4>
          <div class="form-grid">
            <div class="form-group">
              <label>{{ texts.modal.effectLabel }}</label>
              <input v-model="effectSearchText" type="text" list="effectCodeDatalist" :placeholder="texts.modal.effectPlaceholder" @input="() => { const found = commonCodes.find(c => c.code_name === effectSearchText.trim()); if (found) buffForm.effect_code = found.code_id; else buffForm.effect_code = ''; }" />
              <datalist id="effectCodeDatalist">
                <option v-for="item in filteredEffectCodes" :key="item.code_id" :value="item.code_name">{{ item.code_id }}</option>
              </datalist>
            </div>
            <div class="form-group">
              <label>{{ texts.modal.heroLabel }}</label>
              <input v-model="heroSearchText" type="text" list="heroIdDatalist" :placeholder="texts.modal.heroPlaceholder" @change="() => { const found = rawHeroList.find(h => h.name === heroSearchText); if (found) buffForm.char_id = found.id; }" />
              <datalist id="heroIdDatalist">
                <option v-for="hero in filteredHeroIds" :key="hero.id" :value="hero.name">{{ hero.id }}</option>
              </datalist>
            </div>
            <div class="form-group">
              <label>{{ texts.modal.rankLabel }}</label>
              <input v-model.number="buffForm.rank_score" type="number" :placeholder="texts.modal.rankPlaceholder" />
            </div>
          </div>
          <div class="form-actions">
            <button v-if="isEditing" class="btn-cancel" @click="resetBuffForm">{{ texts.modal.btnCancel }}</button>
            <button class="btn-submit" @click="saveCharEffect">{{ isEditing ? texts.modal.btnSubmitEdit : texts.modal.btnSubmitNew }}</button>
          </div>
        </div>

        <div class="modal-table-section">
          <h4>📊 등록된 추천 매핑 현황 (총 {{ displayedEffects.length }}건)</h4>
          <div class="table-scroll-wrapper">
            <table class="buff-management-table">
              <thead>
                <tr>
                  <th v-for="th in texts.modal.tableHeaders" :key="th">{{ th }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in displayedEffects" :key="item.effect_seq">
                  <td><span class="seq-badge">{{ item.effect_seq }}</span></td>
                  <td><span class="code-badge">{{ item.effect_code }}</span></td>
                  <td><strong>{{ item.code_name }}</strong></td>
                  <td>
                    <strong>{{ item.char_id }}</strong>
                    <span style="margin-left: 6px; color: #a0aec0;">{{ rawHeroList.find(h => h.id === item.char_id)?.name || texts.modal.unregisteredHero }}</span>
                  </td>
                  <td><span class="rank-tag">{{ item.rank_score }}</span></td>
                  <td class="table-actions">
                    <button class="btn-edit-sm" @click="editCharEffect(item)">수정</button>
                    <button class="btn-delete-sm" @click="deleteCharEffect(item.effect_seq)">삭제</button>
                  </td>
                </tr>
                <tr v-if="displayedEffects.length === 0">
                  <td colspan="6" style="text-align: center; color: #64748b; padding: 30px;">{{ texts.modal.noData }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDeckBuild } from '../composables/useDeckBuild.js';
import { DASHBOARD_TEXTS } from '../constants/dashboardTexts.js';

// Centralized constants reference
const texts = DASHBOARD_TEXTS;

const {
  isAdmin,
  isPoolCollapsed,
  selectedBoardDeck,
  boardDecks,
  selectedSkillClass,
  setArenaRef,
  heroGradeFilter,
  heroSearchKeyword,
  selectedHeroName,
  selectHero,
  showBuffModal,
  isEditing,
  buffForm,
  effectSearchText,
  heroSearchText,
  activeChars,
  getTeamCharCount,
  getAssignedTeam,
  isHeroPlaced,
  filteredHeroPool,
  buffSubFilter,
  groupedBuffHeroes,
  loadSelectedBoardDeck,
  computedRanges,
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
  filteredEffectGroupedList,
  filteredDebuffGroupedList,
  commonCodes,
  rawHeroList
} = useDeckBuild({
  gridRows: 8,
  gridCols: 6,
  boardCategory: 'celestial',
  fallbackBoardCategory: 'nightmare',
  maxTeamMembers: 15,
  initialSkillClass: '액티브공격',
  cardWidth: 36,
  cardHeight: 36
});
</script>

<style scoped>
@import "../assets/styles/deck-build.css";
</style>