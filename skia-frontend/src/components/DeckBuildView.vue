<template>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght=100..900&family=Pretendard:wght=100..900&display=swap" rel="stylesheet">

  <div class="arena-wrapper">    
    <!-- Top header & controls -->
    <div class="top-dashboard-zone">
      <div class="dashboard-header">
        <h2>{{ headerText.title }}</h2>
        <p class="pool-tip" v-html="headerText.tip"></p>
        <div class="content-tag">{{ headerText.badge }}</div>
      </div>

      <div class="control-panel">
        <div class="input-group flex-fill">
          <label>{{ controls.deckLabel }}</label>
          <select v-model="selectedBoardDeck" @change="loadSelectedBoardDeck" class="cyber-select flex-fill">
            <option :value="null">{{ texts.controls.deckPlaceholder }}</option>
            <option v-for="deck in boardDecks" :key="deck.board_id" :value="deck">
              [{{ deck.category }}][{{ deck.log_date }}] {{ deck.title }}
            </option>
          </select>
        </div>
        
        <div class="input-group">
          <label>{{ texts.controls.skillClassLabel }}</label>
          <select v-model="selectedSkillClass" @change="calculateAllRanges" class="cyber-select">
            <option v-for="opt in texts.controls.skillOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Main workspace: 좌측 전장 + 우측 영웅 보관함 -->
    <div class="main-workspace-zone">
      <!-- ================= [1] DESCENT MODE (강림) ================= -->
      <div v-if="boardCategory === 'descent'" class="workspace-column unified-battlefield-column-descent">
        <div class="battle-pair-row">
          <div class="team-arena-section" :class="{ 'active-team-focus': activeStatusTab === 1 }" @click="selectStatusTeam(1)">
            <div class="team-title-banner alliance">
              <h3>🛡️ 팀 1 <span class="char-count">({{ getTeamCharCount(1) }}/48)</span></h3>
              <div style="display: flex; gap: 4px;" @click.stop>
                <button class="copy-team-btn" @click="copyTeamDeckCode(1)">{{ texts.arena.teamCopyBtn }}</button>
                <button class="clear-team-btn" @click="clearTeam(1)">{{ texts.arena.teamClearBtn }}</button>
              </div>
            </div>
            
            <div class="arena-container-celestial" :ref="el => setArenaRef(el, 1)" @dragover.prevent @drop="onDrop($event, 1)">
              <div class="skeleton-celestial">
                <div v-for="i in 48" :key="'t1-cell-' + i" class="grid-cell alliance-cell"></div>
              </div>

              <svg class="range-overlay-container">
                <g v-for="range in computedRanges[1]" :key="'svg-t1-' + range.instanceId">
                  <line :x1="range.startX" :y1="range.startY" :x2="range.endX" :y2="range.endY" :stroke="range.color" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7" />
                  <circle :cx="range.endX" :cy="range.endY" r="4.5" :fill="range.color" />
                  <path v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" :d="range.pathD" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <circle v-else-if="range.shape === '원' && range.radius > 0" :cx="range.drawX" :cy="range.drawY" :r="range.radius" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <rect v-else-if="range.shape === '사각형' && range.width > 0" :x="range.drawX" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                </g>
              </svg>
     
              <div class="team-box">
                <div v-for="char in activeChars(1)" :key="char.instanceId" class="char-card" :class="{ 'selected-hero': selectedHeroName === char.name }" :id="'char-' + char.instanceId" draggable="true" @dragstart="onDragStart($event, char, 1)" @drag="onDragging" @click.stop="handleHeroSelect(char, 1)" @contextmenu.prevent="removeHero(char, 1)" :title="`${char.name}`" :style="{ top: char.position.top + 'px', left: char.position.left + 'px', borderColor: char.color || '#3b82f6' }">
                  <div class="avatar-box">
                    <img :src="getHeroImage(char.id)" @error="handleImageError" :alt="char.name" class="char-avatar" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="boss-arena-section" @click="selectStatusTeam(1)">
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
                  <path v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" :d="range.pathD" :transform="`translate(${range.bossDrawX - range.drawX}, 0)`" :fill="range.color" fill-opacity="0.25" :stroke="range.color" stroke-width="2" />
                  <circle v-else-if="range.shape === '원' && range.radius > 0" :cx="range.bossDrawX" :cy="range.drawY" :r="range.radius" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <rect v-else-if="range.shape === '사각형' && range.width > 0" :x="range.bossDrawX" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
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

        <div class="battle-pair-row reverse-layout">
          <div class="boss-arena-section reverse-boss" @click="selectStatusTeam('1_reverse')">
            <div class="boss-zone-header">
              <span class="boss-badge reverse-badge">{{ texts.arena.bossBadgeNightmare }}</span>
            </div>
            
            <div class="boss-arena-container-celestial reverse-container-shape">
              <div class="boss-grid-skeleton-celestial">
                <div v-for="i in 48" :key="'b1rev-cell-' + i" class="grid-cell boss-cell"></div>
              </div>         
              <div class="boss-overlay-card">
                <div class="boss-avatar-wrapper">
                  <span class="boss-emoji-large">😈</span>
                </div>
              </div>
            </div>
          </div>

          <div class="team-arena-section reverse-team" :class="{ 'active-team-focus': activeStatusTab === '1_reverse' }" @click="selectStatusTeam('1_reverse')">
            <div class="team-title-banner alliance reverse-banner">
              <h3>🛡️ 팀 1_r <span class="char-count">({{ getTeamCharCount('1_reverse') }}/48)</span></h3>
              <div style="display: flex; gap: 4px;" @click.stop>
                <button class="copy-team-btn" @click="copyToReverseTeam(1)">{{ texts.arena.teamCopyBtn }}</button>
                <button class="clear-team-btn" @click="clearTeam('1_reverse')">{{ texts.arena.teamClearBtn }}</button>
              </div>
            </div>

            <div class="arena-container-celestial reverse-arena-shape" :ref="el => setArenaRef(el, '1_reverse')" @dragover.prevent @drop="onDrop($event, '1_reverse')">
              <div class="skeleton-celestial">
                <div v-for="i in 48" :key="'trev-cell-' + i" class="grid-cell alliance-cell"></div>
              </div>
              <div class="team-box">
                <div v-for="char in activeChars('1_reverse')" :key="char.instanceId" class="char-card" :class="{ 'selected-hero': selectedHeroName === char.name }" :id="'char-' + char.instanceId" draggable="true" @dragstart="onDragStart($event, char, '1_reverse')" @drag="onDragging" @click.stop="handleHeroSelect(char, '1_reverse')" @contextmenu.prevent="removeHero(char, '1_reverse')" :title="`${char.name}`" :style="{ top: char.position.top + 'px', left: char.position.left + 'px', borderColor: char.color || '#3b82f6' }">
                  <div class="avatar-box">
                    <img :src="getHeroImage(char.id)" @error="handleImageError" :alt="char.name" class="char-avatar" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= [2] CELESTIAL MODE (천결) ================= -->
      <div v-else-if="boardCategory === 'celestial'" class="workspace-column unified-battlefield-column">
        <div v-for="teamNo in [1, 2, 3]" :key="'battle-pair-' + teamNo" class="battle-pair-row">
          <div class="team-arena-section" :class="{ 'active-team-focus': activeStatusTab === teamNo }" @click="selectStatusTeam(teamNo)">
            <div class="team-title-banner alliance">
              <h3>🛡️ 팀 {{ teamNo }} <span class="char-count">({{ getTeamCharCount(teamNo) }}/15)</span></h3>
              <div style="display: flex; gap: 4px;" @click.stop>
                <button class="copy-team-btn" @click="copyTeamDeckCode(teamNo)">{{ texts.arena.teamCopyBtn }}</button>
                <button class="clear-team-btn" @click="clearTeam(teamNo)">{{ texts.arena.teamClearBtn }}</button>
              </div>
            </div>
            <div class="arena-container-celestial" :ref="el => setArenaRef(el, teamNo)" @dragover.prevent @drop="onDrop($event, teamNo)">
              <div class="skeleton-celestial">
                <div v-for="i in 48" :key="'t'+teamNo+'-cell-' + i" class="grid-cell alliance-cell"></div>
              </div>

              <svg class="range-overlay-container">
                <g v-for="range in computedRanges[teamNo]" :key="'svg-t' + teamNo + '-' + range.instanceId">
                  <line :x1="range.startX" :y1="range.startY" :x2="range.endX" :y2="range.endY" :stroke="range.color" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7" />
                  <circle :cx="range.endX" :cy="range.endY" r="4.5" :fill="range.color" />
                  <path v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" :d="range.pathD" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <circle v-else-if="range.shape === '원' && range.radius > 0" :cx="range.drawX" :cy="range.drawY" :r="range.radius" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <rect v-else-if="range.shape === '사각형' && range.isForward && range.width > 0" :x="range.drawX" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <rect v-else-if="range.shape === '사각형' && !range.isForward && range.width > 0" :x="range.drawX - (range.width / 2)" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                </g>
              </svg>
              <div class="team-box">
                <div v-for="char in activeChars(teamNo)" :key="char.instanceId" class="char-card" :class="{ 'selected-hero': selectedHeroName === char.name }" :id="'char-' + char.instanceId" draggable="true" @dragstart="onDragStart($event, char, teamNo)" @drag="onDragging" @click.stop="handleHeroSelect(char, teamNo)" @contextmenu.prevent="removeHero(char, teamNo)" :title="`${char.name}`" :style="{ top: char.position.top + 'px', left: char.position.left + 'px', borderColor: char.color || '#3b82f6' }">
                  <div class="avatar-box">
                    <img :src="getHeroImage(char.id)" @error="handleImageError" :alt="char.name" class="char-avatar" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="boss-arena-section" @click="selectStatusTeam(teamNo)">
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
                  <path v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" :d="range.pathD" :transform="`translate(${range.bossDrawX - range.drawX}, 0)`" :fill="range.color" fill-opacity="0.25" :stroke="range.color" stroke-width="2" />
                  <circle v-else-if="range.shape === '원' && range.radius > 0" :cx="range.bossDrawX" :cy="range.drawY" :r="range.radius" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <rect v-else-if="range.shape === '사각형' && range.width > 0" :x="range.bossDrawX" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
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

      <!-- ================= [3] NIGHTMARE MODE (나이트메어/기본) ================= -->
      <div v-else class="workspace-column unified-battlefield-column">
        <div v-for="teamNo in [1, 2, 3]" :key="'battle-pair-' + teamNo" class="battle-pair-row">
          <div class="team-arena-section" :class="{ 'active-team-focus': activeStatusTab === teamNo }" @click="selectStatusTeam(teamNo)">
            <div class="team-title-banner alliance">
              <h3>🛡️ 팀 {{ teamNo }} <span class="char-count">({{ getTeamCharCount(teamNo) }}/15)</span></h3>
              <div style="display: flex; gap: 4px;" @click.stop>
                <button class="copy-team-btn" @click="copyTeamDeckCode(teamNo)">{{ texts.arena.teamCopyBtn }}</button>
                <button class="clear-team-btn" @click="clearTeam(teamNo)">{{ texts.arena.teamClearBtn }}</button>
              </div>
            </div>
            <div class="arena-container" :ref="el => setArenaRef(el, teamNo)" @dragover.prevent @drop="onDrop($event, teamNo)">
              <div class="grid-skeleton">
                <div v-for="i in 25" :key="'t'+teamNo+'-cell-' + i" class="grid-cell alliance-cell"></div>
              </div>

              <svg class="range-overlay-container">
                <g v-for="range in computedRanges[teamNo]" :key="'svg-t' + teamNo + '-' + range.instanceId">
                  <line :x1="range.startX" :y1="range.startY" :x2="range.endX" :y2="range.endY" :stroke="range.color" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7" />
                  <circle :cx="range.endX" :cy="range.endY" r="4.5" :fill="range.color" />
                  <path v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" :d="range.pathD" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <circle v-else-if="range.shape === '원' && range.radius > 0" :cx="range.drawX" :cy="range.drawY" :r="range.radius" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <rect v-else-if="range.shape === '사각형' && range.isForward && range.width > 0" :x="range.drawX" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <rect v-else-if="range.shape === '사각형' && !range.isForward && range.width > 0" :x="range.drawX - (range.width / 2)" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                </g>
              </svg>

              <!-- 카메라 마커 -->
              <div 
                v-if="cameraPositions && cameraPositions[teamNo]" 
                class="camera-marker"
                draggable="true"
                @dragstart="onCameraDragStart($event, teamNo)"
                @dragend="onCameraDragEnd"
                :style="{
                  position: 'absolute',
                  left: `${cameraPositions[teamNo].left}px`,
                  top: `${cameraPositions[teamNo].top}px`,
                  transform: 'translate(2px, 2px)',
                  zIndex: 100,
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 1px 2px rgba(255, 255, 255, 0.8)); pointer-events: none;">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>

              <div class="team-box">
                <div v-for="char in activeChars(teamNo)" :key="char.instanceId" class="char-card" :class="{ 'selected-hero': selectedHeroName === char.name }" :id="'char-' + char.instanceId" draggable="true" @dragstart="onDragStart($event, char, teamNo)" @drag="onDragging" @click.stop="handleHeroSelect(char, teamNo)" @contextmenu.prevent="removeHero(char, teamNo)" :title="`${char.name}`" :style="{ top: char.position.top + 'px', left: char.position.left + 'px', borderColor: char.color || '#3b82f6' }">
                  <div class="avatar-box">
                    <img :src="getHeroImage(char.id)" @error="handleImageError" :alt="char.name" class="char-avatar" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="boss-arena-section" @click="selectStatusTeam(teamNo)">
            <div class="boss-zone-header">
              <span class="boss-badge">{{ texts.arena.bossBadgeNightmare }}</span>
            </div>
            <div class="boss-arena-container">
              <div class="boss-grid-skeleton">
                <div v-for="i in 25" :key="'b'+teamNo+'-cell-' + i" class="grid-cell boss-cell"></div>
              </div>
              
              <svg class="range-overlay-container boss-range-svg">
                <g v-for="range in computedRanges[teamNo]" :key="'svg-boss-t' + teamNo + '-' + range.instanceId">
                  <line :x1="range.bossStartX" :y1="range.startY" :x2="range.bossEndX" :y2="range.endY" :stroke="range.color" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7" />
                  <path v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" :d="range.pathD" :transform="`translate(${range.bossDrawX - range.drawX}, 0)`" :fill="range.color" fill-opacity="0.25" :stroke="range.color" stroke-width="2" />
                  <circle v-else-if="range.shape === '원' && range.radius > 0" :cx="range.bossDrawX" :cy="range.drawY" :r="range.radius" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <rect v-else-if="range.shape === '사각형' && range.isForward && range.width > 0" :x="range.bossDrawX" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
                  <rect v-else-if="range.shape === '사각형' && !range.isForward && range.width > 0" :x="range.bossDrawX - (range.width / 2)" :y="range.drawY - (range.height / 2)" :width="range.width" :height="range.height" :fill="range.color" fill-opacity="0.22" :stroke="range.color" stroke-width="1.5" />
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
      </div>

      <!-- ➡️ (오른쪽 영역) 영웅 보관함 -->
      <div class="workspace-column right-pool-column">
        <div class="right-pool-header">
          <div class="pool-title-row">
            <h3>{{ texts.heroPool.title }}</h3>
            <span class="pool-tip">{{ texts.heroPool.dragTip }}</span>
            <button
              v-if="isAdmin"
              class="sync-effect-btn"
              :disabled="isSyncingEffects"
              @click="syncCharEffects"
              title="skia_char_buff 테이블에서 버프/디버프 목록을 일괄 가져옵니다"
            >
              {{ isSyncingEffects ? '동기화 중...' : '🔄 효과 동기화' }}
            </button>
            <input v-model="heroSearchKeyword" type="text" :placeholder="texts.heroPool.searchPlaceholder" class="hero-search-input" />
          </div>

          <!-- 1) 등급 버튼: 전체 / 하이로드 / 레전드+ / 레전드 -->
          <div class="filter-tab-bar">
            <button
              v-for="grade in texts.heroPool.gradeFilters"
              :key="grade.key"
              :class="['filter-tab-btn', { active: heroPoolFilter === grade.key }]"
              @click="heroPoolFilter = grade.key"
            >
              {{ grade.label }}
            </button>
          </div>

          <!-- 2) 해시태그 7종: #치확&저항 #피해 #이외 #피해량 #CC&시너지 #디버프 #유틸 -->
          <div class="filter-tab-bar hashtag-tab-bar">
            <button
              v-for="tag in texts.effectTagTabs"
              :key="tag.key"
              :class="['filter-tab-btn tag-filter-btn', { active: heroPoolFilter === tag.key }]"
              @click="heroPoolFilter = tag.key"
            >
              {{ tag.label }}
            </button>
          </div>
        </div>

        <!-- 오른쪽 세로 스크롤 영웅 리스트 -->
        <div class="right-pool-scroll-container">
          <!-- 등급 모드 (전체 / 하이로드 / 레전드+ / 레전드) -->
          <div v-if="!isEffectTagMode" class="right-hero-grid">
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
                <span v-if="isHeroPlaced(hero.id)" class="in-team-badge">T{{ getAssignedTeam(hero.id) || 'IN' }}</span>
              </div>
              <span class="hero-mini-name">{{ hero.name }}</span>
            </div>
          </div>

          <!-- 해시태그 모드 (#치확&저항 ~ #유틸) -->
          <div v-else class="right-tag-grouped-container">
            <div v-for="group in groupedTagHeroes" :key="group.effectCode || group.effectName" class="buff-group-box">
              <div class="buff-group-box-title" :class="group.tagKey === 'DEBUFF' ? 'text-debuff' : 'text-buff'">
                {{ group.effectNameShort }}
              </div>
              <div 
                v-for="hero in group.heroes" 
                :key="hero.id" 
                class="pool-hero-item has-val" 
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
                <span v-if="hero.effectValue" class="hero-mini-val">{{ hero.effectValue }}</span>
              </div>
            </div>
            <div v-if="groupedTagHeroes.length === 0" class="no-data-msg">{{ texts.heroPool.noBuffHero }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ⬇️ (하단 영역) 실시간 현황판 (T1/T2/T3 버튼 삭제, 전장 팀 클릭 연동) -->
    <div class="bottom-status-zone">
      <div class="bottom-status-header">
        <div class="status-team-indicator">
          <span class="team-focus-badge">🛡️ {{ getStatusTabLabel }} 현황</span>
          <span class="team-focus-hint">※ 위 전장에서 팀1 / 팀2 / 팀3 빈칸을 클릭하면 전환됩니다</span>
        </div>

        <!-- 8개 해시태그 탭: #치확&저항 #피해 #이외 #피해량 #CC&시너지 #디버프 #유틸 #캐릭터 -->
        <div class="board-type-tab-menu">
          <button
            v-for="tab in texts.statusBoard.boardTabs"
            :key="tab.key"
            :class="['type-tab-btn', { active: activeBoardType === tab.key }]"
            @click="activeBoardType = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- [A] 해시태그 7종 현황판 -->
      <div v-if="activeBoardType !== 'INFO'" class="bottom-status-body">
        <div class="bottom-grid-container" v-if="filteredBoardEffectList.length > 0">
          <div v-for="item in filteredBoardEffectList" :key="item.effectCode" class="grid-item">
            <div class="item-header" :class="{ 'debuff-header': item.tagKey === 'DEBUFF' }" :title="item.effectName">
              {{ item.effectNameShort }}
            </div>
            <div class="item-body">
              <template v-if="item.sources.length > 0">
                <div v-for="(src, idx) in item.sources" :key="src.charName + '-' + src.skillDesc + '-' + src.teamNo + '-' + idx" class="source-row">
                  <div class="char-info">
                    <span class="char-name" :class="{ 'highlight-yellow': selectedHeroName === src.charName }">
                      {{ src.charName }} 
                      <span class="skill-desc">[{{ src.skillDesc }}]</span>
                    </span>
                  </div>
                  <span class="effect-val-text">{{ src.charValue }}</span>
                </div>
              </template>
              <template v-else>
                <div class="empty-source-text">-</div>
              </template>
            </div>
          </div>
        </div>
        <div v-else class="empty-status-alert compact-alert">{{ texts.statusBoard.emptyEffect }}</div>
      </div>

      <!-- [B] #캐릭터 상세 정보 현황판 -->
      <div v-else class="bottom-status-body p-3">
        <div v-if="selectedHeroDetail" class="hero-detail-container">
          <!-- 상단 프로필 요약 헤더 -->
          <div class="profile-header-card">
            <div class="profile-avatar-box">
              <img :src="getHeroImage(selectedHeroDetail.id)" @error="handleImageError" class="hero-detail-avatar" />
              <div class="hero-header-text">
                <h4 class="hero-detail-title">{{ selectedHeroDetail.name }}</h4>
                <span class="hero-detail-code">ID: {{ selectedHeroDetail.id }}</span>
              </div>
            </div>
          </div>

          <!-- 기본 스킬/공격 정보 카드 -->
          <div class="effect-group-box info-group">
            <div class="buff-card-list">
              <!-- 1. 일반공격 -->
              <div class="buff-item-card card-info">
                <div class="buff-item-left">
                  <span class="skill-label">일반공격</span>
                  <div class="skill-details-wrapper">
                    <div class="info-row-primary">
                      <span class="buff-name text-truncate">{{ selectedHeroDetail.normal_damage_name || '일반공격' }}</span>
                      <span class="buff-val text-yellow">{{ selectedHeroDetail.normal_damage }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. 치명타공격 -->
              <div class="buff-item-card card-info">
                <div class="buff-item-left">
                  <span class="skill-label label-crit">치명타공격</span>
                  <div class="skill-details-wrapper">
                    <div class="info-row-primary">
                      <span class="buff-name text-truncate">{{ selectedHeroDetail.critSdc02_damage_name || '치명타피해량' }}</span>
                      <span class="buff-val text-yellow">{{ selectedHeroDetail.critSdc02_value }}</span>
                      <span v-if="selectedHeroDetail.critSdc02_damage && selectedHeroDetail.critSdc02_damage !== '0%' && selectedHeroDetail.critSdc02_damage !== '-'" class="buff-max-badge">
                        MAX {{ selectedHeroDetail.critSdc02_damage }}
                      </span>
                      <span class="slash-divider">/</span>
                      <span class="buff-sub-val text-blue">사거리: {{ selectedHeroDetail.critSdc02_range }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3. 액티브스킬 -->
              <div class="buff-item-card card-info card-active-skill">
                <div class="buff-item-left">
                  <span class="skill-label label-active">액티브스킬</span>
                  <div class="skill-details-wrapper">
                    <div class="info-row-primary">
                      <span class="buff-name text-truncate">{{ selectedHeroDetail.activeSdc01_skill_name || '공격력피해량' }}</span>
                      <span class="buff-val text-red-main">{{ selectedHeroDetail.activeSdc01_effect_value }}</span>
                      <template v-if="selectedHeroDetail.activeSdc01_damage && selectedHeroDetail.activeSdc01_damage !== '-' && selectedHeroDetail.activeSdc01_damage !== selectedHeroDetail.activeSdc01_effect_value">
                        <span class="buff-val buff-max-badge">MAX {{ selectedHeroDetail.activeSdc01_damage }}</span>
                      </template>
                    </div>
                    <div class="info-row-secondary">
                      <span class="meta-tag">{{ selectedHeroDetail.activeSdc01_shape || '-' }}</span>
                      <span class="meta-tag area-tag">{{ selectedHeroDetail.activeSdc01_area || '-' }}</span>
                      <div class="meta-stats">
                        <span class="stat-item"><span class="stat-label">사거리:</span><span class="stat-val text-yellow">{{ selectedHeroDetail.activeSdc01_range }}</span></span>
                        <span class="stat-divider">|</span>
                        <span class="stat-item"><span class="stat-label">쿨:</span><span class="stat-val text-yellow">{{ selectedHeroDetail.activeSdc01_cooldown }}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 스킬 및 버프/디버프 상세 목록 영역 -->
          <div class="hero-buff-list-box mt-3">
            <div v-if="selectedHeroDetail.buffs && selectedHeroDetail.buffs.length > 0" class="buff-category-wrapper">
              <!-- 자신 버프 -->
              <div v-if="getBuffsByCategory('SELF_BUFF').length > 0" class="effect-group-box self-group">
                <div class="group-header-label text-self"><span>👤 자신 버프</span></div>
                <div class="buff-card-list">
                  <div v-for="b in getBuffsByCategory('SELF_BUFF')" :key="b.buff_seq" class="buff-item-card card-self">
                    <div class="buff-item-left">
                      <span class="skill-type-badge" :class="b.skill_code === 'SKI02' ? 'badge-crit' : b.skill_code === 'SKI01' ? 'badge-normal' : 'badge-active'">
                        {{ b.skill_code === 'SKI02' ? 'C' : b.skill_code === 'SKI01' ? 'N' : 'A' }}
                      </span>
                      <span class="buff-name text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                      <span class="buff-val">{{ b.effect_value }}{{ b.unit || '%' }}</span>
                      <span v-if="b.max_value != null && b.max_value > 0" class="buff-max-label">MAX: {{ b.max_value }}{{ b.unit || '%' }}</span>
                    </div>
                    <div class="buff-item-right">
                      <span class="sub-info">지속: {{ b.duration || '0.0' }}s</span>
                      <span class="divider">|</span>
                      <span class="sub-info">중첩: {{ b.max_stack || 1 }}</span>
                      <span class="divider">|</span>
                      <span class="sub-info">타격: {{ b.hit_count || 1 }}회</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 아군 버프 -->
              <div v-if="getBuffsByCategory('TEAM_BUFF').length > 0" class="effect-group-box team-group">
                <div class="group-header-label text-team"><span>🛡️ 아군 버프</span></div>
                <div class="buff-card-list">
                  <div v-for="b in getBuffsByCategory('TEAM_BUFF')" :key="b.buff_seq" class="buff-item-card card-team">
                    <div class="buff-item-left">
                      <span class="skill-type-badge" :class="b.skill_code === 'SKI02' ? 'badge-crit' : b.skill_code === 'SKI01' ? 'badge-normal' : 'badge-active'">
                        {{ b.skill_code === 'SKI02' ? 'C' : b.skill_code === 'SKI01' ? 'N' : 'A' }}
                      </span>
                      <span class="buff-name text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                      <span class="buff-val text-green">{{ b.effect_value }}{{ b.unit || '%' }}</span>
                      <span v-if="b.max_value != null && b.max_value > 0" class="buff-max-label">MAX: {{ b.max_value }}{{ b.unit || '%' }}</span>
                    </div>
                    <div class="buff-item-right">
                      <span class="sub-info">지속: {{ b.duration || '0.0' }}s</span>
                      <span class="divider">|</span>
                      <span class="sub-info">중첩: {{ b.max_stack || 1 }}</span>
                      <span class="divider">|</span>
                      <span class="sub-info">타격: {{ b.hit_count || 1 }}회</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 적군 디버프 -->
              <div v-if="getBuffsByCategory('DEBUFF').length > 0" class="effect-group-box debuff-group">
                <div class="group-header-label text-debuff"><span>⚔️ 적군 디버프</span></div>
                <div class="buff-card-list">
                  <div v-for="b in getBuffsByCategory('DEBUFF')" :key="b.buff_seq" class="buff-item-card card-debuff">
                    <div class="buff-item-left">
                      <span class="skill-type-badge" :class="b.skill_code === 'SKI02' ? 'badge-crit' : b.skill_code === 'SKI01' ? 'badge-normal' : 'badge-active'">
                        {{ b.skill_code === 'SKI02' ? 'C' : b.skill_code === 'SKI01' ? 'N' : 'A' }}
                      </span>
                      <span class="buff-name text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                      <span class="buff-val text-red">{{ b.effect_value }}{{ b.unit || '%' }}</span>
                      <span v-if="b.max_value != null && b.max_value > 0" class="buff-max-label">MAX: {{ b.max_value }}{{ b.unit || '%' }}</span>
                    </div>
                    <div class="buff-item-right">
                      <span class="sub-info">지속: {{ b.duration || '0.0' }}s</span>
                      <span class="divider">|</span>
                      <span class="sub-info">중첩: {{ b.max_stack || 1 }}</span>
                      <span class="divider">|</span>
                      <span class="sub-info">타격: {{ b.hit_count || 1 }}회</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-text">- 등록된 스킬/버프 정보가 없습니다. -</div>
          </div>
        </div>

        <div v-else class="empty-status-alert compact-alert">
          {{ isLoadingHeroDetail ? '캐릭터 정보를 불러오는 중입니다...' : '전장에서 캐릭터를 선택하면 상세 정보가 표시됩니다.' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useDeckBuild } from '../composables/useDeckBuild.js';
import { DASHBOARD_TEXTS } from '../constants/dashboardTexts.js';

const texts = DASHBOARD_TEXTS;

const props = defineProps({
  boardCategory: { type: String, default: 'nightmare' }
});

const configMap = {
  nightmare: { gridRows: 5, gridCols: 5, boardCategory: 'nightmare', maxTeamMembers: 15, initialSkillClass: '액티브공격', prefetchCommonCodes: true },
  descent: { gridRows: 8, gridCols: 6, boardCategory: 'descent', maxTeamMembers: 48, cardWidth: 38, cardHeight: 38 },
  celestial: { gridRows: 8, gridCols: 6, boardCategory: 'celestial', fallbackBoardCategory: 'nightmare', maxTeamMembers: 15, initialSkillClass: '액티브공격', cardWidth: 36, cardHeight: 36 }
};

const cfg = configMap[props.boardCategory] || configMap.nightmare;

const {
  isAdmin,
  isSyncingEffects,
  syncCharEffects,
  selectedBoardDeck,
  boardDecks,
  selectedSkillClass,
  setArenaRef,
  heroPoolFilter,
  isEffectTagMode,
  heroSearchKeyword,
  selectedHeroName,
  activeChars,
  getTeamCharCount,
  getAssignedTeam,
  isHeroPlaced,
  filteredHeroPool,
  groupedTagHeroes,
  loadSelectedBoardDeck,
  computedRanges,
  calculateAllRanges,
  cameraPositions,
  onDragStart,
  onDragStartFromPool,
  onDragging,
  onDrop,
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
  onCameraDragStart,
  onCameraDragEnd,
  filteredBoardEffectList,
  selectedHeroDetail,
  isLoadingHeroDetail,
  getBuffsByCategory,
  handleHeroSelect
} = useDeckBuild(cfg);

const headerText = computed(() => texts.header[props.boardCategory] || texts.header.nightmare);

const controls = computed(() => {
  if (props.boardCategory === 'descent') return { deckLabel: texts.controls.descentDeckLabel };
  if (props.boardCategory === 'celestial') return { deckLabel: texts.controls.celestialDeckLabel };
  return { deckLabel: texts.controls.nightmareDeckLabel };
});
</script>

<style scoped>
@import "../assets/styles/deck-build.css";
</style>