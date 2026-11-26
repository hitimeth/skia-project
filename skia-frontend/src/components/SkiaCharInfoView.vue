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
    <template v-if="activeDetailTab === 'new'">
      <!-- 영웅 빠른 포커스 바 -->
      <div v-if="targetDeckCodes.length > 0" class="quick-focus-bar">
        <button
          v-for="(code, idx) in targetDeckCodes"
          :key="'focus-new-' + code"
          :class="['focus-chip-btn', { active: focusedNewIndex === idx }]"
          @click="focusCard('new', idx)"
        >
          <img :src="getHeroImage(code)" @error="handleImageError" class="focus-chip-img" />
          <span>{{ getHeroDetailByCode(code)?.name || code }}</span>
        </button>
      </div>

      <div ref="newBoardRef" class="horizontal-scroll-board">
        <div 
          v-for="(code, idx) in targetDeckCodes" 
          :key="code" 
          :ref="el => { if (el) newCardRefs[idx] = el }"
          class="info-section-wrapper compact-section hero-card-column"
          @click="focusedNewIndex = idx"
        >
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
                        <span class="uniform-text text-truncate">
                          {{ getHeroDetailByCode(code).normal_damage_name || '공격력피해량' }}
                        </span>
                      </div>
                      <div class="fit-right">
                        <span class="uniform-val text-yellow">
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
                        <span class="uniform-text text-truncate">
                          {{ getHeroDetailByCode(code).critSdc02_damage_name || '치명타피해량' }}
                        </span>
                      </div>
                      <div class="fit-right">
                        <span class="uniform-val text-yellow">
                          {{ getHeroDetailByCode(code).critSdc02_value }}
                        </span>
                        <span 
                          v-if="getHeroDetailByCode(code).critSdc02_damage && getHeroDetailByCode(code).critSdc02_damage !== '0%' && getHeroDetailByCode(code).critSdc02_damage !== '-'" 
                          class="uniform-badge-sm"
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
                        <span class="uniform-text text-truncate">{{ getHeroDetailByCode(code).activeSdc01_skill_name || '공격력피해량' }}</span>
                      </div>
                      <div class="fit-right">
                        <span class="uniform-val text-red-main">{{ getHeroDetailByCode(code).activeSdc01_effect_value }}</span>
                        <template v-if="getHeroDetailByCode(code).activeSdc01_damage && getHeroDetailByCode(code).activeSdc01_damage !== '-' && getHeroDetailByCode(code).activeSdc01_damage !== getHeroDetailByCode(code).activeSdc01_effect_value">
                          <span class="uniform-badge-sm">
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

              <!-- ⚡ 풀버프 환산치 요약 카드 (차분한 단색 & 일의 자리 세로 정렬) -->
              <div class="calc-score-box mt-2">
                <div class="calc-header-label">테스트 예상수치 (30초)</div>
                <div class="calc-grid-row">
                  <span class="calc-row-tag">일반</span>
                  <div class="calc-cell-group">
                    <span class="calc-badge-a">A</span>
                    <span class="calc-val-num">{{ getHeroConvertedStats(getHeroDetailByCode(code)).baseActiveScore }}</span>
                  </div>
                  <span class="calc-sep">|</span>
                  <div class="calc-cell-group">
                    <span class="calc-badge-c">C</span>
                    <span class="calc-val-num">{{ getHeroConvertedStats(getHeroDetailByCode(code)).baseCritScore }}</span>
                  </div>
                </div>
                <div class="calc-grid-row">
                  <span class="calc-row-tag">쿨감</span>
                  <div class="calc-cell-group">
                    <span class="calc-badge-a">A</span>
                    <span class="calc-val-num">{{ getHeroConvertedStats(getHeroDetailByCode(code)).cdActiveScore }}</span>
                  </div>
                  <span class="calc-sep">|</span>
                  <div class="calc-cell-group">
                    <span class="calc-badge-c">C</span>
                    <span class="calc-val-num">{{ getHeroConvertedStats(getHeroDetailByCode(code)).cdCritScore }}</span>
                  </div>
                </div>
              </div>

              <!-- 버프/디버프 목록 (중첩 계산 및 기호 표시) -->
              <div class="hero-buff-list-box mt-2">                
                <div v-if="getHeroDetailByCode(code).buffs && getHeroDetailByCode(code).buffs.length > 0" class="buff-category-wrapper">
                  <!-- 자신 버프 -->
                  <div v-if="filterBuffs(getHeroDetailByCode(code).buffs, 'SELF_BUFF').length > 0" class="effect-group-box self-group">
                    <div class="group-header-label text-self">👤 자신 버프</div>
                    <div class="buff-card-list">
                      <div v-for="b in filterBuffs(getHeroDetailByCode(code).buffs, 'SELF_BUFF')" :key="b.group_key" class="buff-item-card card-self compact-buff-item">
                        <div class="buff-item-left">
                          <span 
                            v-for="sym in b.skill_symbols" 
                            :key="sym" 
                            class="skill-type-badge" 
                            :class="sym === 'C' ? 'badge-crit' : sym === 'N' ? 'badge-normal' : 'badge-active'"
                          >
                            {{ sym }}
                          </span>
                          <span class="uniform-text text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                          <span v-if="b.stack_count > 1" class="stack-count-badge">
                            {{ b.stack_count }}중첩
                          </span>
                        </div>
                        <div class="buff-item-right">
                          <span class="uniform-val">{{ b.total_display_value }}</span>
                          <span v-if="b.duration" class="uniform-sub-sm">({{ b.duration }}s)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 아군 버프 -->
                  <div v-if="filterBuffs(getHeroDetailByCode(code).buffs, 'TEAM_BUFF').length > 0" class="effect-group-box team-group">
                    <div class="group-header-label text-team">🛡️ 아군 버프</div>
                    <div class="buff-card-list">
                      <div v-for="b in filterBuffs(getHeroDetailByCode(code).buffs, 'TEAM_BUFF')" :key="b.group_key" class="buff-item-card card-team compact-buff-item">
                        <div class="buff-item-left">
                          <span 
                            v-for="sym in b.skill_symbols" 
                            :key="sym" 
                            class="skill-type-badge" 
                            :class="sym === 'C' ? 'badge-crit' : sym === 'N' ? 'badge-normal' : 'badge-active'"
                          >
                            {{ sym }}
                          </span>
                          <span class="uniform-text text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                          <span v-if="b.stack_count > 1" class="stack-count-badge">
                            {{ b.stack_count }}중첩
                          </span>
                        </div>
                        <div class="buff-item-right">
                          <span class="uniform-val text-green">{{ b.total_display_value }}</span>
                          <span v-if="b.duration" class="uniform-sub-sm">({{ b.duration }}s)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 적군 디버프 -->
                  <div v-if="filterBuffs(getHeroDetailByCode(code).buffs, 'DEBUFF').length > 0" class="effect-group-box debuff-group">
                    <div class="group-header-label text-debuff">⚔️ 적군 디버프</div>
                    <div class="buff-card-list">
                      <div v-for="b in filterBuffs(getHeroDetailByCode(code).buffs, 'DEBUFF')" :key="b.group_key" class="buff-item-card card-debuff compact-buff-item">
                        <div class="buff-item-left">
                          <span 
                            v-for="sym in b.skill_symbols" 
                            :key="sym" 
                            class="skill-type-badge" 
                            :class="sym === 'C' ? 'badge-crit' : sym === 'N' ? 'badge-normal' : 'badge-active'"
                          >
                            {{ sym }}
                          </span>
                          <span class="uniform-text text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                          <span v-if="b.stack_count > 1" class="stack-count-badge">
                            {{ b.stack_count }}중첩
                          </span>
                        </div>
                        <div class="buff-item-right">
                          <span class="uniform-val text-red">{{ b.total_display_value }}</span>
                          <span v-if="b.duration" class="uniform-sub-sm">({{ b.duration }}s)</span>
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
    </template>

    <!-- ================= [2] TAB: 영웅비교 (자동완성 검색형 5종 가로 스크롤) ================= -->
    <template v-else-if="activeDetailTab === 'compare'">
      <!-- 영웅비교 빠른 포커스 바 -->
      <div class="quick-focus-bar">
        <button
          v-for="index in 5"
          :key="'focus-cmp-' + index"
          :class="['focus-chip-btn', { active: focusedCompareIndex === index - 1 }]"
          @click="focusCard('compare', index - 1)"
        >
          <img 
            v-if="compareHeroDetails[index - 1]" 
            :src="getHeroImage(compareHeroDetails[index - 1].id)" 
            @error="handleImageError" 
            class="focus-chip-img" 
          />
          <span>{{ compareHeroDetails[index - 1]?.name || `슬롯 ${index}` }}</span>
        </button>
      </div>

      <div ref="compareBoardRef" class="horizontal-scroll-board">
        <div 
          v-for="index in 5" 
          :key="'compare-col-' + index" 
          :ref="el => { if (el) compareCardRefs[index - 1] = el }"
          class="info-section-wrapper compact-section hero-card-column"
          @click="focusedCompareIndex = index - 1"
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
                        <span class="uniform-text text-truncate">
                          {{ compareHeroDetails[index - 1].normal_damage_name || '공격력피해량' }}
                        </span>
                      </div>
                      <div class="fit-right">
                        <span class="uniform-val text-yellow">{{ compareHeroDetails[index - 1].normal_damage }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="buff-item-card card-info fit-card">
                    <div class="fit-row">
                      <div class="fit-left">
                        <span class="slim-label-box label-crit">치명타</span>
                        <span class="uniform-text text-truncate">
                          {{ compareHeroDetails[index - 1].critSdc02_damage_name || '치명타피해량' }}
                        </span>
                      </div>
                      <div class="fit-right">
                        <span class="uniform-val text-yellow">{{ compareHeroDetails[index - 1].critSdc02_value }}</span>
                        <span 
                          v-if="compareHeroDetails[index - 1].critSdc02_damage && compareHeroDetails[index - 1].critSdc02_damage !== '0%' && compareHeroDetails[index - 1].critSdc02_damage !== '-'" 
                          class="uniform-badge-sm"
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
                        <span class="uniform-text text-truncate">{{ compareHeroDetails[index - 1].activeSdc01_skill_name || '공격력피해량' }}</span>
                      </div>
                      <div class="fit-right">
                        <span class="uniform-val text-red-main">{{ compareHeroDetails[index - 1].activeSdc01_effect_value }}</span>
                        <template v-if="compareHeroDetails[index - 1].activeSdc01_damage && compareHeroDetails[index - 1].activeSdc01_damage !== '-' && compareHeroDetails[index - 1].activeSdc01_damage !== compareHeroDetails[index - 1].activeSdc01_effect_value">
                          <span class="uniform-badge-sm">
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

              <!-- ⚡ 풀버프 환산치 요약 카드 (차분한 단색 & 일의 자리 세로 정렬) -->
              <div class="calc-score-box mt-2">
                <div class="calc-header-label">테스트 예상수치 (30초)</div>
                <div class="calc-grid-row">
                  <span class="calc-row-tag">일반</span>
                  <div class="calc-cell-group">
                    <span class="calc-badge-a">A</span>
                    <span class="calc-val-num">{{ getHeroConvertedStats(compareHeroDetails[index - 1]).baseActiveScore }}</span>
                  </div>
                  <span class="calc-sep">|</span>
                  <div class="calc-cell-group">
                    <span class="calc-badge-c">C</span>
                    <span class="calc-val-num">{{ getHeroConvertedStats(compareHeroDetails[index - 1]).baseCritScore }}</span>
                  </div>
                </div>
                <div class="calc-grid-row">
                  <span class="calc-row-tag">쿨감</span>
                  <div class="calc-cell-group">
                    <span class="calc-badge-a">A</span>
                    <span class="calc-val-num">{{ getHeroConvertedStats(compareHeroDetails[index - 1]).cdActiveScore }}</span>
                  </div>
                  <span class="calc-sep">|</span>
                  <div class="calc-cell-group">
                    <span class="calc-badge-c">C</span>
                    <span class="calc-val-num">{{ getHeroConvertedStats(compareHeroDetails[index - 1]).cdCritScore }}</span>
                  </div>
                </div>
              </div>

              <!-- 버프/디버프 목록 (중첩 계산 및 기호 표시) -->
              <div class="hero-buff-list-box mt-2">
                <div v-if="compareHeroDetails[index - 1].buffs && compareHeroDetails[index - 1].buffs.length > 0" class="buff-category-wrapper">
                  <!-- 1. 자신 버프 -->
                  <div v-if="filterBuffs(compareHeroDetails[index - 1].buffs, 'SELF_BUFF').length > 0" class="effect-group-box self-group">
                    <div class="group-header-label text-self">👤 자신 버프</div>
                    <div class="buff-card-list">
                      <div v-for="b in filterBuffs(compareHeroDetails[index - 1].buffs, 'SELF_BUFF')" :key="b.group_key" class="buff-item-card card-self compact-buff-item">
                        <div class="buff-item-left">
                          <span 
                            v-for="sym in b.skill_symbols" 
                            :key="sym" 
                            class="skill-type-badge" 
                            :class="sym === 'C' ? 'badge-crit' : sym === 'N' ? 'badge-normal' : 'badge-active'"
                          >
                            {{ sym }}
                          </span>
                          <span class="uniform-text text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                          <span v-if="b.stack_count > 1" class="stack-count-badge">
                            {{ b.stack_count }}중첩
                          </span>
                        </div>
                        <div class="buff-item-right">
                          <span class="uniform-val">{{ b.total_display_value }}</span>
                          <span v-if="b.duration" class="uniform-sub-sm">({{ b.duration }}s)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 2. 아군 버프 -->
                  <div v-if="filterBuffs(compareHeroDetails[index - 1].buffs, 'TEAM_BUFF').length > 0" class="effect-group-box team-group">
                    <div class="group-header-label text-team">🛡️ 아군 버프</div>
                    <div class="buff-card-list">
                      <div v-for="b in filterBuffs(compareHeroDetails[index - 1].buffs, 'TEAM_BUFF')" :key="b.group_key" class="buff-item-card card-team compact-buff-item">
                        <div class="buff-item-left">
                          <span 
                            v-for="sym in b.skill_symbols" 
                            :key="sym" 
                            class="skill-type-badge" 
                            :class="sym === 'C' ? 'badge-crit' : sym === 'N' ? 'badge-normal' : 'badge-active'"
                          >
                            {{ sym }}
                          </span>
                          <span class="uniform-text text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                          <span v-if="b.stack_count > 1" class="stack-count-badge">
                            {{ b.stack_count }}중첩
                          </span>
                        </div>
                        <div class="buff-item-right">
                          <span class="uniform-val text-green">{{ b.total_display_value }}</span>
                          <span v-if="b.duration" class="uniform-sub-sm">({{ b.duration }}s)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 3. 적군 디버프 -->
                  <div v-if="filterBuffs(compareHeroDetails[index - 1].buffs, 'DEBUFF').length > 0" class="effect-group-box debuff-group">
                    <div class="group-header-label text-debuff">⚔️ 적군 디버프</div>
                    <div class="buff-card-list">
                      <div v-for="b in filterBuffs(compareHeroDetails[index - 1].buffs, 'DEBUFF')" :key="b.group_key" class="buff-item-card card-debuff compact-buff-item">
                        <div class="buff-item-left">
                          <span 
                            v-for="sym in b.skill_symbols" 
                            :key="sym" 
                            class="skill-type-badge" 
                            :class="sym === 'C' ? 'badge-crit' : sym === 'N' ? 'badge-normal' : 'badge-active'"
                          >
                            {{ sym }}
                          </span>
                          <span class="uniform-text text-truncate" :title="b.effect_code_name">{{ b.effect_code_name }}</span>
                          <span v-if="b.stack_count > 1" class="stack-count-badge">
                            {{ b.stack_count }}중첩
                          </span>
                        </div>
                        <div class="buff-item-right">
                          <span class="uniform-val text-red">{{ b.total_display_value }}</span>
                          <span v-if="b.duration" class="uniform-sub-sm">({{ b.duration }}s)</span>
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
    </template>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
const activeDetailTab = ref('new');
const targetDeckCodes = ref([]);

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

// ================= [카드 빠른 포커스 및 첫 번째 위치 이동] =================
const newBoardRef = ref(null);
const newCardRefs = ref([]);
const focusedNewIndex = ref(0);

const compareBoardRef = ref(null);
const compareCardRefs = ref([]);
const focusedCompareIndex = ref(0);

const focusCard = (tabType, index) => {
  if (tabType === 'new') {
    focusedNewIndex.value = index;
    const board = newBoardRef.value;
    const card = newCardRefs.value[index];
    if (board && card) {
      board.scrollTo({
        left: card.offsetLeft - board.offsetLeft,
        behavior: 'smooth'
      });
    }
  } else {
    focusedCompareIndex.value = index;
    const board = compareBoardRef.value;
    const card = compareCardRefs.value[index];
    if (board && card) {
      board.scrollTo({
        left: card.offsetLeft - board.offsetLeft,
        behavior: 'smooth'
      });
    }
  }
};

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

  const actDurRow = rawBuffs.find(b =>
    String(b.skill_code || '').trim().toUpperCase() === 'SKI03' &&
    Number(b.duration) > 0 &&
    Number(b.duration) < 10
  ) || activeSkillBase;
  const activeDuration = (actDurRow && Number(actDurRow.duration) > 0) ? Number(actDurRow.duration) : 0;

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
    critSdc02_duration: (critSkillBase.duration !== null && critSkillBase.duration !== undefined && Number(critSkillBase.duration) > 0)
      ? Number(critSkillBase.duration)
      : (critSkillSdc02 && Number(critSkillSdc02.duration) > 0 ? Number(critSkillSdc02.duration) : 2),

    activeSdc01_skill_name: activeName,
    activeSdc01_effect_value: activeVal,
    activeSdc01_damage: activeMaxDmg,
    activeSdc01_shape: activeSkillBase.range_type || activeSkillBase.range_shape || '-',
    activeSdc01_area: formatArea(activeSkillBase),
    activeSdc01_range: (activeSkillBase.range !== null && activeSkillBase.range !== undefined) ? `${activeSkillBase.range}` : '-',
    activeSdc01_cooldown: (activeSkillBase.cooldown !== null && activeSkillBase.cooldown !== undefined) ? `${activeSkillBase.cooldown}초` : '-',
    activeSdc01_duration: activeDuration
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

// ================= [버프 분류 및 중첩 계산 로직] =================
const getSkillSymbol = (skillCode) => {
  const code = String(skillCode || '').trim().toUpperCase();
  if (code === 'SKI02') return 'C';
  if (code === 'SKI01') return 'N';
  return 'A';
};

const filterBuffs = (buffsList, categoryType) => {
  if (!buffsList || !Array.isArray(buffsList)) return [];

  const filtered = buffsList.filter(b => {
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

  const groupedMap = new Map();
  const separateItems = [];

  filtered.forEach((b, idx) => {
    const symbol = getSkillSymbol(b.skill_code);
    const numVal = parseFloat(b.effect_value) || 0;
    const unit = (b.unit || '%').trim();
    const durationNum = parseFloat(b.duration);
    const validDuration = (!isNaN(durationNum) && durationNum > 0) ? durationNum : null;

    if (unit === '%') {
      const key = `${b.effect_code || ''}_${b.effect_code_name || ''}`;
      const explicitStack = parseInt(b.max_stack || b.stack_count || b.stack || 1, 10);
      const baseStack = explicitStack > 1 ? explicitStack : 1;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          ...b,
          group_key: key,
          skill_symbols: [symbol],
          base_value: numVal,
          stack_count: baseStack,
          total_value: numVal * baseStack,
          unit,
          duration: validDuration
        });
      } else {
        const existing = groupedMap.get(key);
        if (!existing.skill_symbols.includes(symbol)) {
          existing.skill_symbols.push(symbol);
        }
        existing.stack_count += baseStack;
        existing.total_value += (numVal * baseStack);
        if (!existing.duration && validDuration) {
          existing.duration = validDuration;
        }
      }
    } else {
      separateItems.push({
        ...b,
        group_key: `sep_${b.buff_seq || idx}_${b.skill_code || ''}`,
        skill_symbols: [symbol],
        stack_count: 1,
        total_display_value: numVal > 0 ? `${numVal}${unit}` : '',
        duration: validDuration
      });
    }
  });

  const mergedPercentItems = Array.from(groupedMap.values()).map(item => {
    const roundedTotal = Math.round(item.total_value * 100) / 100;
    const roundedBase = Math.round(item.base_value * 100) / 100;
    const displayStr = item.stack_count > 1
      ? `${roundedTotal}% (${roundedBase}×${item.stack_count})`
      : `${roundedTotal}%`;

    return {
      ...item,
      total_display_value: displayStr
    };
  });

  return [...mergedPercentItems, ...separateItems];
};

// ================= [30초 타임라인 기반 풀버프 환산치 (즉발형/지속형 구분 반영)] =================
const getHeroConvertedStats = (heroDetail) => {
  if (!heroDetail) {
    return {
      baseActiveScore: '-',
      baseCritScore: '-',
      cdActiveScore: '-',
      cdCritScore: '-'
    };
  }

  const parseNum = (val) => {
    if (!val || val === '-') return 0;
    const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const TOTAL_SEC = 30;

  const rawCritDur = parseNum(heroDetail.critSdc02_duration);
  const critDurationSec = rawCritDur > 0 ? rawCritDur : 2;
  const baseCritCount = TOTAL_SEC / critDurationSec;

  const rawActCd = parseNum(heroDetail.activeSdc01_cooldown);
  const baseActCdSec = rawActCd > 0 ? rawActCd : 10;
  const baseActCount = TOTAL_SEC / baseActCdSec;

  const actDurationSec = parseNum(heroDetail.activeSdc01_duration);

  const baseActive = parseNum(heroDetail.activeSdc01_effect_value);
  const baseCrit = parseNum(heroDetail.critSdc02_value);

  const selfBuffs = filterBuffs(heroDetail.buffs, 'SELF_BUFF');
  const teamBuffs = filterBuffs(heroDetail.buffs, 'TEAM_BUFF');
  const debuffs = filterBuffs(heroDetail.buffs, 'DEBUFF');
  const allEffects = [...selfBuffs, ...teamBuffs, ...debuffs];

  let actCdPct = 0;
  let actCdPctDur = 0;
  let critCdSec = 0;
  let actCdSec = 0;

  allEffects.forEach(item => {
    const name = String(item.effect_code_name || '');
    const unit = (item.unit || '%').trim();
    const syms = item.skill_symbols || [];

    if (name.includes('쿨타임 감소')) {
      if (unit === '%') {
        actCdPct += (item.total_value || 0);
        const dur = item.duration ? parseFloat(item.duration) : TOTAL_SEC;
        actCdPctDur = Math.max(actCdPctDur, dur);
      } else if (unit === '초') {
        const sec = parseNum(item.effect_value || item.total_display_value);
        if (syms.includes('C')) critCdSec += sec;
        if (syms.includes('A')) actCdSec += sec;
      }
    }
  });

  const calcBuffMultiplierForCycle = (actCount, critCount) => {
    let effFinalAtk = 0;
    let effFinalCritDmg = 0;
    let effFinalExtraDmg = 0;
    let effBonusDmg = 0;

    allEffects.forEach(item => {
      const unit = (item.unit || '%').trim();
      if (unit !== '%') return;

      const name = String(item.effect_code_name || '');
      const val = item.total_value || 0;
      const dur = item.duration ? parseFloat(item.duration) : TOTAL_SEC;
      const syms = item.skill_symbols || [];

      let triggerCount = 0;
      if (syms.includes('C')) triggerCount += critCount;
      if (syms.includes('A')) triggerCount += actCount;
      if (syms.includes('N')) triggerCount += TOTAL_SEC;
      if (triggerCount === 0) triggerCount = actCount;

      const activeTime = Math.min(TOTAL_SEC, triggerCount * dur);
      const uptime = activeTime / TOTAL_SEC;
      const effectiveVal = val * uptime;

      if (name.includes('최종 공격력')) {
        effFinalAtk += effectiveVal;
      } else if (name.includes('최종 치명타 피해')) {
        effFinalCritDmg += effectiveVal;
      } else if (name.includes('최종 추가 피해')) {
        effFinalExtraDmg += effectiveVal;
      } else if (name.includes('보스 몬스터') || name.includes('주는 피해') || name.includes('받는 피해')) {
        effBonusDmg += effectiveVal;
      }
    });

    const atkMult = 1 + effFinalAtk / 100;
    const critDmgMult = 1 + effFinalCritDmg / 100;
    const extraDmgMult = 1 + effFinalExtraDmg / 100;
    const bonusMult = 1 + effBonusDmg / 100;

    return atkMult * critDmgMult * extraDmgMult * bonusMult;
  };

  const baseBuffMult = calcBuffMultiplierForCycle(baseActCount, baseCritCount);
  const baseActiveTotal = Math.round(baseActive * baseBuffMult * baseActCount);
  const baseCritTotal = Math.round(baseCrit * baseBuffMult * baseCritCount);

  const dt = 0.5;
  let t = 0;
  let cdRem = baseActCdSec;
  let actActiveRem = 0;
  let pctBuffRem = 0;
  let critElapsed = 0;
  let cdActCount = 0;

  while (t < TOTAL_SEC - 1e-9) {
    if (actActiveRem <= 0) {
      const speed = 1 + (pctBuffRem > 0 ? actCdPct / 100 : 0);
      cdRem = Math.max(0, cdRem - dt * speed);
    }

    critElapsed += dt;
    if (critElapsed >= critDurationSec - 1e-9) {
      critElapsed = 0;
      if (actActiveRem <= 0 && cdRem > 0 && critCdSec > 0) {
        cdRem = Math.max(0, cdRem - critCdSec);
      }
    }

    if (actActiveRem > 0) {
      actActiveRem = Math.max(0, actActiveRem - dt);
    }
    pctBuffRem = Math.max(0, pctBuffRem - dt);
    t += dt;

    if (cdRem <= 0 && actActiveRem <= 0 && t < TOTAL_SEC - 1e-9) {
      cdActCount += 1;
      actActiveRem = actDurationSec;
      cdRem = Math.max(0, baseActCdSec - actCdSec);
      if (actCdPct > 0) {
        pctBuffRem = actCdPctDur > 0 ? actCdPctDur : TOTAL_SEC;
      }
    }
  }

  const hasAnyCd = actCdPct > 0 || critCdSec > 0 || actCdSec > 0;
  const finalActCount = hasAnyCd ? cdActCount : baseActCount;
  const finalCritCount = baseCritCount;

  const cdBuffMult = calcBuffMultiplierForCycle(finalActCount, finalCritCount);
  const cdActiveTotal = Math.round(baseActive * cdBuffMult * finalActCount);
  const cdCritTotal = Math.round(baseCrit * cdBuffMult * finalCritCount);

  const fmt = (n) => (n > 0 ? `${n.toLocaleString()}%` : '0%');

  return {
    baseActiveScore: fmt(baseActiveTotal),
    baseCritScore: fmt(baseCritTotal),
    cdActiveScore: fmt(cdActiveTotal),
    cdCritScore: fmt(cdCritTotal)
  };
};

// ================= [미니 전장판 사거리 계산] =================
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
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
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

/* 상단 빠른 포커스 바 */
.quick-focus-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding: 4px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow-x: auto;
  flex-shrink: 0;
}

.focus-chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.focus-chip-btn:hover {
  background: rgba(255, 255, 255, 0.7);
  color: #1e293b;
}

.focus-chip-btn.active {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #2563eb;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.focus-chip-img {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}

.horizontal-scroll-board {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 6px;
  padding-right: calc((100% - 16px) * 2 / 3);
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
  min-width: 310px;
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

/* 통일된 폰트 크기 및 스타일 */
.uniform-text {
  font-size: 0.8rem !important;
  font-weight: 500;
  color: #f1f5f9;
  line-height: 1.2;
}

.uniform-val {
  font-size: 0.8rem !important;
  font-weight: 700;
  white-space: nowrap;
  line-height: 1.2;
}

.uniform-badge-sm {
  background: #334155;
  color: #f59e0b;
  font-size: 0.72rem !important;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
}

.uniform-sub-sm {
  font-size: 0.72rem !important;
  color: #94a3b8;
  white-space: nowrap;
}

/* 스킬 기호 배지 (N / C / A) */
.skill-type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 0.72rem !important;
  font-weight: 800;
  line-height: 1;
  flex-shrink: 0;
}

.badge-normal {
  background: #1e293b;
  color: #cbd5e1;
  border: 1px solid #475569;
}

.badge-crit {
  background: rgba(37, 99, 235, 0.25);
  color: #60a5fa;
  border: 1px solid #3b82f6;
}

.badge-active {
  background: rgba(220, 38, 38, 0.25);
  color: #f87171;
  border: 1px solid #ef4444;
}

/* 중첩 표시 뱃지 */
.stack-count-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.5);
  font-size: 0.72rem !important;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 미니 전장판 */
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

.center-placed-hero,
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

/* 자동완성 검색바 */
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
  font-size: 0.8rem;
  font-weight: bold;
  color: #f8fafc;
}

.mini-hero-id {
  font-size: 0.7rem;
  color: #60a5fa;
}

/* 스킬 및 버프 카드 레이아웃 */
.fit-card {
  padding: 2px 2px !important;
  display: contents;
  flex-direction: column;
  gap: 2px;
}

.fit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 94%;
  gap: 2px;
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
  font-size: 0.74rem;
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

.fit-meta {
  margin-top: 2px;
  gap: 4px !important;
  padding-left: 50px;
}

.compact-buff-item {
  padding: 5px 6px !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.compact-buff-item .buff-item-left {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.compact-buff-item .uniform-text {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-buff-item .buff-item-right {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
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

/* ✅ 환산치 요약 카드 (차분한 톤 & 일의 자리 세로 줄맞춤) */
.calc-score-box {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 7px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.calc-header-label {
  font-size: 0.72rem !important;
  font-weight: 600;
  color: #94a3b8;
  padding-bottom: 4px;
  border-bottom: 1px solid #1e293b;
}

.calc-grid-row {
  display: grid;
  grid-template-columns: 34px 1fr auto 1fr;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem !important;
  white-space: nowrap;
}

.calc-row-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 19px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 4px;
  font-size: 0.71rem !important;
  font-weight: 600;
  color: #94a3b8;
}

.calc-cell-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  min-width: 0;
}

.calc-badge-a {
  color: #cbd5e1;
  font-weight: 700;
  font-size: 0.74rem !important;
}

.calc-badge-c {
  color: #94a3b8;
  font-weight: 700;
  font-size: 0.74rem !important;
}

.calc-val-num {
  color: #f1f5f9;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
  flex: 1;
}

.calc-sep {
  color: #334155;
  font-weight: 400;
}

/* 기본 스킬/공격 정보 카드 높이 고정 (범위 표시 1줄 포함) */
.effect-group-box.info-group {
  height: 136px;
  min-height: 136px;
  max-height: 136px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
}

/* 모바일 화면 최적화 */
@media (max-width: 768px) {
  .horizontal-scroll-board {
    scroll-snap-type: x mandatory;
    gap: 12px;
    padding-right: 0;
  }

  .hero-card-column {
    flex: 0 0 100%;
    min-width: 100%;
    scroll-snap-align: start;
  }

  .main-tab-btn {
    font-size: 0.8rem;
    padding: 8px 6px;
  }

  .slim-label-box {
    width: 38px;
    font-size: 0.7rem;
  }
}
</style>