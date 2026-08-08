<template>
  <div class="menu-style-container">
    <div class="top-setup-wrapper">
      <div class="form-section">
        <h3>👤 캐릭터 마스터 기본 정보</h3>
        <dialog id="myDialog" style="border:none; border-radius:8px; padding:15px 25px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
          수정되었습니다.
        </dialog>
        <div class="form-group select-group">
          <label>캐릭터 선택</label>
          
          <div style="flex: 7; position: relative;">
            <input 
              type="text" 
              v-model="charSearchKeyword" 
              @focus="isDropdownOpen = true"
              @input="isDropdownOpen = true"
              placeholder="ID / 닉네임 / 캐릭터명 입력/검색..." 
              class="char-search-input"
              style="width: 100%; box-sizing: border-box;"
            />
            
            <ul 
              v-if="isDropdownOpen && filteredCharacterList.length > 0" 
              class="custom-dropdown-list"
            >
              <li 
                v-for="char in filteredCharacterList" 
                :key="char.master_id" 
                @click="selectCharacter(char)"
              >
                <strong>{{ char.nickname }}</strong> [{{ char.char_name }}] ({{ char.char_id }})
              </li>
            </ul>
          </div>
        </div>

        <form @submit.prevent class="base-info-form">
          <div class="form-grid-layout">
            <input type="hidden" v-model="charForm.master_id">

            <div class="form-group">
              <label>캐릭터 ID</label>
              <input type="text" v-model="charForm.char_id" required placeholder="예: HW">
            </div>

            <div class="form-group"><label>캐릭터 이름</label><input type="text" v-model="charForm.char_name" required></div>
            <div class="form-group"><label>등급명</label><input type="text" v-model="charForm.grade_name"></div>
            <div class="form-group"><label>소속명</label><input type="text" v-model="charForm.char_group_name"></div>
            <div class="form-group">
              <label>전투 타입</label>
              <select v-model="charForm.battle_type">
                <option value="근거리형">근거리형</option>
                <option value="원거리형">원거리형</option>
                <option value="기능형">기능형</option>
                <option value="방어형">방어형</option>
              </select>
            </div>
            <div class="form-group">
              <label>공격 스타일</label>
              <select v-model="charForm.attack_style_code">
                <option value="">-- 선택 안 함 --</option>
                <option value="APS01">가장 가까운 대상을 우선 공격(APS01)</option>
                <option value="APS02">[근거리형] 키워드를 가진 대상을 우선 공격(APS02)</option>
                <option value="APS03">[원거리형] 키워드를 가진 대상을 우선 공격(APS03)</option>
                <option value="APS04">[방어형] 키워드를 가진 대상을 우선 공격(APS04)</option>
                <option value="APS05">[기능형] 키워드를 가진 대상을 우선 공격(APS05)</option>                                
              </select>
            </div>
            <div class="form-group">
              <label>각성 여부</label>
              <select v-model="charForm.is_awk_yn"><option value="Y">Y (각성)</option><option value="N">N (미각성)</option></select>
            </div>

            <div class="form-group">
              <label>등록일</label>
              <input type="text" v-model="charForm.reg_date" placeholder="등록 일시">
            </div>
            <div class="form-group">
              <label>닉네임</label>
              <input type="text" v-model="charForm.nickname" placeholder="닉네임">
            </div>            
            <div class="form-group">
              <label>수정일</label>
              <input type="text" v-model="charForm.upt_date" placeholder="최종 수정 일시">
            </div>

            <div class="form-group btn-group">
              <button type="button" class="btn-save" @click="saveBaseInfo">💾 기본 정보 수정 저장</button>
              <button type="button" class="btn-detail-pop" @click="openCharDetailPopUp">📝 상세정보 (새창)</button>
            </div>
          </div>
        </form>
      </div>
      
      <div class="summary-section">
        <div class="helper-card">
          <h4>💡 데이터 정제 가이드</h4>
          <ul>
            <li>캐릭터를 선택하면 상단에 기본 정보, <b>하단에 스킬 및 버프 목록</b>이 로드됩니다.</li>
            <li>좌측 <b>[스킬 구분 / 관리]</b> 구역의 ➕ 버튼으로 행 복사가 가능하며, 저장(💾) 및 삭제(🗑️)도 한곳에서 관리합니다.</li>
            <li>추가된 신규 행은 저장 전까지 파란색 글씨로 강조 표시되며, 저장 성공 시 검은색으로 변경됩니다.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="grid-section full-width-section">
      <div class="grid-section-header">
        <h3>⚔️ 스킬 및 버프 상세 수정</h3>
        <div class="header-left-group">
          <button class="btn-save-batch" @click="saveModifiedBuffsBatch">
            📝 ALL저장
          </button>
          <button class="btn-refresh-batch" @click="refreshBuffsList" title="목록 새로고침">
            🔄 새로고침
          </button>
          <button class="btn-code-manage" @click="openCodePopUp" title="공통코드 관리 창 띄우기">
            ⚙️ 공통코드 관리 (새창)
          </button>
        </div>
      </div>
      
      <div class="table-responsive grid-scroll-container">
        <table class="deck-grid-table">
          <thead>
            <tr>
              <th style="width: 10%;">스킬 구분 / 관리</th> 
              <th style="width: 12%;">스킬 정보<br><span style="font-size: 10px; font-weight: normal; color: #666;">(사거리/쿨/각성/타겟/대상)</span></th>
              <th style="width: 28%;">버프 지정<br><span style="font-size: 10px; font-weight: normal; color: #666;">(검색/선택/버프 이름)</span></th>
              <th style="width: 50%;">버프 상세 정보<br><span style="font-size: 10px; font-weight: normal; color: #666;">(수치/단위/지속/범위/상세/설명)</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="buffs.length === 0">
              <td colspan="4" class="empty-td">
                  캐릭터를 먼저 선택해 주세요. 하단에 상세 목록이 표시됩니다.
              </td>
            </tr>
            
            <tr v-else v-for="(buff, index) in buffs" :key="index" :class="{ 'new-buff-row': buff.isNew }"> 
              <td class="readonly-td-name integrated-mgmt-td">
                <input type="hidden" v-model="buff.buff_seq" />
                <div class="skill-name-row">
                  <span class="code-text-value">{{ getCodeName(buff.skill_code) }}</span>
                </div>
                <div class="integrated-action-group">
                  <button class="btn-copy-row-slim" title="이 행 복사하여 아래에 추가" @click="copyBuffRow(buff, index)">➕</button>
                  <button class="btn-save-row-slim" title="이 행 저장" @click="saveBuffRow(buff)">💾</button>
                  <button class="btn-delete-row-slim" title="이 행 삭제" @click="deleteBuffRow(buff, index)">🗑️</button>
                </div>
              </td>

              <td style="padding: 6px; text-align: left; vertical-align: middle;">
                <div class="info-row-top">
                  <span contenteditable="true" class="editable inline-edit" @blur="buff.skill_range = $event.target.textContent.trim()">{{ buff.skill_range }}</span>
                  <span class="info-split">/</span>
                  <span contenteditable="true" class="editable inline-edit" @blur="buff.skill_cool_time = $event.target.textContent.trim()">{{ buff.skill_cool_time }}</span>
                  <span class="info-split">/</span>
                  <span contenteditable="true" class="editable inline-edit" @blur="buff.is_awk_yn = $event.target.textContent.trim()">{{ buff.is_awk_yn }}</span>
                </div>
                
                <div class="info-row-middle" style="margin-bottom: 4px;">
                  <select class="grid-select-box full-width-select" v-model="buff.target_code">
                    <option value="">-- 타겟 선택 --</option>
                    <option v-for="c in filterCodes('TG')" :key="c.code_id" :value="c.code_id">
                      {{ c.code_name }} ({{ c.code_id }})
                    </option>
                  </select>
                </div>

                <div class="info-row-bottom">
                  <select class="grid-select-box full-width-select" v-model="buff.target_point_code">
                    <option value="">-- 대상 선택 --</option>
                    <option v-for="c in filterCodes('TP')" :key="c.code_id" :value="c.code_id">
                      {{ c.code_name }} ({{ c.code_id }})
                    </option>
                  </select>
                </div>
              </td>

              <td style="padding: 6px; text-align: left; vertical-align: middle;">
                <div class="buff-name-row text-wrap-td">
                  <span class="info-label" style="width: 38px;">버프명:</span>
                  <span contenteditable="true" class="editable inline-block-edit buff-name-edit" @blur="buff.buff_name = $event.target.textContent.trim()">{{ buff.buff_name }}</span>
                </div>                
                <div class="info-row-top" style="margin-bottom: 4px;">
                  <span class="info-label" style="width: 38px;">검색어:</span>
                  <input 
                    type="text" 
                    v-model="buff.searchKeyword" 
                    placeholder="버프 검색어 입력 (예: 치)" 
                    class="buff-search-input-full"
                  />
                </div>

                <div class="info-row-middle" style="margin-bottom: 4px;">
                  <span class="info-label" style="width: 40px;">선택:</span>
                  <select class="grid-select-box full-width-select" v-model="buff.effect_code">
                    <option value="">-- 매칭 버프 코드 선택 --</option>
                    <option v-for="c in filterBuffCodes(buff.searchKeyword)" :key="c.code_id" :value="c.code_id">
                      {{ c.code_name }} ({{ c.code_id }})
                    </option>
                  </select>
                </div>
              </td>
              <td style="padding: 6px; text-align: left; vertical-align: middle;">
                <div class="info-row-top">
                  <span class="info-label">수치:</span>
                  <span contenteditable="true" class="editable inline-edit" @blur="buff.effect_value = $event.target.textContent.trim()">{{ buff.effect_value }}</span>
                  <span class="info-split">/</span>
                  <span class="info-label">단위:</span>
                  <span contenteditable="true" class="editable inline-edit" @blur="buff.value_unit = $event.target.textContent.trim()">{{ buff.value_unit }}</span>
                  <span class="info-split">/</span>
                  <span class="info-label">지속:</span>
                  <span contenteditable="true" class="editable inline-edit" @blur="buff.effect_duration = $event.target.textContent.trim()">{{ buff.effect_duration }}</span>
                  <span class="info-split">/</span>
                  <!-- 신규 추가: 타격수 -->
                  <span class="info-label">타격수:</span>
                  <span contenteditable="true" class="editable inline-edit" @blur="buff.hit_count = $event.target.textContent.trim()">{{ buff.hit_count }}</span>
                  <span class="info-split">/</span>
                  <!-- 신규 추가: 최대스택 -->
                  <span class="info-label">최소스택:</span>
                  <span contenteditable="true" class="editable inline-edit" @blur="buff.max_stack = $event.target.textContent.trim()">{{ buff.max_stack }}</span>
                </div>

                <div class="buff-range-combined-row" style="margin-bottom: 4px;">
                  <div class="range-part">
                    <span class="info-label">범위:</span>
                    <span contenteditable="true" class="editable inline-edit type-range-edit" @blur="buff.range_type = $event.target.textContent.trim()">{{ buff.range_type }}</span>
                  </div>
                  <div class="detail-part text-wrap-td">
                    <span class="info-label">범위상세:</span>
                    <span contenteditable="true" class="editable inline-block-edit range-detail-edit" @blur="buff.range_detail = $event.target.textContent.trim()">{{ buff.range_detail }}</span>
                  </div>
                </div>

                <div class="buff-remark-row text-wrap-td">
                  <span class="info-label">설명:</span>
                  <span contenteditable="true" class="editable inline-block-edit remark-style" @blur="buff.remark = $event.target.textContent.trim()">{{ buff.remark }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      BASE_URL: import.meta.env.VITE_API_URL,
      characterList: [],
      selectedMasterId: '', 
      charSearchKeyword: '',
      isDropdownOpen: false,
      charForm: { master_id: '', char_id: '', char_name: '', grade_name: '', char_group_name: '', battle_type: '근거리형', attack_style_code: '', is_awk_yn: 'N', nickname: '', char_detail: '' },
      buffs: [],
      commonCodes: [],
      codePopUpWindow: null,
      charDetailPopUpWindow: null
    }
  },
  computed: {
    filteredCharacterList() {
      if (!this.charSearchKeyword) return this.characterList;
      
      const kw = this.charSearchKeyword.trim().toLowerCase();
      
      return this.characterList.filter(c => {
        const nickname = c.nickname ? c.nickname.toLowerCase() : '';
        const charName = c.char_name ? c.char_name.toLowerCase() : '';
        const charId = c.char_id ? c.char_id.toLowerCase() : '';
        
        // 닉네임, 캐릭터 이름, 캐릭터 ID 중 하나라도 검색어를 포함하면 목록에 표시
        return nickname.includes(kw) || charName.includes(kw) || charId.includes(kw);
      });
    }
  },  
  mounted() {
    this.fetchCharacters();
    this.fetchCommonCodes();
    
    window.addEventListener('message', this.handlePopUpMessage);
  },
  beforeUnmount() {
    window.removeEventListener('message', this.handlePopUpMessage);
  },
  methods: {
    searchAndSelectById() {
      const inputId = this.charForm.char_id ? this.charForm.char_id.trim() : '';
      
      if (!inputId) {
        alert('캐릭터 ID를 입력해 주세요.');
        return;
      }

      // characterList에서 char_id가 일치하는 항목 찾기 (대소문자 구분 없이 처리)
      const found = this.characterList.find(
        c => c.char_id && c.char_id.toLowerCase() === inputId.toLowerCase()
      );

      if (found) {
        // 일치하는 캐릭터가 발견되면 기존 selectCharacter 함수를 호출하여 선택 처리
        this.selectCharacter(found);
      } else {
        // 일치하는 캐릭터가 없으면 검색어를 넘겨주고 드롭다운을 열어 유사검색 지원
        this.charSearchKeyword = inputId;
        this.isDropdownOpen = true;
        alert(`ID [${inputId}] 에 해당하는 캐릭터를 찾을 수 없습니다.`);
      }
    },
    refreshBuffsList() {
      if (!this.selectedMasterId) {
        alert('캐릭터를 먼저 선택해 주세요.');
        return;
      }
      this.fetchCharDetail();
    },
    selectCharacter(char) {
      this.selectedMasterId = char.master_id;
      this.charSearchKeyword = `${char.nickname || ''} [${char.char_name || ''}] (${char.char_id || ''})`;
      this.isDropdownOpen = false;
      
      // charForm에 선택된 캐릭터 기본 정보 동기화
      this.charForm = { ...char };
      
      // 캐릭터 상세 정보 및 버프 목록 호출
      this.fetchCharDetail();
    },   
    handlePopUpMessage(event) {
      if (event.data === 'REFRESH_COMMON_CODES') {
        this.fetchCommonCodes();
      } else if (event.data === 'REFRESH_CHAR_DETAIL') {
        this.fetchCharDetail();
        this.fetchCharacters();
      }
    },

    // 🌟 모달 형태 디자인이 반영된 독립 팝업창
    openCodePopUp() {
      const width = 1000;
      const height = 800;
      const left = Math.max(0, (screen.width - width) / 2);
      const top = Math.max(0, (screen.height - height) / 2);

      if (this.codePopUpWindow && !this.codePopUpWindow.closed) {
        this.codePopUpWindow.focus();
        return;
      }

      this.codePopUpWindow = window.open('', 'CodeManagePopUp', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
      
      const popupDocument = this.codePopUpWindow.document;
      popupDocument.open();
      popupDocument.write(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <title>⚙️ 공통코드 관리</title>
          <style>
            body { font-family: sans-serif; padding: 15px; margin: 0; background: #f8f9fa; color: #2c3e50; }
            h3 { margin-top: 0; color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 8px; }
            .card { background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 15px; }
            .grid-form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; align-items: flex-end; }
            .form-item { display: flex; flex-direction: column; gap: 4px; }
            .form-item label { font-size: 11px; font-weight: bold; }
            .form-item input { padding: 6px; font-size: 11px; border: 1px solid #ced4da; border-radius: 4px; }
            .btn-add { background: #2b8a3e; color: white; border: none; padding: 7px; font-weight: bold; border-radius: 4px; cursor: pointer; font-size: 11px; }
            .btn-add:hover { background: #237032; }
            .search-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 8px; }
            .search-bar input, .search-bar select { padding: 5px; font-size: 11px; border: 1px solid #ced4da; border-radius: 4px; }
            .btn-row-add { background: #2b8a3e; color: white; border: none; padding: 5px 10px; font-weight: bold; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 3px; }
            .btn-row-add:hover { background: #237032; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; background: white; }
            th { background: #e9ecef; padding: 8px; border: 1px solid #dee2e6; position: sticky; top: 0; z-index: 5; }
            th.sortable { cursor: pointer; user-select: none; }
            th.sortable:hover { background: #dee2e6; }
            td { padding: 4px 6px; border: 1px solid #dee2e6; text-align: center; }
            input.table-input { width: 90%; padding: 4px; border: 1px solid #ced4da; border-radius: 3px; font-size: 11px; }
            tr.new-row { background-color: #e7f5ff; }
            .btn-action { border: 1px solid #ced4da; background: white; border-radius: 3px; padding: 3px 6px; cursor: pointer; font-size: 11px; }
            .btn-action:hover { background: #e7f5ff; }
          </style>
        </head>
        <body>
          <h3>⚙️ 공통코드 관리 (skia_code)</h3>
          
          <div class="card">
            <h4 style="margin:0 0 10px 0;">➕ 신규 공통코드 등록</h4>
            <div class="grid-form">
              <div class="form-item"><label>그룹 코드</label><input type="text" id="new_group" placeholder="예: STB"></div>
              <div class="form-item"><label>코드 ID</label><input type="text" id="new_id" placeholder="예: STB01"></div>
              <div class="form-item"><label>코드 이름</label><input type="text" id="new_name" placeholder="코드명"></div>
              <div class="form-item"><label>짧은 명칭</label><input type="text" id="new_short" placeholder="약칭"></div>
              <div class="form-item"><label>정렬 순서</label><input type="number" id="new_sort" value="0"></div>
              <button class="btn-add" onclick="createCode()">등록</button>
            </div>
          </div>

          <div class="search-bar">
            <strong>📋 공통코드 목록</strong>
            <div style="display:flex; gap:6px; align-items:center;">
              <select id="groupSelect" onchange="renderTable()"><option value="">전체 그룹</option></select>
              <input type="text" id="searchInput" onkeyup="renderTable()" placeholder="코드명/ID 검색...">
              <!-- 🌟 목록 신규 행 추가 (+) 버튼 -->
              <button class="btn-row-add" onclick="addNewRow()">➕ 행 추가</button>
            </div>
          </div>

          <div style="max-height: 460px; overflow-y: auto; border: 1px solid #dee2e6;">
            <table>
              <thead>
                <tr>
                  <th style="width:15%">그룹</th>
                  <!-- 🌟 정렬 기능 헤더 -->
                  <th style="width:20%" class="sortable" onclick="toggleSort('code_id')">코드 ID <span id="sort_icon_code_id">🔽</span></th>
                  <th style="width:25%" class="sortable" onclick="toggleSort('code_name')">코드 이름 <span id="sort_icon_code_name">🔽</span></th>
                  <th style="width:15%">짧은 명칭</th>
                  <th style="width:10%" class="sortable" onclick="toggleSort('sort_order')">순서 <span id="sort_icon_sort_order">🔽</span></th>
                  <th style="width:15%">관리</th>
                </tr>
              </thead>
              <tbody id="codeTableBody"></tbody>
            </table>
          </div>

          <script>
            const BASE_URL = "${this.BASE_URL}";
            let rawCodes = [];
            let newRows = [];
            let currentSortKey = 'sort_order';
            let currentSortAsc = true;

            async function loadCodes() {
              try {
                const res = await fetch(BASE_URL + '/api/common/codes');
                rawCodes = await res.json();
                newRows = [];
                populateGroups();
                renderTable();
                if (window.opener) window.opener.postMessage('REFRESH_COMMON_CODES', '*');
              } catch(e) { console.error(e); }
            }

            function populateGroups() {
              const groups = [...new Set(rawCodes.map(c => c.code_group).filter(Boolean))];
              const select = document.getElementById('groupSelect');
              const currentVal = select.value;
              select.innerHTML = '<option value="">전체 그룹</option>' + groups.map(g => \`<option value="\${g}">\${g}</option>\`).join('');
              select.value = currentVal;
            }

            // 🌟 컬럼 헤더 클릭 시 정렬 토글
            function toggleSort(key) {
              if (currentSortKey === key) {
                currentSortAsc = !currentSortAsc;
              } else {
                currentSortKey = key;
                currentSortAsc = true;
              }
              
              ['code_id', 'code_name', 'sort_order'].forEach(k => {
                const iconSpan = document.getElementById('sort_icon_' + k);
                if (iconSpan) {
                  if (k === currentSortKey) {
                    iconSpan.innerText = currentSortAsc ? '🔼' : '🔽';
                  } else {
                    iconSpan.innerText = '🔽';
                  }
                }
              });

              renderTable();
            }

            // 🌟 목록 영역 내 행 추가 (+)
            function addNewRow() {
              const tempId = 'NEW_' + Date.now();
              newRows.unshift({
                tempId: tempId,
                isNew: true,
                code_group: document.getElementById('groupSelect').value || '',
                code_id: '',
                code_name: '',
                code_name_short: '',
                sort_order: 0
              });
              renderTable();
            }

            function removeNewRow(tempId) {
              newRows = newRows.filter(r => r.tempId !== tempId);
              renderTable();
            }

            function renderTable() {
              const search = document.getElementById('searchInput').value.toLowerCase();
              const group = document.getElementById('groupSelect').value;

              // 검색 및 필터링
              let filtered = rawCodes.filter(c => {
                const matchGroup = !group || c.code_group === group;
                const matchSearch = !search || 
                  (c.code_name && c.code_name.toLowerCase().includes(search)) || 
                  (c.code_id && c.code_id.toLowerCase().includes(search));
                return matchGroup && matchSearch;
              });

              // 헤더 기반 정렬 처리
              filtered.sort((a, b) => {
                let valA = a[currentSortKey] ?? '';
                let valB = b[currentSortKey] ?? '';

                if (typeof valA === 'number' && typeof valB === 'number') {
                  return currentSortAsc ? valA - valB : valB - valA;
                }
                
                valA = String(valA);
                valB = String(valB);
                return currentSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
              });

              const tbody = document.getElementById('codeTableBody');
              
              // 추가할 신규 행 HTML
              const newRowsHtml = newRows.map(r => \`
                <tr class="new-row">
                  <td><input class="table-input" id="grp_\${r.tempId}" value="\${r.code_group}" placeholder="그룹"></td>
                  <td><input class="table-input" id="id_\${r.tempId}" value="" placeholder="코드ID (필수)"></td>
                  <td><input class="table-input" id="name_\${r.tempId}" value="" placeholder="코드명"></td>
                  <td><input class="table-input" id="short_\${r.tempId}" value="" placeholder="약칭"></td>
                  <td><input class="table-input" style="text-align:center;" type="number" id="sort_\${r.tempId}" value="0"></td>
                  <td>
                    <button class="btn-action" style="background:#2b8a3e; color:white;" onclick="saveNewRow('\${r.tempId}')">💾</button>
                    <button class="btn-action" onclick="removeNewRow('\${r.tempId}')">❌</button>
                  </td>
                </tr>
              \`).join('');

              // 기존 코드 데이터 목록 HTML
              const existingRowsHtml = filtered.map(c => \`
                <tr>
                  <td><input class="table-input" id="grp_\${c.code_id}" value="\${c.code_group || ''}"></td>
                  <td style="font-weight:bold; color:#1c7ed6;">\${c.code_id}</td>
                  <td><input class="table-input" id="name_\${c.code_id}" value="\${c.code_name || ''}"></td>
                  <td><input class="table-input" id="short_\${c.code_id}" value="\${c.code_name_short || ''}"></td>
                  <td><input class="table-input" style="text-align:center;" type="number" id="sort_\${c.code_id}" value="\${c.sort_order || 0}"></td>
                  <td>
                    <button class="btn-action" onclick="updateCode('\${c.code_id}')">💾</button>
                    <button class="btn-action" onclick="deleteCode('\${c.code_id}')">🗑️</button>
                  </td>
                </tr>
              \`).join('');

              tbody.innerHTML = newRowsHtml + existingRowsHtml;
            }

            async function saveNewRow(tempId) {
              const codeId = document.getElementById('id_' + tempId).value.trim();
              if(!codeId) {
                alert('코드 ID를 입력해 주세요.');
                return;
              }
              const payload = {
                code_group: document.getElementById('grp_' + tempId).value.trim(),
                code_id: codeId,
                code_name: document.getElementById('name_' + tempId).value.trim(),
                code_name_short: document.getElementById('short_' + tempId).value.trim(),
                sort_order: Number(document.getElementById('sort_' + tempId).value) || 0
              };
              const res = await fetch(BASE_URL + '/api/common/codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              if(res.ok) { 
                alert('등록되었습니다.'); 
                loadCodes(); 
              } else {
                alert('등록 실패!');
              }
            }

            async function createCode() {
              const payload = {
                code_group: document.getElementById('new_group').value,
                code_id: document.getElementById('new_id').value,
                code_name: document.getElementById('new_name').value,
                code_name_short: document.getElementById('new_short').value,
                sort_order: Number(document.getElementById('new_sort').value) || 0
              };
              if(!payload.code_id) {
                alert('코드 ID를 입력해 주세요.');
                return;
              }
              const res = await fetch(BASE_URL + '/api/common/codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              if(res.ok) { 
                alert('등록되었습니다.'); 
                document.getElementById('new_group').value = '';
                document.getElementById('new_id').value = '';
                document.getElementById('new_name').value = '';
                document.getElementById('new_short').value = '';
                document.getElementById('new_sort').value = '0';
                loadCodes(); 
              }
            }

            async function updateCode(codeId) {
              const payload = {
                code_id: codeId,
                code_group: document.getElementById('grp_' + codeId).value,
                code_name: document.getElementById('name_' + codeId).value,
                code_name_short: document.getElementById('short_' + codeId).value,
                sort_order: Number(document.getElementById('sort_' + codeId).value) || 0
              };
              const res = await fetch(BASE_URL + '/api/common/codes/' + codeId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              if(res.ok) { alert('수정 완료!'); loadCodes(); }
            }

            async function deleteCode(codeId) {
              if(!confirm('정말 삭제하시겠습니까?')) return;
              const res = await fetch(BASE_URL + '/api/common/codes/' + codeId, { method: 'DELETE' });
              if(res.ok) { alert('삭제 완료!'); loadCodes(); }
            }

            loadCodes();
          <\/script>
        </body>
        </html>
      `);
      popupDocument.close();
    },

    openCharDetailPopUp() {
      if (!this.selectedMasterId) {
        alert('캐릭터를 먼저 선택해 주세요.');
        return;
      }

      const width = 680;
      const height = 550;
      const left = Math.max(0, (screen.width - width) / 2);
      const top = Math.max(0, (screen.height - height) / 2);

      if (this.charDetailPopUpWindow && !this.charDetailPopUpWindow.closed) {
        this.charDetailPopUpWindow.focus();
        return;
      }

      this.charDetailPopUpWindow = window.open('', 'CharDetailPopUp', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);

      const popupDocument = this.charDetailPopUpWindow.document;
      const charName = this.charForm.char_name || '캐릭터';
      const masterId = this.selectedMasterId;
      const fullCharData = JSON.stringify(this.charForm);

      popupDocument.open();
      popupDocument.write(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <title>📝 캐릭터 상세정보 편집 - ${charName}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; margin: 0; background: #f8f9fa; }
            h3 { margin-top: 0; color: #2c3e50; border-bottom: 2px solid #3b5bdb; padding-bottom: 8px; }
            .textarea-container { width: 100%; display: flex; flex-direction: column; gap: 8px; margin-top: 15px; }
            textarea { width: 100%; height: 320px; padding: 12px; font-size: 12px; line-height: 1.6; border: 1px solid #ced4da; border-radius: 6px; box-sizing: border-box; background: #fffdf4; resize: vertical; }
            textarea:focus { outline: 2px solid #3b5bdb; background: #ffffff; }
            .btn-group { display: flex; justify-content: flex-end; gap: 8px; margin-top: 15px; }
            button { padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 11px; }
            .btn-save { background: #3b5bdb; color: white; border: none; }
            .btn-close { background: #edf2f7; color: #4a5568; border: 1px solid #cbd5e0; }
          </style>
        </head>
        <body>
          <h3>📝 상세정보 편집 (${charName})</h3>
          <div class="textarea-container">
            <label style="font-size: 12px; font-weight: bold; color: #2c3e50;">스킬 및 상세 설명 (char_detail)</label>
            <textarea id="detailContent" placeholder="상세 설명을 자유롭게 입력하세요."></textarea>
          </div>
          <div class="btn-group">
            <button class="btn-close" onclick="window.close()">취소</button>
            <button class="btn-save" onclick="saveDetail()">💾 상세정보 저장</button>
          </div>

          <script>
            const BASE_URL = "${this.BASE_URL}";
            const masterId = "${masterId}";
            const charForm = ${fullCharData};

            document.getElementById('detailContent').value = charForm.char_detail || '';

            async function saveDetail() {
              const content = document.getElementById('detailContent').value;
              charForm.char_detail = content;

              try {
                const response = await fetch(BASE_URL + '/api/char_detail/' + masterId, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(charForm)
                });
                
                if (response.ok) {
                  alert('상세정보가 저장되었습니다.');
                  if (window.opener) window.opener.postMessage('REFRESH_CHAR_DETAIL', '*');
                  window.close();
                } else {
                  const errorMsg = await response.text();
                  alert('저장 실패: ' + errorMsg);
                }
              } catch (e) {
                console.error(e);
                alert('통신 중 오류 발생');
              }
            }
          <\/script>
        </body>
        </html>
      `);
      popupDocument.close();
    },

    clearCharForm() {
      this.charForm = { 
        master_id: '', char_id: '', char_name: '', grade_name: '', char_group_name: '', battle_type: '근거리형', attack_style_code: '', is_awk_yn: 'N', char_detail: ''
      };
      this.buffs = [];
    },    
    showDialogMsg() {
      const dialog = document.getElementById('myDialog');
      if (!dialog) return;
      dialog.close();
      dialog.showModal();
      setTimeout(() => { dialog.close(); }, 1500);
    },
    filterCodes(prefix) {
      if (!this.commonCodes) return [];
      return this.commonCodes.filter(c => c.code_id && c.code_id.startsWith(prefix));
    },
    filterBuffCodes(keyword) {
      if (!this.commonCodes) return [];
      return this.commonCodes.filter(c => {
        const id = c.code_id || '';
        const name = c.code_name || '';
        if (id && keyword) return name.includes(keyword.trim());
        return id;
      });
    },
    copyBuffRow(sourceBuff, index) {
      const duplicatedRow = JSON.parse(JSON.stringify(sourceBuff));
      duplicatedRow.buff_seq = null;        
      duplicatedRow.master_id = this.selectedMasterId; 
      duplicatedRow.isNew = true; 
      duplicatedRow.searchKeyword = ''; 
      this.buffs.splice(index + 1, 0, duplicatedRow);
    },
    async fetchCommonCodes() {
      try {
        const res = await fetch(`${this.BASE_URL}/api/common/codes`);
        this.commonCodes = await res.json();
      } catch (e) {
        console.error("공통코드 로드 실패", e);
      }
    },
    getCodeName(codeId) {
      if(!codeId) return '';
      const found = this.commonCodes.find(c => c.code_id === codeId);
      return found ? found.code_name : codeId;
    },
    async fetchCharacters() {
      const res = await fetch(`${this.BASE_URL}/api/char`);
      this.characterList = await res.json();
    },
    async fetchCharDetail() {
      if (!this.selectedMasterId) return;

      try {
        const res = await fetch(`${this.BASE_URL}/api/char_detail/${this.selectedMasterId}`);
        const data = await res.json();
        
        if (data && data.base) {
          this.charForm = { 
            ...data.base, 
            master_id: this.selectedMasterId 
          };
        }
        
        this.buffs = data.buffs || [];
      } catch (error) {
        console.error("캐릭터 상세 로드 실패:", error);
      }
    },
    async saveBaseInfo() {
      const masterId = this.selectedMasterId || this.charForm.master_id;

      if (!masterId) {
        alert("선택된 캐릭터(master_id)가 없습니다.");
        return;
      }
      
      if (!this.charForm.char_id) {
        alert("char_id 데이터가 없습니다. 캐릭터를 다시 선택해주세요.");
        return;
      }

      const payload = {
        ...this.charForm,
        master_id: masterId
      };

      try {
        const res = await fetch(`${this.BASE_URL}/api/char_detail/${masterId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          alert("기본 정보 수정 완료!");
          this.fetchCharacters();
        } else {
          const errText = await res.text();
          alert(`저장 실패: ${errText}`);
        }
      } catch (err) {
        console.error("저장 중 통신 에러:", err);
      }
    },
    async saveModifiedBuffsBatch() {
      if (this.buffs.length === 0) {
        alert('저장할 데이터가 존재하지 않습니다.');
        return;
      }
      if (!this.selectedMasterId || !this.charForm.char_id) {
        alert('상단에서 캐릭터 정보를 먼저 로드해 주세요.');
        return;
      }
      if (!confirm(`화면의 모든 변경사항(기존 수정 및 신규 추가 총 ${this.buffs.length}건)을 일괄 저장하시겠습니까?`)) {
        return;
      }

      let updateCount = 0;
      let insertCount = 0;
      let failCount = 0;

      try {
        for (const buff of this.buffs) {
          if (buff.isNew) {
            const payload = { ...buff, master_id: this.selectedMasterId, char_id: this.charForm.char_id };
            const response = await fetch(`${this.BASE_URL}/api/char_buff_insert`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (data.success) {
              insertCount++;
              buff.isNew = false;           
              buff.buff_seq = data.buff_seq; 
            } else {
              failCount++;
            }
          } 
          else if (buff.buff_seq) {
            const response = await fetch(`${this.BASE_URL}/api/char_buff_update`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(buff)
            });
            const data = await response.json();
            if (data.success) {
              updateCount++;
            } else {
              failCount++;
            }
          }
        }

        if (failCount === 0) {
          alert(`[저장 완료] 기존 수정: ${updateCount}건 / 신규 추가: ${insertCount}건이 모두 저장되었습니다.`);
        } else {
          alert(`[일부 실패] 성공(수정: ${updateCount}건, 추가: ${insertCount}건) / 실패: ${failCount}건`);
        }
        this.fetchCharDetail();
      } catch (error) {
        console.error('일괄 저장 중 에러:', error);
      }
    },
    async saveBuffRow(buff) {
      if (!this.selectedMasterId || !this.charForm.char_id) {
        alert('상단에서 캐릭터 정보를 먼저 로드해 주세요.');
        return;
      }
      try {
        if (buff.isNew) {
          const payload = { ...buff, master_id: this.selectedMasterId, char_id: this.charForm.char_id };
          const response = await fetch(`${this.BASE_URL}/api/char_buff_insert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await response.json();
          if (data.success) {
            alert('신규 스킬 데이터가 성공적으로 추가되었습니다!');
            buff.isNew = false;       
            buff.buff_seq = data.buff_seq; 
          } else {
            alert('저장 실패: ' + (data.message || '알 수 없는 오류'));
          }
        } 
        else {
          if (!buff.buff_seq) {
            alert('식별 고유키(buff_seq)가 누락되어 수정을 진행할 수 없습니다.');
            return;
          }
          const response = await fetch(`${this.BASE_URL}/api/char_buff_update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buff)
          });
          const data = await response.json();
          if (data.success) {
            this.showDialogMsg();
          } else {
            alert('수정 실패: ' + (data.message || '알 수 없는 오류'));
          }
        }
      } catch (error) {
        console.error('저장 중 에러 발생:', error);
      }
    },
    async deleteBuffRow(buff, index) {
      if (buff.isNew) {
        this.buffs.splice(index, 1);
        return;
      }
      if (!buff.buff_seq) {
        alert('식별 고유키(buff_seq)가 없어 삭제할 수 없습니다.');
        return;
      }
      if (!confirm(`정말로 이 스킬 데이터를 삭제하시겠습니까?\n(버프 이름: ${buff.buff_name || '없음'})`)) {
        return;
      }
      try {
        const response = await fetch(`${this.BASE_URL}/api/char_buff_delete/${buff.buff_seq}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          alert('데이터가 정상적으로 삭제되었습니다.');
          this.buffs.splice(index, 1); 
        } else {
          alert('삭제 실패: ' + (data.message || '알 수 없는 오류'));
        }
      } catch (error) {
        console.error('삭제 처리 중 에러 발생:', error);
      }
    }
  }
}
</script>

<style scoped>
.main-layout-container { display: flex; flex-direction: column; gap: 20px; padding: 20px; background-color: #f4f6f9; min-height: 100vh; }
.top-setup-wrapper { display: flex; gap: 20px; width: 100%; }
.form-section { flex: 1.4; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
.summary-section { flex: 1; display: flex; flex-direction: column; }
.form-grid-layout { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.form-group { display: flex; align-items: center; }
.form-group.select-group { margin-bottom: 15px; border-bottom: 1px dashed #e3e8ee; padding-bottom: 15px; }
.form-group label { font-weight: bold; font-size: 12px !important; width: 90px; flex-shrink: 0; }
.form-group input, .form-group select { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 11px !important; }
.select-box { width: 100%; padding: 8px 12px; font-size: 12px !important; font-weight: bold; border: 2px solid #1a1a1a; border-radius: 6px; }
.form-group.btn-group { grid-column: span 2; margin-top: 5px; display: flex; gap: 8px; }
.btn-save { background-color: #1a1a1a; color: white; padding: 10px; border: none; border-radius: 4px; font-weight: bold; flex: 1; cursor: pointer; font-size: 12px !important; transition: background-color 0.2s; }
.btn-save:hover { background-color: #333333; }
.btn-detail-pop { background-color: #3b5bdb; color: white; padding: 10px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px !important; transition: background-color 0.2s; flex: 0.6; }
.btn-detail-pop:hover { background-color: #2b44b8; }
.helper-card { background: #ebf5ff; border-left: 4px solid #339af0; padding: 20px; border-radius: 6px; height: 100%; box-sizing: border-box; }
.helper-card h4 { margin-top: 0; margin-bottom: 12px; color: #1c7ed6; font-size: 14px; }
.helper-card ul { margin: 0; padding-left: 20px; font-size: 12px; color: #495057; line-height: 1.9; }
.full-width-section { width: 100%; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); box-sizing: border-box; }
.grid-section h3, .form-section h3 { font-size: 14px !important; font-weight: bold; margin-top: 0; margin-bottom: 15px; }
.table-responsive { width: 100%; overflow-x: auto; }
.grid-scroll-container { max-height: 820px; overflow-y: auto; border: 1px solid #dcdee2; border-radius: 6px; }
.deck-grid-table { width: 100%; border-collapse: collapse; min-width: 1024px; table-layout: fixed; }
.deck-grid-table th { background-color: #f8f9fa; font-weight: bold; font-size: 12px !important; padding: 5px 5px; border-right: 1px solid #dcdee2; border-bottom: 2px solid #1a1a1a; text-align: center; position: sticky; top: 0; z-index: 10; color: #1a1a1a; }
.deck-grid-table td { padding: 8px 6px; border-right: 1px solid #dcdee2; border-bottom: 1px solid #dcdee2; vertical-align: middle !important; text-align: center; font-size: 11px !important; color: #1a1a1a; box-sizing: border-box; }
.new-buff-row td { color: #1c7ed6 !important; font-weight: 500; }
.editable { background-color: #fffdf4; cursor: text; }
.editable:focus { outline: 2px solid #e67e22; background-color: #ffffff; }
.readonly-td-name { font-size: 11px !important; font-weight: bold !important; vertical-align: middle !important; }
.code-text-value { font-weight: bold; color: #2c3e50; }
.text-wrap-td { white-space: normal !important; word-break: break-all !important; }
.integrated-mgmt-td { background-color: #f8f9fa; padding: 8px !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; gap: 8px !important; min-height: 100px !important; height: 100% !important; box-sizing: border-box !important; }
.skill-name-row { text-align: center; width: 100%; line-height: 1.2; }
.integrated-action-group { display: flex; align-items: center; justify-content: center; gap: 3px; width: 100%; }
.btn-copy-row-slim, .btn-save-row-slim, .btn-delete-row-slim { padding: 4px 8px !important; font-size: 11px !important; cursor: pointer; border-radius: 4px; border: 1px solid #ced4da; background-color: #ffffff; transition: all 0.15s ease; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
.btn-copy-row-slim:hover { background-color: #e2e8f0; border-color: #cbd5e1; }
.btn-save-row-slim:hover { background-color: #fff4e6; border-color: #ffd8a8; }
.btn-delete-row-slim:hover { background-color: #fff5f5; border-color: #ffc9c9; }
.empty-td { text-align: center; color: #999; padding: 50px 0 !important; font-size: 12px !important; font-style: italic; }
.grid-select-box { padding: 4px 6px; border: 1px solid #ced4da; border-radius: 4px; font-size: 11px !important; background-color: #fffdf4; font-weight: bold; color: #1a1a1a; outline: none; cursor: pointer; box-sizing: border-box; }
.grid-select-box:focus { border-color: #e67e22; outline: 2px solid #e67e22; }
.grid-section-header { margin-bottom: 15px; }
.header-left-group { display: flex; align-items: center; gap: 6px; } 
.grid-section-header h3 { margin: 0 !important; }
.btn-save-batch { background-color: #1a1a1a; color: #ffffff; border: 1px solid #1a1a1a; padding: 7px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 11px !important; transition: all 0.2s ease; display: flex; align-items: center; gap: 4px; }
.btn-save-batch:hover { background-color: #e67e22; border-color: #e67e22; }
.btn-refresh-batch { background-color: #ffffff; color: #1a1a1a; border: 1px solid #1a1a1a; padding: 7px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 11px !important; transition: all 0.2s ease; display: flex; align-items: center; gap: 4px; }
.btn-refresh-batch:hover { background-color: #f1f3f5; border-color: #e67e22; color: #e67e22; }
.btn-code-manage { background-color: #2b8a3e; color: #ffffff; border: 1px solid #2b8a3e; padding: 7px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 11px !important; transition: all 0.2s ease; display: flex; align-items: center; gap: 4px; }
.btn-code-manage:hover { background-color: #237032; border-color: #237032; }
.info-row-top { display: flex; align-items: center; gap: 3px; margin-bottom: 4px; font-size: 11px; }
.info-row-middle { display: flex; width: 100%; }
.info-label { font-weight: bold; color: #555; margin-right: 2px; flex-shrink: 0; width: auto; }
.inline-edit { display: inline-block; min-width: 20px; padding: 1px 2px; text-align: center; border-radius: 3px; border: 1px solid transparent; }
.inline-edit:hover { border-color: #ccc; background-color: #ffffff; }
.info-split { color: #ccc; margin: 0 3px; }
.full-width-select { width: 100%; padding: 4px 6px; font-size: 11px !important; }
.buff-search-input-full { width: 100%; padding: 4px 6px; font-size: 11px; border: 1px solid #ced4da; border-radius: 4px; box-sizing: border-box; background-color: #ffffff; }
.buff-name-row { display: flex; align-items: center; width: 100%; }
.buff-name-edit { width: calc(100% - 55px) !important; font-weight: bold; }
.buff-range-combined-row { display: flex; align-items: center; width: 100%; gap: 12px; }
.range-part { display: flex; align-items: center; flex-shrink: 0; }
.detail-part { display: flex; align-items: center; flex: 1; }
.type-range-edit { min-width: 35px; text-align: left; }
.range-detail-edit { width: calc(100% - 55px) !important; }
.buff-remark-row { display: flex; align-items: flex-start; width: 100%; }
.buff-remark-row .info-label { margin-top: 2px; }
.remark-style { background-color: #f1f3f5; font-size: 11px; }
.inline-block-edit { display: inline-block; width: calc(100% - 55px); min-height: 18px; padding: 2px 4px; vertical-align: middle; border-radius: 3px; border: 1px solid transparent; box-sizing: border-box; }
.inline-block-edit:hover { border-color: #ccc; background-color: #ffffff; }
.custom-dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background-color: #ffffff;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  z-index: 999;
  margin: 4px 0 0 0;
  padding: 0;
  list-style: none;
}

.custom-dropdown-list li {
  padding: 8px 12px;
  font-size: 11px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f5;
}

.custom-dropdown-list li:hover {
  background-color: #e7f5ff;
  color: #1c7ed6;
}
@media (max-width: 1024px) {
  .menu-style-container { padding: 12px 4px; text-align: left; }
  .top-setup-wrapper { flex-direction: column; gap: 15px; }
  .form-grid-layout { grid-template-columns: 1fr; }
  .form-group.btn-group { grid-column: span 1; }
  .grid-section, .form-section, .summary-section { width: 100% !important; max-width: 100% !important; padding: 15px 10px !important; border-radius: 0px !important; border-left: none !important; border-right: none !important; box-sizing: border-box !important; }
}
</style>