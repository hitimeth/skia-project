<template>
  <div class="skia-char-info-wrapper">
    <!-- 상단 메인 탭 (신규영웅 / 영웅비교) -->
    <div class="main-tab-bar">
      <button 
        :class="['main-tab-btn', { active: activeDetailTab === 'new' }]" 
        @click="activeDetailTab = 'new'"
      >
        ✨ 신규영웅 ({{ targetDeckCodes.length > 0 ? targetDeckCodes.join(' / ') : '조회중' }})
      </button>
      <button 
        :class="['main-tab-btn', { active: activeDetailTab === 'compare' }]" 
        @click="activeDetailTab = 'compare'"
      >
        ⚔️ 영웅비교 (최대 5종)
      </button>
    </div>

    <!-- ================= [1] TAB: 신규영웅 (최신 5종 가로 스크롤 디스플레이) ================= -->
    <div v-if="activeDetailTab === 'new'" class="horizontal-scroll-board">
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

            <!-- 5x5 전장판 & 사거리 오버레이 -->
            <div class="mini-battlefield-wrapper mt-2">
              <div class="mini-battle-pair-row">
                <div class="mini-team-arena">
                  <div class="mini-grid-skeleton">
                    <div v-for="n in 25" :key="'t-cell-' + n" class="mini-grid-cell"></div>
                    <div class="mini-char-card center-placed-hero">
                      <img :src="getHeroImage(getHeroDetailByCode(code).id)" @error="handleImageError" class="mini-char-img" />
                    </div>
                  </div>
                </div>

                <div class="mini-boss-arena">
                  <div class="mini-grid-skeleton">
                    <div v-for="n in 25" :key="'b-cell-' + n" class="mini-grid-cell"></div>
                    <div class="mini-boss-card center-placed-boss">
                      <span class="mini-boss-emoji">😈</span>
                    </div>
                  </div>
                </div>

                <svg 
                  v-if="getMiniRangeData(getHeroDetailByCode(code))" 
                  class="mini-full-range-overlay" 
                  viewBox="0 0 200 100" 
                  preserveAspectRatio="none"
                >
                  <template v-for="r in [getMiniRangeData(getHeroDetailByCode(code))]" :key="'mini-rng-' + code">
                    <line 
                      :x1="r.startX" :y1="r.startY" :x2="r.endX" :y2="r.endY" 
                      :stroke="r.color" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.85" 
                    />
                    <circle :cx="r.endX" :cy="r.endY" r="2.2" :fill="r.color" />

                    <path 
                      v-if="(r.shape === '부채꼴' || r.shape === '반원') && r.pathD" 
                      :d="r.pathD" 
                      :fill="r.color" fill-opacity="0.22" 
                      :stroke="r.color" stroke-width="1.2" 
                    />
                    <circle 
                      v-else-if="r.shape === '원' && r.radius > 0" 
                      :cx="r.drawX" :cy="r.drawY" :r="r.radius" 
                      :fill="r.color" fill-opacity="0.22" 
                      :stroke="r.color" stroke-width="1.2" 
                    />
                    <rect 
                      v-else-if="r.shape === '사각형' && r.isForward && r.width > 0" 
                      :x="r.drawX" :y="r.drawY - (r.height / 2)" 
                      :width="r.width" :height="r.height" 
                      :fill="r.color" fill-opacity="0.22" 
                      :stroke="r.color" stroke-width="1.2" 
                    />
                    <rect 
                      v-else-if="r.shape === '사각형' && !r.isForward && r.width > 0" 
                      :x="r.drawX - (r.width / 2)" :y="r.drawY - (r.height / 2)" 
                      :width="r.width" :height="r.height" 
                      :fill="r.color" fill-opacity="0.22" 
                      :stroke="r.color" stroke-width="1.2" 
                    />
                  </template>
                </svg>
              </div>
            </div>

            <!-- 기본 스킬/공격 정보 카드 -->
            <div class="effect-group-box info-group mt-2">
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

    <!-- ================= [2] TAB: 영웅비교 (자동완성 검색형 5종 가로 스크롤) ================= -->
    <div v-else-if="activeDetailTab === 'compare'" class="horizontal-scroll-board">
      <div 
        v-for="index in 5" 
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
              :placeholder="`🔍 영웅 ${index} 이름/ID 검색...`"
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

            <!-- 영웅비교용 미니 전장판 -->
            <div class="mini-battlefield-wrapper mt-2">
              <div class="mini-battle-pair-row">
                <div class="mini-team-arena">
                  <div class="mini-grid-skeleton">
                    <div v-for="n in 25" :key="'cb-t-cell-' + n" class="mini-grid-cell"></div>
                    <div class="mini-char-card center-placed-hero">
                      <img :src="getHeroImage(compareHeroDetails[index - 1].id)" @error="handleImageError" class="mini-char-img" />
                    </div>
                  </div>
                </div>

                <div class="mini-boss-arena">
                  <div class="mini-grid-skeleton">
                    <div v-for="n in 25" :key="'cb-b-cell-' + n" class="mini-grid-cell"></div>
                    <div class="mini-boss-card center-placed-boss">
                      <span class="mini-boss-emoji">😈</span>
                    </div>
                  </div>
                </div>

                <svg 
                  v-if="getMiniRangeData(compareHeroDetails[index - 1])" 
                  class="mini-full-range-overlay" 
                  viewBox="0 0 200 100" 
                  preserveAspectRatio="none"
                >
                  <template v-for="r in [getMiniRangeData(compareHeroDetails[index - 1])]" :key="'mini-cmp-rng-' + index">
                    <line 
                      :x1="r.startX" :y1="r.startY" :x2="r.endX" :y2="r.endY" 
                      :stroke="r.color" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.85" 
                    />
                    <circle :cx="r.endX" :cy="r.endY" r="2.2" :fill="r.color" />

                    <path 
                      v-if="(r.shape === '부채꼴' || r.shape === '반원') && r.pathD" 
                      :d="r.pathD" 
                      :fill="r.color" fill-opacity="0.22" 
                      :stroke="r.color" stroke-width="1.2" 
                    />
                    <circle 
                      v-else-if="r.shape === '원' && r.radius > 0" 
                      :cx="r.drawX" :cy="r.drawY" :r="r.radius" 
                      :fill="r.color" fill-opacity="0.22" 
                      :stroke="r.color" stroke-width="1.2" 
                    />
                    <rect 
                      v-else-if="r.shape === '사각형' && r.isForward && r.width > 0" 
                      :x="r.drawX" :y="r.drawY - (r.height / 2)" 
                      :width="r.width" :height="r.height" 
                      :fill="r.color" fill-opacity="0.22" 
                      :stroke="r.color" stroke-width="1.2" 
                    />
                    <rect 
                      v-else-if="r.shape === '사각형' && !r.isForward && r.width > 0" 
                      :x="r.drawX - (r.width / 2)" :y="r.drawY - (r.height / 2)" 
                      :width="r.width" :height="r.height" 
                      :fill="r.color" fill-opacity="0.22" 
                      :stroke="r.color" stroke-width="1.2" 
                    />
                  </template>
                </svg>
              </div>
            </div>

            <!-- 스킬 정보 -->
            <div class="effect-group-box info-group mt-2">
              <div class="buff-card-list">
                <div class="buff-item-card card-info fit-card">
                  <div class="fit-row">
                    <div class="fit-left">
                      <span class="slim-label-box">일반</span>
                      <span class="buff-name text-truncate">
                        {{ compareHeroDetails[index - 1].normal_damage_name || '공격력피해량' }}
                      </span>
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
                      <span class="buff-name text-truncate">
                        {{ compareHeroDetails[index - 1].critSdc02_damage_name || '치명타피해량' }}
                      </span>
                    </div>
                    <div class="fit-right">
                      <span class="buff-val text-yellow">{{ compareHeroDetails[index - 1].critSdc02_value }}</span>
                      <span 
                        v-if="compareHeroDetails[index - 1].critSdc02_damage && compareHeroDetails[index - 1].critSdc02_damage !== '0%' && compareHeroDetails[index - 1].critSdc02_damage !== '-'" 
                        class="buff-max-badge-sm"
                      >
                        MAX {{ compareHeroDetails[index - 1].critSdc02_damage }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="buff-item-card card-info card-active-skill fit-card">
                  <div class="fit-row">
                    <div class="fit-left">
                      <span class="slim-label-box label-active">액티브</span>
                      <span class="buff-name text-truncate">{{ compareHeroDetails[index - 1].activeSdc01_skill_name || '공격력피해량' }}</span>
                    </div>
                    <div class="fit-right">
                      <span class="buff-val text-red-main">{{ compareHeroDetails[index - 1].activeSdc01_effect_value }}</span>
                      <template v-if="compareHeroDetails[index - 1].activeSdc01_damage && compareHeroDetails[index - 1].activeSdc01_damage !== '-' && compareHeroDetails[index - 1].activeSdc01_damage !== compareHeroDetails[index - 1].activeSdc01_effect_value">
                        <span class="buff-max-badge-sm">
                          MAX {{ compareHeroDetails[index - 1].activeSdc01_damage }}
                        </span>
                      </template>
                    </div>
                  </div>

                  <div v-if="compareHeroDetails[index - 1].activeSdc01_shape !== '-' || compareHeroDetails[index - 1].activeSdc01_area !== '-'" class="info-row-secondary fit-meta">
                    <span v-if="compareHeroDetails[index - 1].activeSdc01_shape !== '-'" class="meta-tag">{{ compareHeroDetails[index - 1].activeSdc01_shape }}</span>
                    <span v-if="compareHeroDetails[index - 1].activeSdc01_area !== '-'" class="meta-tag area-tag text-truncate">{{ compareHeroDetails[index - 1].activeSdc01_area }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 버프/디버프 목록 -->
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

                <!-- 2. 아군 버프 -->
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

                <!-- 3. 적군 디버프 -->
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
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
const activeDetailTab = ref('new');
const targetDeckCodes = ref([]);

// 최신 등록 캐릭터 5개(char_id) 조회 함수
const fetchRecentCharCodes = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/chars/recent`);
    if (Array.isArray(res.data) && res.data.length > 0) {
      targetDeckCodes.value = res.data;
    } else {
      targetDeckCodes.value = ['MR', 'MQ', 'MJ', 'MI', 'MH'];
    }
  } catch (err) {
    console.error('최신 캐릭터 코드 조회 실패:', err);
    targetDeckCodes.value = ['MR', 'MQ', 'MP', 'MO', 'MN'];
  }
};

// ================= [독립 데이터 상태] =================
const allHeroPool = ref([]);
const newHeroDetails = reactive({});
const loadingMap = reactive({});

// 영웅비교 5개 슬롯 상태
const compareSearchQueries = ref(['', '', '', '', '']);
const showDropdownFlags = ref([false, false, false, false, false]);
const compareHeroIds = ref([null, null, null, null, null]);
const compareHeroDetails = reactive([null, null, null, null, null]);
const loadingCompareMap = reactive([false, false, false, false, false]);

// ================= [이미지 및 검색 유틸] =================
const getHeroImage = (id) => id ? `${BASE_URL}/uploads/chars/${String(id).toUpperCase()}.jpg` : 'https://placehold.co/36?text=No+Img';
const handleImageError = (e) => { e.target.src = 'https://placehold.co/36?text=No+Img'; };

const fetchAllHeroPool = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/chars/all-pool`);
    allHeroPool.value = res.data || [];
  } catch (err) {
    console.error('전체 영웅 목록 조회 실패:', err);
    allHeroPool.value = [];
  }
};

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

// ================= [영웅 상세 + 사거리 데이터 독립 조회] =================
const formatHeroDetailData = (rawData, batchData = null) => {
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

  const mergedSkills = (batchData && batchData.skills) ? batchData.skills : (rawData.skills || {});
  const mergedColor = (batchData && batchData.color) ? batchData.color : rawData.color;

  return {
    ...rawData,
    color: mergedColor,
    skills: mergedSkills,
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

const fetchHeroFullData = async (charId) => {
  const upperId = String(charId).toUpperCase();
  const [detailRes, batchRes] = await Promise.all([
    axios.get(`${BASE_URL}/api/chars/detail/${upperId}`),
    axios.post(`${BASE_URL}/api/chars/batch`, { charIds: [upperId] }).catch(() => ({ data: [] }))
  ]);

  const batchChar = Array.isArray(batchRes.data) && batchRes.data.length > 0 ? batchRes.data[0] : null;
  return formatHeroDetailData(detailRes.data, batchChar);
};

const fetchDetailByCode = async (code) => {
  if (!code) return;
  loadingMap[code] = true;
  try {
    newHeroDetails[code] = await fetchHeroFullData(code);
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
    compareHeroDetails[slotIndex] = await fetchHeroFullData(charId);
  } catch (err) {
    console.error(`슬롯 ${slotIndex + 1} 상세 조회 실패:`, err);
    compareHeroDetails[slotIndex] = null;
  } finally {
    loadingCompareMap[slotIndex] = false;
  }
};

// ================= [버프 분류 및 미니 전장판 사거리 계산] =================
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

const getMiniRangeData = (heroDetail) => {
  if (!heroDetail) return null;

  const cellWidth = 20;
  const cellHeight = 20;
  const startX = 50;
  const startY = 50;

  const buffsList = Array.isArray(heroDetail.buffs) ? heroDetail.buffs : [];
  const totalSkills = heroDetail.skills || {};
  const skillNode = totalSkills['액티브공격'] || {};

  const matchedBuff = buffsList.find(b => 
    b.skill_code === 'SKI03' && 
    (b.range_type || b.range_detail || b.range_shape || b.shape_type || b.shape)
  ) || buffsList.find(b => b.range_type || b.range_detail || b.range_shape || b.shape_type || b.shape) || {};

  let baseRange = 8.0;
  if (typeof skillNode === 'number') {
    baseRange = skillNode;
  } else if (skillNode && skillNode.range) {
    baseRange = parseFloat(skillNode.range);
  } else if (typeof totalSkills['일반공격'] === 'number') {
    baseRange = totalSkills['일반공격'];
  } else if (totalSkills['일반공격']?.range) {
    baseRange = parseFloat(totalSkills['일반공격'].range);
  } else if (matchedBuff.range !== null && matchedBuff.range !== undefined) {
    baseRange = parseFloat(matchedBuff.range);
  } else if (heroDetail.activeSdc01_range && heroDetail.activeSdc01_range !== '-') {
    baseRange = parseFloat(heroDetail.activeSdc01_range);
  }
  if (isNaN(baseRange) || baseRange <= 0) baseRange = 8.0;

  const attackRange = baseRange * cellWidth * 0.038;
  const endX = Math.min(180, startX + attackRange);
  const endY = startY;

  const rawType = matchedBuff.range_type || matchedBuff.range_shape || matchedBuff.shape_type || matchedBuff.shape ||
    (typeof skillNode === 'object' ? (skillNode.range_type || skillNode.range_shape || skillNode.shape_type || skillNode.shape || skillNode.type || skillNode.attack_type) : '') || '';
  const rawDetail = matchedBuff.range_detail || matchedBuff.detail || matchedBuff.desc ||
    (typeof skillNode === 'object' ? (skillNode.range_detail || skillNode.detail || skillNode.desc || skillNode.skill_desc) : '') || '';

  const rType = String(rawType).toLowerCase();
  const rDetail = String(rawDetail).toLowerCase();

  const extractMeter = (text) => {
    if (!text) return 0;
    const match = text.match(/범위\s*([0-9.]+)\s*m/i) || text.match(/([0-9.]+)\s*m/i);
    return match ? parseFloat(match[1]) : 0;
  };

  let centerX = endX;
  let centerY = endY;

  if (rDetail.includes('자신') || rDetail.includes('후방') || rType.includes('자신')) {
    centerX = startX;
    centerY = startY;
  }

  const meterToPx = cellWidth * 0.22;
  const isHalfCircle = rType.includes('반원') || rDetail.includes('반원') || rType.includes('half') || rType.includes('semicircle');
  const isSector = rType.includes('부채꼴') || rDetail.includes('부채꼴') || rType.includes('fan') || rType.includes('sector');
  const isRect = rType.includes('직선') || rType.includes('사각형') || rType.includes('line') || rType.includes('rect') || rDetail.includes('폭') || rDetail.includes('길이');

  let shape = '원';
  let radius = 0;
  let width = 0;
  let height = 0;
  let pathD = '';
  let isForward = false;

  const buildArcPath = (x, y, rad, startAngle, endAngle) => {
    const sRad = (startAngle * Math.PI) / 180;
    const eRad = (endAngle * Math.PI) / 180;
    const x1 = x + rad * Math.cos(sRad);
    const y1 = y + rad * Math.sin(sRad);
    const x2 = x + rad * Math.cos(eRad);
    const y2 = y + rad * Math.sin(eRad);
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${x} ${y} L ${x1} ${y1} A ${rad} ${rad} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  if (isHalfCircle) {
    shape = '반원';
    const meter = extractMeter(rDetail) || 3;
    radius = meter * meterToPx;
    pathD = buildArcPath(centerX, centerY, radius, -90, 90);
  } else if (isSector) {
    shape = '부채꼴';
    const meter = extractMeter(rDetail) || 3;
    radius = meter * meterToPx;
    pathD = buildArcPath(centerX, centerY, radius, -30, 30);
  } else if (isRect) {
    shape = '사각형';
    const wMatch = rDetail.match(/길이\s*([0-9.]+)/i);
    const hMatch = rDetail.match(/폭\s*([0-9.]+)/i);
    const wMeter = wMatch ? parseFloat(wMatch[1]) : extractMeter(rDetail);
    const hMeter = hMatch ? parseFloat(hMatch[1]) : 2;
    width = (wMeter || 3) * meterToPx;
    height = (hMeter || 2) * cellHeight * 0.45;
    if (rDetail.includes('전방') || rDetail.includes('후방') || rDetail.includes('직선')) {
      isForward = true;
      centerX = startX;
    }
  } else {
    shape = '원';
    const meter = extractMeter(rDetail) || 2.5;
    radius = meter * meterToPx;
  }

  return {
    color: heroDetail.color || '#10b981',
    startX,
    startY,
    endX,
    endY,
    drawX: centerX,
    drawY: centerY,
    shape,
    radius: radius > 0 ? radius : cellWidth * 0.38,
    width: width > 0 ? width : cellWidth * 1.0,
    height: height > 0 ? height : cellHeight * 0.75,
    pathD,
    isForward
  };
};

onMounted(async () => {
  await fetchAllHeroPool();
  await fetchRecentCharCodes();
  targetDeckCodes.value.forEach(code => fetchDetailByCode(code));
});
</script>

<style scoped>
@import "../assets/styles/deck-build.css";

.skia-char-info-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-tab-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  flex-shrink: 0;
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

/* ✅ 5종 가로 스크롤 보드 (기본 3개 폭 유지 + 넘치면 가로 스크롤) */
.horizontal-scroll-board {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 6px;
}

.horizontal-scroll-board::-webkit-scrollbar {
  height: 8px;
}

.horizontal-scroll-board::-webkit-scrollbar-track {
  background: #0f172a;
  border-radius: 4px;
}

.horizontal-scroll-board::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}

.horizontal-scroll-board::-webkit-scrollbar-thumb:hover {
  background: #3b82f6;
}

.hero-card-column {
  flex: 0 0 calc((100% - 16px) / 3);
  min-width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-title-bar h3 {
  font-size: 0.85rem !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-battlefield-wrapper {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #334155;
}

.mini-battle-pair-row {
  display: flex;
  width: 100%;
  position: relative;
}

.mini-team-arena {
  flex: 1;
  background: #ebf3fb;
  position: relative;
  border-right: 1px solid #94a3b8;
}

.mini-boss-arena {
  flex: 1;
  background: #1b1b26;
  position: relative;
  overflow: hidden;
}

.mini-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(5, 1fr);
  width: 100%;
  aspect-ratio: 1 / 1;
  position: relative;
}

.mini-grid-cell {
  border: 1px solid rgba(203, 213, 225, 0.6);
}

.mini-boss-arena .mini-grid-cell {
  border-color: rgba(51, 65, 85, 0.5);
}

.center-placed-hero {
  grid-column: 3;
  grid-row: 3;
  justify-self: center;
  align-self: center;
}

.center-placed-boss {
  grid-column: 3;
  grid-row: 3;
  justify-self: center;
  align-self: center;
}

.mini-char-card {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1.5px solid #00c49f;
  background: #f8fafc;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  z-index: 5;
}

.mini-char-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-boss-card {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #2e1065;
  border: 2px solid #a855f7;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.6);
  z-index: 5;
}

.mini-boss-emoji {
  font-size: 14px;
}

.mini-full-range-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
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