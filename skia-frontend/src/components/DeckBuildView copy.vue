<template>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght=100..900&family=Pretendard:wght=100..900&display=swap" rel="stylesheet">

  <div class="arena-wrapper">    
    <!-- Top header & controls (variant-specific texts inside) -->
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
          <select v-model="selectedSkillClass" class="cyber-select">
            <option v-for="opt in texts.controls.skillOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Main workspace: render variant-specific layout -->
    <div class="main-workspace-zone">
      <!-- ================= [1] DESCENT MODE (강림) ================= -->
      <div v-if="boardCategory === 'descent'" class="workspace-column unified-battlefield-column-descent">
        <!-- Team 1 강림 (아군 좌측 / 보스 우측) -->
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

              <!-- 강림 팀 1 아군 SVG -->
              <svg class="range-overlay-container">
                <g v-for="range in computedRanges[1]" :key="'svg-t1-' + range.instanceId">
                  <line :x1="range.startX" :y1="range.startY" :x2="range.endX" :y2="range.endY" :stroke="range.color" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7" />
                  <circle :cx="range.endX" :cy="range.endY" r="4.5" :fill="range.color" />
                  
                  <path 
                    v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" 
                    :d="range.pathD" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />

                  <circle 
                    v-else-if="range.shape === '원' && range.radius > 0" 
                    :cx="range.drawX" 
                    :cy="range.drawY" 
                    :r="range.radius" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />

                  <rect 
                    v-else-if="range.shape === '사각형' && range.width > 0" 
                    :x="range.drawX" 
                    :y="range.drawY - (range.height / 2)" 
                    :width="range.width" 
                    :height="range.height" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />
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

          <!-- 강림 팀 1 우측 보스 격자판 -->
          <div class="boss-arena-section">
            <div class="boss-zone-header">              
              <span class="boss-badge">{{ texts.arena.bossBadgeNightmare }}</span>
            </div>
            
            <div class="boss-arena-container-celestial">
              <div class="boss-grid-skeleton-celestial">
                <div v-for="i in 48" :key="'b1-cell-' + i" class="grid-cell boss-cell"></div>
              </div>

              <!-- 강림 팀 1 보스 영역 SVG -->
              <svg class="range-overlay-container boss-range-svg">
                <g v-for="range in computedRanges[1]" :key="'svg-boss-t1-' + range.instanceId">
                  <line :x1="range.bossStartX" :y1="range.startY" :x2="range.bossEndX" :y2="range.endY" :stroke="range.color" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7" />
                  
                  <path 
                    v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" 
                    :d="range.pathD" 
                    :transform="`translate(${range.bossDrawX - range.drawX}, 0)`"
                    :fill="range.color" 
                    fill-opacity="0.25" 
                    :stroke="range.color" 
                    stroke-width="2" 
                  />
                  
                  <circle 
                    v-else-if="range.shape === '원' && range.radius > 0" 
                    :cx="range.bossDrawX" 
                    :cy="range.drawY" 
                    :r="range.radius" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />

                  <rect 
                    v-else-if="range.shape === '사각형' && range.width > 0" 
                    :x="range.bossDrawX" 
                    :y="range.drawY - (range.height / 2)" 
                    :width="range.width" 
                    :height="range.height" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />
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

        <!-- 팀 1_reverse (보스 좌측 / 아군 우측) -->
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
              <div class="boss-overlay-card">
                <div class="boss-avatar-wrapper">
                  <span class="boss-emoji-large">😈</span>
                </div>
              </div>
            </div>
          </div>

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

      <!-- ================= [2] CELESTIAL MODE (천결) ================= -->
      <div v-else-if="boardCategory === 'celestial'" class="workspace-column unified-battlefield-column">
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
              <div class="skeleton-celestial">
                <div v-for="i in 48" :key="'t'+teamNo+'-cell-' + i" class="grid-cell alliance-cell"></div>
              </div>
<!-- ✨ 천결 아군 영역 SVG 추가 -->
              <svg class="range-overlay-container">
                <g v-for="range in computedRanges[teamNo]" :key="'svg-t' + teamNo + '-' + range.instanceId">
                  <line 
                    :x1="range.startX" 
                    :y1="range.startY" 
                    :x2="range.endX" 
                    :y2="range.endY" 
                    :stroke="range.color" 
                    stroke-width="2.5" 
                    stroke-dasharray="6,4" 
                    opacity="0.7" 
                  />
                  <circle :cx="range.endX" :cy="range.endY" r="4.5" :fill="range.color" />
                  
                  <path 
                    v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" 
                    :d="range.pathD" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />

                  <circle 
                    v-else-if="range.shape === '원' && range.radius > 0" 
                    :cx="range.drawX" 
                    :cy="range.drawY" 
                    :r="range.radius" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />

                  <rect 
                    v-else-if="range.shape === '사각형' && range.isForward && range.width > 0" 
                    :x="range.drawX" 
                    :y="range.drawY - (range.height / 2)" 
                    :width="range.width" 
                    :height="range.height" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />

                  <rect 
                    v-else-if="range.shape === '사각형' && !range.isForward && range.width > 0" 
                    :x="range.drawX - (range.width / 2)" 
                    :y="range.drawY - (range.height / 2)" 
                    :width="range.width" 
                    :height="range.height" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />
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
              
              <!-- 천결 보스 영역 SVG -->
              <svg class="range-overlay-container boss-range-svg">
                <g v-for="range in computedRanges[teamNo]" :key="'svg-boss-t'+teamNo+'-' + range.instanceId">
                  <line :x1="range.bossStartX" :y1="range.startY" :x2="range.bossEndX" :y2="range.endY" :stroke="range.color" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7" />
                  
                  <path 
                    v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" 
                    :d="range.pathD" 
                    :transform="`translate(${range.bossDrawX - range.drawX}, 0)`"
                    :fill="range.color" 
                    fill-opacity="0.25" 
                    :stroke="range.color" 
                    stroke-width="2" 
                  />
                  
                  <circle 
                    v-else-if="range.shape === '원' && range.radius > 0" 
                    :cx="range.bossDrawX" 
                    :cy="range.drawY" 
                    :r="range.radius" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />
                    
                  <rect 
                    v-else-if="range.shape === '사각형' && range.width > 0" 
                    :x="range.bossDrawX" 
                    :y="range.drawY - (range.height / 2)" 
                    :width="range.width" 
                    :height="range.height" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />
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
          
          <!-- [좌측] 아군 격자판 -->
          <div class="team-arena-section">
            <div class="team-title-banner alliance">
              <h3>🛡️ TEAM {{ teamNo }} <span class="char-count">({{ getTeamCharCount(teamNo) }}/15)</span></h3>
              <div style="display: flex; gap: 4px;">
                <button class="copy-team-btn" @click="copyTeamDeckCode(teamNo)">{{ texts.arena.teamCopyBtn }}</button>
                <button class="clear-team-btn" @click="clearTeam(teamNo)">{{ texts.arena.teamClearBtn }}</button>
              </div>
            </div>
            <div class="arena-container" :ref="el => setArenaRef(el, teamNo)" @dragover.prevent @drop="onDrop($event, teamNo)">
              <div class="grid-skeleton">
                <div v-for="i in 25" :key="'t'+teamNo+'-cell-' + i" class="grid-cell alliance-cell"></div>
              </div>

              <!-- [좌측] 아군 격자판 내 SVG -->
              <svg class="range-overlay-container">
                <g v-for="range in computedRanges[teamNo]" :key="'svg-t' + teamNo + '-' + range.instanceId">
                  <line 
                    :x1="range.startX" 
                    :y1="range.startY" 
                    :x2="range.endX" 
                    :y2="range.endY" 
                    :stroke="range.color" 
                    stroke-width="2.5" 
                    stroke-dasharray="6,4" 
                    opacity="0.7" 
                  />
                  <circle :cx="range.endX" :cy="range.endY" r="4.5" :fill="range.color" />
                  
                  <path 
                    v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" 
                    :d="range.pathD" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />

                  <circle 
                    v-else-if="range.shape === '원' && range.radius > 0" 
                    :cx="range.drawX" 
                    :cy="range.drawY" 
                    :r="range.radius" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />

                  <rect 
                    v-else-if="range.shape === '사각형' && range.isForward && range.width > 0" 
                    :x="range.drawX" 
                    :y="range.drawY - (range.height / 2)" 
                    :width="range.width" 
                    :height="range.height" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />

                  <rect 
                    v-else-if="range.shape === '사각형' && !range.isForward && range.width > 0" 
                    :x="range.drawX - (range.width / 2)" 
                    :y="range.drawY - (range.height / 2)" 
                    :width="range.width" 
                    :height="range.height" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />
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
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#111111" 
                  stroke-width="1.8" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                  style="filter: drop-shadow(0px 1px 2px rgba(255, 255, 255, 0.8)); pointer-events: none;"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>

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

          <!-- [우측] 보스 격자판 -->
          <div class="boss-arena-section">
            <div class="boss-zone-header">
              <span class="boss-badge">{{ texts.arena.bossBadgeNightmare }}</span>
            </div>
            <div class="boss-arena-container">
              <div class="boss-grid-skeleton">
                <div v-for="i in 25" :key="'b'+teamNo+'-cell-' + i" class="grid-cell boss-cell"></div>
              </div>
              
              <svg class="range-overlay-container boss-range-svg">
                <g v-for="range in computedRanges[teamNo]" :key="'svg-boss-t' + teamNo + '-' + range.instanceId">
                  <line 
                    :x1="range.bossStartX" 
                    :y1="range.startY" 
                    :x2="range.bossEndX" 
                    :y2="range.endY" 
                    :stroke="range.color" 
                    stroke-width="2.5" 
                    stroke-dasharray="6,4" 
                    opacity="0.7" 
                  />
                  
                  <path 
                    v-if="(range.shape === '부채꼴' || range.shape === '반원') && range.pathD" 
                    :d="range.pathD" 
                    :transform="`translate(${range.bossDrawX - range.drawX}, 0)`"
                    :fill="range.color" 
                    fill-opacity="0.25" 
                    :stroke="range.color" 
                    stroke-width="2" 
                  />
                  
                  <circle 
                    v-else-if="range.shape === '원' && range.radius > 0" 
                    :cx="range.bossDrawX" 
                    :cy="range.drawY" 
                    :r="range.radius" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />
                    
                  <rect 
                    v-else-if="range.shape === '사각형' && range.isForward && range.width > 0" 
                    :x="range.bossDrawX" 
                    :y="range.drawY - (range.height / 2)" 
                    :width="range.width" 
                    :height="range.height" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />

                  <rect 
                    v-else-if="range.shape === '사각형' && !range.isForward && range.width > 0" 
                    :x="range.bossDrawX - (range.width / 2)" 
                    :y="range.drawY - (range.height / 2)" 
                    :width="range.width" 
                    :height="range.height" 
                    :fill="range.color" 
                    fill-opacity="0.22" 
                    :stroke="range.color" 
                    stroke-width="1.5" 
                  />
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

      <!-- ➡️ (오른쪽 세로) 탭 및 현황판 -->
      <div class="workspace-column status-column">
        <div class="status-board-container-vertical">
          <div class="status-tab-menu">
            <button v-for="tab in statusTabs" :key="tab.val" :class="['status-tab-btn', { active: activeStatusTab === tab.val }]" @click="activeStatusTab = tab.val">
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
              <div v-else class="empty-status-alert compact-alert">{{ texts.statusBoard.emptyDebuff }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ================= 최하단 영웅 보관함 ================= -->
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
  nightmare: { gridRows: 5, gridCols: 5, boardCategory: 'nightmare', maxTeamMembers: 15, initialSkillClass: 'nightmare', prefetchCommonCodes: true },
  descent: { gridRows: 8, gridCols: 6, boardCategory: 'descent', maxTeamMembers: 48, cardWidth: 38, cardHeight: 38 },
  celestial: { gridRows: 8, gridCols: 6, boardCategory: 'celestial', fallbackBoardCategory: 'nightmare', maxTeamMembers: 15, initialSkillClass: 'celestial', cardWidth: 36, cardHeight: 36 }
};

const cfg = configMap[props.boardCategory] || configMap.nightmare;

const {
  isPoolCollapsed,
  selectedBoardDeck,
  boardDecks,
  selectedSkillClass,
  setArenaRef,
  heroGradeFilter,
  heroSearchKeyword,
  selectedHeroName,
  selectHero,
  activeChars,
  getTeamCharCount,
  getAssignedTeam,
  isHeroPlaced,
  filteredHeroPool,
  buffSubFilter,
  groupedBuffHeroes,
  loadSelectedBoardDeck,
  computedRanges,
  cameraPositions,
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
  copyToReverseTeam,
  openBuffModal,
  onCameraDragStart,
  onCameraDragEnd,
  filteredEffectGroupedList,
  filteredDebuffGroupedList
} = useDeckBuild(cfg);

const headerText = computed(() => texts.header[props.boardCategory] || texts.header.nightmare);

const controls = computed(() => {
  if (props.boardCategory === 'descent') return { deckLabel: texts.controls.descentDeckLabel };
  if (props.boardCategory === 'celestial') return { deckLabel: texts.controls.celestialDeckLabel };
  return { deckLabel: texts.controls.deckSelectLabel };
});

const statusTabs = computed(() => {
  if (props.boardCategory === 'descent') return [{ val: 1, label: '🛡️ T1' }, { val: '1_reverse', label: '🛡️ T1_reverse' }];
  return [{ val: 1, label: '🛡️ T1' }, { val: 2, label: '🛡️ T2' }, { val: 3, label: '🛡️ T3' }];
});
</script>

<style scoped>
@import "../assets/styles/deck-build.css";
</style>