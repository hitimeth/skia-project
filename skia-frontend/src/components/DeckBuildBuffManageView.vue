<template>
  <div class="buff-manage-container" @click="closeDropdowns">
    <!-- 1. 상단 타이틀 바 -->
    <div class="header-bar">
      <h2>⚔️ {{ texts.modal.title }}</h2>
      <button class="close-btn" @click="closeWindow">✕ {{ texts.modal.btnClose || '닫기' }}</button>
    </div>

    <!-- 2. 한 줄(Single Line) 레이아웃 입력/수정 폼 카드 -->
    <div class="form-section">
      <div class="form-header-title">
        <span class="plus-icon">➕</span>
        <h3>{{ isEditing ? texts.modal.formTitleEdit : texts.modal.formTitleNew }}</h3>
      </div>

      <!-- 한 줄 레이아웃 컨테이너 -->
      <div class="form-single-line">
        <!-- 효과 이름 검색 -->
        <div class="form-item flex-fill custom-select-container" @click.stop>
          <label class="form-label-inline">{{ texts.modal.effectLabel }}</label>
          <div class="input-wrapper">
            <input 
              v-model="effectSearchText" 
              type="text" 
              :placeholder="texts.modal.effectPlaceholder" 
              @focus="isEffectDropdownOpen = true"
              @input="onEffectInput"
            />
            <!-- 선택 시 아래에 노출되는 추천 효과 리스트 (지정된 순서대로 표시) -->
            <ul v-if="isEffectDropdownOpen && customFilteredEffectCodes.length > 0" class="custom-dropdown-list">
              <li 
                v-for="item in customFilteredEffectCodes" 
                :key="item.code_id" 
                @click="selectEffectItem(item)"
              >
                <span class="item-name">{{ item.code_name }}</span>
                <span class="item-id">[{{ item.code_id }}]</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 영웅 이름 검색 -->
        <div class="form-item flex-fill">
          <label class="form-label-inline">{{ texts.modal.heroLabel }}</label>
          <div class="input-wrapper">
            <input 
              v-model="heroSearchText" 
              type="text" 
              list="heroIdDatalist" 
              :placeholder="texts.modal.heroPlaceholder" 
              @change="handleHeroChange" 
            />
            <datalist id="heroIdDatalist">
              <option v-for="hero in filteredHeroIds" :key="hero.id" :value="hero.name">
                {{ hero.id }}
              </option>
            </datalist>
          </div>
        </div>

        <!-- 추천 순위/점수 -->
        <div class="form-item rank-item">
          <label class="form-label-inline">
            <span>{{ texts.modal.rankLabel }}</span>
            <span class="sub-label">(낮을수록 우선)</span>
          </label>
          <div class="input-wrapper rank-input-wrapper">
            <input 
              v-model.number="buffForm.rank_score" 
              type="number" 
              :placeholder="texts.modal.rankPlaceholder" 
            />
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="form-actions-inline">
          <button v-if="isEditing" class="btn-cancel" @click="handleCancelEdit">
            {{ texts.modal.btnCancel }}
          </button>
          <button class="btn-submit" @click="handleSave">
            💾 {{ isEditing ? texts.modal.btnSubmitEdit : texts.modal.btnSubmitNew }}
          </button>
        </div>
      </div>
    </div>

    <!-- 3. 매핑 현황 테이블 -->
    <div class="table-section">
      <div class="table-title-bar">
        <h4>📊 등록된 추천 매핑 현황 <span class="count-badge">총 {{ sortedAndDisplayedEffects.length }}건</span></h4>
      </div>
      <div class="table-scroll-wrapper">
        <table class="deck-grid-table">
          <colgroup>
            <col style="width: 8%;" />   <!-- 1. 일련번호 -->
            <col style="width: 14%;" />  <!-- 2. 효과코드 -->
            <col style="width: 25%;" />  <!-- 3. 효과명 -->
            <col style="width: 25%;" />  <!-- 4. 영웅 정보 -->
            <col style="width: 12%;" />  <!-- 5. 순위 스코어 -->
            <col style="width: 16%;" />  <!-- 6. 관리 버튼 영역 -->
          </colgroup>

          <thead>
            <tr>
              <th class="text-center">번호</th>
              <th class="text-center">효과 코드</th>
              <th class="text-left">효과명</th>
              <th class="text-left">영웅</th>
              <th class="text-center">순위 스코어</th>
              <th class="text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sortedAndDisplayedEffects" :key="item.effect_seq">
              <td class="text-center"><span class="seq-badge">{{ item.effect_seq }}</span></td>
              <td class="text-center"><span class="code-badge">{{ item.effect_code }}</span></td>
              <td class="text-left"><strong class="effect-name-text">{{ item.code_name }}</strong></td>
              <td class="text-left">
                <span class="hero-id-tag">[{{ item.char_id }}]</span>
                <span class="hero-sub-name">
                  {{ rawHeroList.find(h => h.id === item.char_id)?.name || texts.modal.unregisteredHero }}
                </span>
              </td>
              <td class="text-center"><span class="rank-input-mock">{{ item.rank_score }}</span></td>
              
              <td class="table-actions text-center">
                <button class="btn-action btn-edit-sm" title="수정" @click="editCharEffect(item)">
                  <span class="icon">✏️</span><span class="btn-text">수정</span>
                </button>
                <button class="btn-action btn-delete-sm" title="삭제" @click="handleDelete(item.effect_seq)">
                  <span class="icon">🗑️</span><span class="btn-text">삭제</span>
                </button>
              </td>
            </tr>
            <tr v-if="sortedAndDisplayedEffects.length === 0">
              <td colspan="6" class="empty-td">{{ texts.modal.noData }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'; 
import { useDeckBuild } from '../composables/useDeckBuild.js';
import { DASHBOARD_TEXTS } from '../constants/dashboardTexts.js';

const texts = DASHBOARD_TEXTS;

const {
  commonCodes,
  rawHeroList,
  buffForm,
  effectSearchText,
  heroSearchText,
  isEditing,
  filteredEffectCodes,
  filteredHeroIds,
  displayedEffects,
  resetBuffForm,
  saveCharEffect,
  editCharEffect,
  deleteCharEffect,
  fetchSkiaCharEffects,
  fetchCommonCodes,
  fetchAllHeroPool
} = useDeckBuild({
  prefetchCommonCodes: true
});

/* =========================================================================
   효과 선택 순서 정의 및 맞춤 정렬 computed
   ========================================================================= */
const targetOrder = [
  'STB01', // 공격력 +
  'STB03', // 공격속도 +
  'STB05', // 명중 +
  'STB07', // 치명타 확률 +
  'STB08', // 치명타 피해 +
  'STB10', // 약점 공격 확률 +
  'STB12', // 약점 공격 피해 +
  'STB13', // 추가 피해 확률 +
  'STB16', // 추가 피해량 +
  'STB14', // 받는 피해량 +
  'STB21', // 최종 피해량 +
  'STB19', // 급소 공격 확률 +
  'STB15', // 생명력 +
  'SYG01', // 과부하
  'STB09', // 치명타 확률 저항 +
  'SDB03', // 방어력 -
  'SDB07', // 회피 -
  'SDB10', // 치명타확률 저항 -
  'CCC10', // 저주
  'CCC01', // 이로운 효과 제거
  'SDB17', // 추가피해확률 저항 -
  'SDB16', // 약점공격확률 저항 -
  'DOT01', // 출혈
  'DOT02', // 화상
  'DOT03', // 중독
  'DOT04', // 동상
  'DOT05', // 풍화
  'DOT06'  // 부식
];

// 기존 필터링 결과를 지정된 targetOrder 순서대로 재정렬
const customFilteredEffectCodes = computed(() => {
  const source = filteredEffectCodes.value || [];
  return [...source].sort((a, b) => {
    const indexA = targetOrder.indexOf(a.code_id);
    const indexB = targetOrder.indexOf(b.code_id);

    const posA = indexA !== -1 ? indexA : 9999;
    const posB = indexB !== -1 ? indexB : 9999;

    return posA - posB;
  });
});

/* =========================================================================
   효과 선택 드롭다운 관련 상태 및 함수
   ========================================================================= */
const isEffectDropdownOpen = ref(false);

const onEffectInput = () => {
  isEffectDropdownOpen.value = true;
  handleEffectInput();
  
  if (!effectSearchText.value.trim()) {
    buffForm.value.effect_code = '';
  }
};

const selectEffectItem = (item) => {
  effectSearchText.value = item.code_name;
  buffForm.value.effect_code = item.code_id;
  isEffectDropdownOpen.value = false;
};

const closeDropdowns = () => {
  isEffectDropdownOpen.value = false;
};

/* =========================================================================
   🎯 필터링 및 통일된 정렬 (1차: 효과 코드 -> 2차: 순위 스코어)
   ========================================================================= */
const sortedAndDisplayedEffects = computed(() => {
  let list = [...displayedEffects.value];

  if (buffForm.value.effect_code) {
    list = list.filter(item => item.effect_code === buffForm.value.effect_code);
  }

  return list.sort((a, b) => {
    const codeA = (a.effect_code || '').toLowerCase();
    const codeB = (b.effect_code || '').toLowerCase();
    const codeCompare = codeA.localeCompare(codeB, 'ko');

    if (codeCompare !== 0) {
      return codeCompare;
    }

    const rankA = a.rank_score ?? 999;
    const rankB = b.rank_score ?? 999;
    return rankA - rankB;
  });
});

/* =========================================================================
   이벤트 및 핸들러
   ========================================================================= */
onMounted(async () => {
  try {
    if (typeof fetchCommonCodes === 'function') await fetchCommonCodes();
    if (typeof fetchAllHeroPool === 'function') await fetchAllHeroPool();
    if (typeof fetchSkiaCharEffects === 'function') await fetchSkiaCharEffects();
  } catch (error) {
    console.error('팝업 데이터 로딩 중 오류 발생:', error);
  }
});

const handleEffectInput = () => {
  const found = commonCodes.value.find(c => c.code_name === effectSearchText.value.trim());
  buffForm.value.effect_code = found ? found.code_id : '';
};

const handleHeroChange = () => {
  const found = rawHeroList.value.find(h => h.name === heroSearchText.value);
  if (found) {
    buffForm.value.char_id = found.id;
  }
};

const prepareAddFromItem = (item) => {
  resetBuffForm();
  effectSearchText.value = item.code_name || '';
  buffForm.value.effect_code = item.effect_code || '';
  buffForm.value.rank_score = item.rank_score || 1;
};

const handleCancelEdit = () => {
  resetBuffForm();
  effectSearchText.value = '';
};

const notifyParentRefresh = () => {
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: 'REFRESH_BUFF_POOL' }, '*');
  }
};

const handleSave = async () => {
  await saveCharEffect();
  if (typeof fetchSkiaCharEffects === 'function') await fetchSkiaCharEffects();
  notifyParentRefresh();
};

const handleDelete = async (effectSeq) => {
  if (confirm('해당 매핑 항목을 삭제하시겠습니까?')) {
    await deleteCharEffect(effectSeq);
    if (typeof fetchSkiaCharEffects === 'function') await fetchSkiaCharEffects();
    notifyParentRefresh();
  }
};

const closeWindow = () => {
  window.close();
};
</script>

<style scoped>
/* 기존 스타일 그대로 유지 */
.buff-manage-container {
  padding: 20px;
  background-color: #f4f6f9;
  color: #1a1a1a;
  min-height: 100vh;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 12px;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header-bar h2 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #1a1a1a;
}

.close-btn {
  background-color: #ffffff;
  color: #1a1a1a;
  border: 1px solid #ced4da;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f1f3f5;
  border-color: #e67e22;
  color: #e67e22;
}

.form-section {
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
}

.form-header-title {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}

.form-header-title .plus-icon {
  color: #7052be;
  font-size: 16px;
  font-weight: bold;
}

.form-header-title h3 {
  margin: 0;
  font-size: 15px;
  font-weight: bold;
  color: #1a1a1a;
}

.form-single-line {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: nowrap;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flex-fill {
  flex: 1;
  min-width: 0;
}

.form-label-inline {
  font-weight: bold;
  font-size: 12px;
  color: #1a1a1a;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.form-label-inline .sub-label {
  font-size: 11px;
  color: #666;
  font-weight: normal;
}

.input-wrapper {
  flex: 1;
  display: flex;
  position: relative;
}

.rank-input-wrapper {
  max-width: 70px;
}

.form-single-line input {
  width: 100%;
  padding: 8px 12px;
  background-color: #fffdf2;
  border: 1px solid #e2e0d5;
  border-radius: 6px;
  font-size: 12px;
  color: #2c3e50;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.rank-input-wrapper input[type="number"] {
  text-align: center;
}

.form-single-line input:focus {
  background-color: #ffffff;
  border-color: #7052be;
  box-shadow: 0 0 0 2px rgba(112, 82, 190, 0.15);
}

.custom-select-container {
  position: relative;
}

.custom-dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #7052be;
  border-top: none;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  margin: 2px 0 0 0;
  padding: 0;
  list-style: none;
  z-index: 100;
}

.custom-dropdown-list li {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f5;
  transition: background-color 0.15s ease;
}

.custom-dropdown-list li:last-child {
  border-bottom: none;
}

.custom-dropdown-list li:hover {
  background-color: #f3f0ff;
}

.custom-dropdown-list .item-name {
  font-weight: bold;
  color: #1a1a1a;
}

.custom-dropdown-list .item-id {
  font-size: 10px;
  color: #7052be;
  font-weight: bold;
}

.form-actions-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  white-space: nowrap;
}

.btn-submit {
  background-color: #1a1a1a;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s ease;
}

.btn-submit:hover {
  background-color: #333333;
}

.btn-cancel {
  background-color: #ffffff;
  color: #495057;
  border: 1px solid #ced4da;
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
}

.table-section {
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.table-title-bar h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: bold;
  color: #1a1a1a;
}

.count-badge {
  font-size: 11px;
  background-color: #e7f5ff;
  color: #1c7ed6;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: bold;
  margin-left: 6px;
}

.table-scroll-wrapper {
  max-height: 450px;
  overflow-y: auto;
  border: 1px solid #dcdee2;
  border-radius: 6px;
}

.deck-grid-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.deck-grid-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  font-size: 12px !important;
  padding: 10px 8px;
  border-right: 1px solid #dcdee2;
  border-bottom: 2px solid #1a1a1a;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 10;
  color: #1a1a1a;
}

.deck-grid-table td {
  padding: 6px;
  border-right: 1px solid #dcdee2;
  border-bottom: 1px solid #dcdee2;
  vertical-align: middle;
  font-size: 11px !important;
  color: #1a1a1a;
  box-sizing: border-box;
}

.deck-grid-table tr:hover td {
  background-color: #f8fafc;
}

.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.empty-td {
  text-align: center;
  color: #999;
  padding: 50px 0 !important;
  font-size: 12px !important;
  font-style: italic;
}

.seq-badge {
  color: #666;
  font-weight: bold;
}

.code-badge {
  font-weight: bold;
  color: #2c3e50;
  background-color: #edf2f7;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.effect-name-text {
  color: #1a1a1a;
  font-weight: bold;
}

.hero-id-tag {
  color: #666;
  font-weight: bold;
  margin-right: 4px;
}

.hero-sub-name {
  font-weight: bold;
  color: #1c7ed6;
}

.rank-input-mock {
  display: inline-block;
  background-color: #fffdf4;
  border: 1px solid #ced4da;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.table-actions {
  flex-direction: row !important;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.btn-action {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 3px 6px !important;
  height: 24px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #ced4da;
  background-color: #ffffff;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.btn-action .icon {
  font-size: 9px !important;
  line-height: 1;
}

.btn-action .btn-text {
  font-size: 11px !important;
  line-height: 1;
  white-space: nowrap;
}

.btn-edit-sm:hover {
  background-color: #fff4e6;
  border-color: #ffd8a8;
  color: #e67e22;
}

.btn-delete-sm:hover {
  background-color: #fff5f5;
  border-color: #ffc9c9;
  color: #e03131;
}

.btn-add-sm {
  color: #7052be;
  font-weight: bold;
}

.btn-add-sm:hover {
  background-color: #f3f0ff;
  border-color: #b197fc;
  color: #5f3dc4;
}

@media (max-width: 1024px) {
  .form-single-line {
    flex-wrap: wrap;
  }
}
</style>