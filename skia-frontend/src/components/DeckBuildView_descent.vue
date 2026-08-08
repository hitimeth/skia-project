<template>
  <div class="arena-wrapper">    
    <!-- =======================================================================
         [최상단] 타이틀 & 추천 덱 불러오기 & 스킬 분석 구분
         ======================================================================= -->
    <div class="top-dashboard-zone">
      <div class="dashboard-header">
        <h2>{{ texts.header.descent.title }}</h2>
        <p class="pool-tip" v-html="texts.header.descent.tip"></p>
        <div class="content-tag">{{ texts.header.descent.badge }}</div>
      </div>
      
      <div class="control-panel">
        <div class="input-group flex-fill">
          <label>{{ texts.controls.descentDeckLabel }}</label>
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
         [중단 메인] 2단 분할 레이아웃 (배치 전장 + 우측 현황판)
         ======================================================================= -->
    <div class="main-workspace-zone">
      
      <!-- [좌측] 전장 영역 (팀1 및 팀1_reverse) -->
      <div class="workspace-column unified-battlefield-column-descent">
        
        <!-- ================= [팀 1 : 아군 좌측 / 보스 우측] ================= -->
        <div class="battle-pair-row">
          <div class="team-arena-section">
            <div class="team-title-banner alliance">
              <h3>🛡️ TEAM 1 <span class="char-count">({{ getTeamCharCount(1) }}/48)</span></h3>
              <div style="display: flex; gap: 4px;">
                <button class="copy-team-btn" @click="copyTeamDeckCode(1)">{{ texts.arena.teamCopyBtn }}</button>
                <button class="clear-team-btn" @click="clearTeam(1)">{{ texts.arena.teamClearBtn }}</button>
              </div>
            </div>
            
            <div class="arena-container-celestial" :ref="el => setArenaRef(el, 1)" @dragover.prevent @drop="onDrop($event, 1)">
              <div class="skeleton-celestial">
                <div v-for="i in 48" :key="'t1-cell-' + i" class="grid-cell alliance-cell"></div>
              </div>

              <!-- 아군 격자판 내 SVG -->
              <svg class="range-overlay-container">
                <g v-for="range in computedRanges[1]" :key="'svg-t1-' + range.instanceId">
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
                <div v-for="char in activeChars(1)" :key="char.instanceId" class="char-card" :class="{ 'selected-hero': selectedHeroName === char.name }" :id="'char-' + char.instanceId" draggable="true" @dragstart="onDragStart($event, char, 1)" @drag="onDragging" @click.stop="selectHero(char)" @contextmenu.prevent="removeHero(char, 1)" :title="`${char.name}`" :style="{ top: char.position.top + 'px', left: char.position.left + 'px', borderColor: char.color || '#3b82f6' }">
                  <div class="avatar-box">
                    <img :src="getHeroImage(char.id)" @error="handleImageError" :alt="char.name" class="char-avatar" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 우측 보스 격자판 -->
          <div class="boss-arena-section">
            <div class="boss-zone-header">              
              <span class="boss-badge">{{ texts.arena.bossBadgeNightmare }}</span>
            </div>
            
            <div class="boss-arena-container-celestial">
              <div class="boss-grid-skeleton-celestial">
                <div v-for="i in 48" :key="'b1-cell-' + i" class="grid-cell boss-cell"></div>
              </div>
              
              <svg class="range-overlay-container boss-range-svg">
                <g v-for="range in computedRanges[1]" :key="'svg-boss-t1-' + range.instanceId">
                  <line :x1="range.bossStartX" :y1="range.startY" :x2="range.bossEndX" :y2="range.endY" :stroke="range.color" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7" />
                  
                  <path v-if="range.shape === '부채꼴' && range.radius > 0" 
                    :d="`M ${range.bossDrawX} ${range.drawY} L ${range.bossDrawX + range.radius * 0.7} ${range.drawY - range.radius * 0.7} A ${range.radius} ${range.radius} 0 0 1 ${range.bossDrawX + range.radius * 0.7} ${range.bossDrawY + range.radius * 0.7} Z`" 
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
                  <span class="boss-emoji-large">😈</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= [팀 1_reverse : 보스 좌측 / 아군 우측] ================= -->
        <div class="battle-pair-row reverse-layout">
          <!-- 좌측 보스 격자판 -->
          <div class="boss-arena-section reverse-boss">
            <div class="boss-zone-header">
              <span class="boss-badge reverse-badge">{{ texts.arena.bossBadgeNightmare }}</span>
            </div>
            
            <div class="boss-arena-container-celestial reverse-container-shape">
              <div class="boss-grid-skeleton-celestial">
                <div v-for="i in 48" :key="'b1rev-cell-' + i" class="grid-cell boss-cell"></div>
              </div>
              
<!--               <svg class="range-overlay-container boss-range-svg">
                <g v-for="range in computedRanges['1_reverse']" :key="'svg-boss-trev-' + range.instanceId">
                  <line :x1="range.revBossStartX" :y1="range.startY" :x2="range.revBossEndX" :y2="range.endY" :stroke="range.color" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7" />
                  
                  <path v-if="range.shape === '부채꼴' && range.radius > 0" 
                    :d="`M ${range.revBossDrawX} ${range.drawY} L ${range.revBossDrawX + range.radius * 0.7} ${range.drawY - range.radius * 0.7} A ${range.radius} ${range.radius} 0 0 1 ${range.revBossDrawX + range.radius * 0.7} ${range.drawY + range.radius * 0.7} Z`" 
                    :fill="range.color" fill-opacity="0.25" :stroke="range.color" stroke-width="2" />
                  
                  <circle v-else-if="range.shape === '원' && range.radius > 0" 
                    :cx="range.revBossDrawX" :cy="range.drawY" :r="range.radius" 
                    :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                    
                  <rect v-else-if="range.shape === '사각형' && range.width > 0" 
                    :x="range.revBossDrawX" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" 
                    :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                </g>
              </svg> -->
         
              <div class="boss-overlay-card">
                <div class="boss-avatar-wrapper">
                  <span class="boss-emoji-large">😈</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 우측 아군 격자판 (팀 1 리버스) -->
          <div class="team-arena-section reverse-team">
            <div class="team-title-banner alliance reverse-banner">
              <h3>🛡️ TEAM 1_r <span class="char-count">({{ getTeamCharCount('1_reverse') }}/48)</span></h3>
              <div style="display: flex; gap: 4px;">
                <button class="copy-team-btn" @click="copyToReverseTeam('1_reverse')">{{ texts.arena.teamCopyBtn }}</button>
                <button class="clear-team-btn" @click="clearTeam('1_reverse')">{{ texts.arena.teamClearBtn }}</button>
              </div>
            </div>              
            
            <div class="arena-container-celestial reverse-arena-shape" :ref="el => setArenaRef(el, '1_reverse')" @dragover.prevent @drop="onDrop($event, '1_reverse')">
              <div class="skeleton-celestial">
                <div v-for="i in 48" :key="'trev-cell-' + i" class="grid-cell alliance-cell"></div>
              </div>

              <svg class="range-overlay-container">
                <g v-for="range in computedRanges['1_reverse']" :key="'svg-trev-' + range.instanceId">
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
                <div v-for="char in activeChars('1_reverse')" :key="char.instanceId" class="char-card" :class="{ 'selected-hero': selectedHeroName === char.name }" :id="'char-' + char.instanceId" draggable="true" @dragstart="onDragStart($event, char, '1_reverse')" @drag="onDragging" @click.stop="selectHero(char)" @contextmenu.prevent="removeHero(char, '1_reverse')" :title="`${char.name}`" :style="{ top: char.position.top + 'px', left: char.position.left + 'px', borderColor: char.color || '#3b82f6' }">
                  <div class="avatar-box">
                    <img :src="getHeroImage(char.id)" @error="handleImageError" :alt="char.name" class="char-avatar" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ➡️ (오른쪽 세로) 현황판 구역 -->
      <div class="workspace-column status-column">
        <div class="status-board-container-vertical">
          <div class="status-tab-menu">
            <button v-for="tab in [{val: 1, label: '🛡️ T1'}, {val: '1_reverse', label: '🛡️ T1_reverse'}]" :key="tab.val" :class="['status-tab-btn', { active: activeStatusTab === tab.val }]" @click="activeStatusTab = tab.val">
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
                        <span class="char-name" :class="{ 'highlight-yellow': selectedHeroName === src.charName }">{{ src.charName }} <span class="skill-desc">[{{ src.skillDesc }}]</span></span>
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
                        <span class="char-name" :class="{ 'highlight-yellow': selectedHeroName === src.charName }">{{ src.charName }} <span class="skill-desc">[{{ src.skillDesc }}]</span></span>
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
        
        <!-- 영웅 보관함 필터 영역 -->
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

const texts = DASHBOARD_TEXTS;

const {
  isAdmin,
  isPoolCollapsed,
  selectedBoardDeck,
  boardDecks,
  selectedSkillClass,
  selectHero,
  selectedHeroName,
  setArenaRef,
  filteredHeroPool,
  heroGradeFilter,
  heroSearchKeyword,
  buffSubFilter,
  groupedBuffHeroes,
  loadSelectedBoardDeck,
  computedRanges,
  activeChars,
  getAssignedTeam,
  isHeroPlaced,
  getTeamCharCount,
  onDragStart,
  onDragStartFromPool,
  onDragging,
  onDrop,
  removeHero,
  clearTeam,
  copyTeamDeckCode,
  copyToReverseTeam,
  getHeroImage,
  handleImageError,
  activeStatusTab,
  activeBoardType,
  getStatusTabLabel,
  filteredEffectGroupedList,
  filteredDebuffGroupedList,
  showBuffModal,
  isEditing,
  openBuffModal,
  closeBuffModal,
  resetBuffForm,
  effectSearchText,
  heroSearchText,
  filteredEffectCodes,
  filteredHeroIds,
  buffForm,
  saveCharEffect,
  displayedEffects,
  rawHeroList,
  editCharEffect,
  deleteCharEffect,
  commonCodes
} = useDeckBuild({
  gridRows: 8,
  gridCols: 6,
  boardCategory: 'descent',
  maxTeamMembers: 48,
  cardWidth: 38,
  cardHeight: 38
});
</script>

<style scoped>
@import "../assets/styles/deck-build.css";
</style>