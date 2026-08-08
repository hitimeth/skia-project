<template>
  <div class="flex-container">
    <div class="grid-section">
      
      <div class="filter-wrapper">
        <label class="filter-label">🎯 덱선택</label>
        <select class="filter-select-box" v-model="selectedCategoryAnchor" @change="scrollToCategory">
          <option value="">✨ 카테고리를 선택하세요 (이동) ✨</option>
          <option v-for="(cat, idx) in fixedCategories" :key="cat" :value="cat">
            {{ idx + 1 }}. {{ cat }}
          </option>
        </select>
      </div>

      <h3 class="section-title">⚔️ 덱공유 상세</h3>
      
      <div class="deck-list-wrapper">
        
        <div 
          v-for="category in fixedCategories" 
          :key="category" 
          :ref="'cat-' + category"
          class="category-block"
        >
          <div class="category-title-box">
            <h4 class="category-heading">{{ category }}</h4>
          </div>

          <ul class="deck-item-list" v-if="getSortedDecksByCategory(category).length > 0">
            <li v-for="deck in getSortedDecksByCategory(category)" :key="deck.board_id" class="deck-item">
              
              <div class="deck-item-content">
                <span class="deck-date">🔹 [ID: {{ deck.board_id }}]</span>
                <span class="deck-title-text">{{ deck.title }}</span>
                <span class="deck-summary" v-if="deck.char_buff_summary">({{ deck.char_buff_summary }})</span>
                <span class="deck-content-text">{{ deck.content }}</span>
                
                <img v-if="deck.image_url" :src="BASE_URL + deck.image_url" class="deck-mini-img" @click="openImage(deck.image_url)" title="클릭하여 확대">
              </div>

              <div class="deck-item-actions">
                <button class="btn-action btn-copy" @click="copyToClipboard(deck.content)">복사</button>
                <button class="btn-action btn-edit" @click="setEditDeck(deck)">수정</button>
                <button class="btn-action btn-delete" @click="deleteDeckPost(deck.board_id)">삭제</button>
              </div>
            </li>
          </ul>

          <div v-else class="empty-sub-msg">등록된 공략 정보가 없습니다.</div>
        </div>

      </div>
    </div>  

    <div class="form-section">
      <h3 style="color:#e67e22;">📝 {{ isEditMode ? '🔧 공략 수정하기' : '📢 덱 공략 및 조합키 등록' }}</h3>
      <form @submit.prevent="saveDeckPost">
        
        <div class="form-group">
          <label>분류</label>
          <select v-model="deckForm.category">
            <option v-for="cat in fixedCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>날짜</label>
          <input type="text" v-model="deckForm.log_date" placeholder="예: 6/25 또는 YYYY-MM-DD">
        </div>

        <div class="form-group">
          <label>내용</label>
          <input type="text" v-model="deckForm.title" placeholder="내용(제목)을 입력하세요" required>
        </div>

        <div class="form-group">
          <label>핵심 영웅 조합 요약</label>
          <input type="text" v-model="deckForm.char_buff_summary" placeholder="예: 바네사, 에이스, 제이브">
        </div>

        <div class="form-group">
          <label>덱</label>
          <textarea v-model="deckForm.content" rows="6" placeholder="복잡한 [조합키 문자열]이나 배치법을 입력하세요"></textarea>
        </div>
        
        <div class="form-group">
          <label>덱 배치 이미지 파일</label>
          <input type="file" ref="deckFile" accept="image/*">
        </div>
        
        <button type="submit" class="btn-save" style="background-color: #e67e22; margin-bottom: 8px;">
          {{ isEditMode ? '💾 공략 수정 완료' : '🚀 공략 등록하기' }}
        </button>
        <button type="button" class="btn-cancel" v-if="isEditMode" @click="resetDeckForm">취소</button>
        
        <button type="button" class="btn-save btn-img-only" @click="triggerImageOnlyUpload">
          🟩 이미지 등록하기 (18. 덱이미지 관리용)
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      BASE_URL: 'http://3.34.44.168:3000',
      decks: [],
      selectedCategoryAnchor: '',
      isEditMode: false,
      // log_date 필드를 추가하여 설계도와 매핑
      deckForm: { board_id: '', category: '스테이지', log_date: '', title: '', char_buff_summary: '', content: '', existing_image_url: '' },
      fixedCategories: [
        "스테이지", "악몽", "악몽조각", "악몽스테이지", "깊은 밤의 악몽",
        "일반결투장", "상급결투장", "천상결투장", "보스전", "일일던전",
        "운명의굴레", "승천의탑", "신기루탑", "심연탐사", "혼돈",
        "하드보스", "강림의날", "덱이미지"
      ]
    }
  },
  mounted() { this.fetchDeckPosts(); },
  methods: {
    async fetchDeckPosts() {
      const res = await fetch(`${this.BASE_URL}/api/decks`);
      this.decks = await res.json();
    },
    // 핵심 변경사항: 카테고리별 데이터를 가져올 때 board_id 기준 역순(내림차순, 최신글이 위로) 정렬함
    getSortedDecksByCategory(category) {
      const filtered = this.decks.filter(deck => deck.category === category);
      return filtered.sort((a, b) => b.board_id - a.board_id);
    },
    scrollToCategory() {
      if (!this.selectedCategoryAnchor) return;
      const targetRef = this.$refs['cat-' + this.selectedCategoryAnchor];
      if (targetRef && targetRef[0]) {
        targetRef[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      this.selectedCategoryAnchor = ''; 
    },
    copyToClipboard(text) {
      if (!text) { alert('복사할 내용이 없습니다.'); return; }
      navigator.clipboard.writeText(text).then(() => {
        alert('조합키 코드가 클립보드에 복사되었습니다!📋');
      }).catch(() => {
        alert('복사에 실패했습니다. 수동으로 복사해주세요.');
      });
    },
    triggerImageOnlyUpload() {
      this.deckForm.category = "덱이미지";
      if(!this.deckForm.title) this.deckForm.title = "추천 배치도 파일";
      alert("'분류'가 [덱이미지]로 전환되었습니다. 파일을 선택한 뒤 상단의 등록하기 버튼을 눌러주세요!");
    },
    async saveDeckPost() {
      const formData = new FormData();
      formData.append('title', this.deckForm.title);
      formData.append('category', this.deckForm.category);
      formData.append('char_buff_summary', this.deckForm.char_buff_summary);
      formData.append('content', this.deckForm.content);
      formData.append('log_date', this.deckForm.log_date); // 날짜 데이터 전송 추가
      
      const fileInput = this.$refs.deckFile;
      if(fileInput && fileInput.files[0]) formData.append('deckImage', fileInput.files[0]);

      let url = `${this.BASE_URL}/api/decks`;
      let method = 'POST';

      if(this.isEditMode) {
        url = `${this.BASE_URL}/api/decks/${this.deckForm.board_id}`;
        method = 'PUT';
        formData.append('existing_image_url', this.deckForm.existing_image_url);
      }

      const res = await fetch(url, { method: method, body: formData });
      const result = await res.json();
      if(result.success) {
        alert('성공적으로 저장되었습니다!');
        this.resetDeckForm();
        this.fetchDeckPosts();
      }
    },
    setEditDeck(deck) {
      this.isEditMode = true;
      this.deckForm = { 
        board_id: deck.board_id, 
        category: deck.category, 
        log_date: deck.log_date || '', // 기존 데이터 대응
        title: deck.title, 
        char_buff_summary: deck.char_buff_summary, 
        content: deck.content, 
        existing_image_url: deck.image_url || '' 
      };
    },
    async deleteDeckPost(boardId) {
      if(!confirm('정mar 삭제하시겠습니까?')) return;
      await fetch(`${this.BASE_URL}/api/decks/${boardId}`, { method: 'DELETE' });
      this.fetchDeckPosts();
    },
    resetDeckForm() {
      this.isEditMode = false;
      this.deckForm = { board_id: '', category: '스테이지', log_date: '', title: '', char_buff_summary: '', content: '', existing_image_url: '' };
      if(this.$refs.deckFile) this.$refs.deckFile.value = '';
    },
    openImage(url) { window.open(this.BASE_URL + url); }
  }
}
</script>

<style scoped>
/* 메인 컨테이너 구조 */
.flex-container { display: flex; gap: 20px; padding: 20px; align-items: flex-start; }
.grid-section { flex: 2; background: #fdfdfd; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.form-section { flex: 1; background: white; padding: 20px; border-radius: 8px; height: fit-content; box-shadow: 0 2px 8px rgba(0,0,0,0.06); position: sticky; top: 20px; }

/* 콤보박스 래퍼 (라벨명 변경 반영) */
.filter-wrapper { background: #f8f9fa; padding: 12px 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px; }
.filter-label { font-weight: bold; font-size: 14px; color: #4a5568; white-space: nowrap; }
.filter-select-box { flex: 1; max-width: 320px; padding: 8px 12px; font-size: 14px; font-weight: bold; border: 2px solid #9b59b6; border-radius: 6px; background-color: white; outline: none; cursor: pointer; }
.section-title { color: #9b59b6; margin-top: 10px; margin-bottom: 20px; padding-bottom: 5px; border-bottom: 1px solid #edf2f7; }

/* 카테고리 고정형 카드 박스 연출 */
.deck-list-wrapper { display: flex; flex-direction: column; gap: 20px; }
.category-block { background: white; border: 1px solid #dcdde1; border-radius: 6px; padding: 15px; box-shadow: 0 1px 4px rgba(0,0,0,0.03); scroll-margin-top: 20px; }
.category-title-box { border: 1px solid #2c3e50; width: fit-content; padding: 4px 12px; margin-bottom: 12px; border-radius: 4px; background: #fdfdfd; }
.category-heading { margin: 0; font-size: 14px; font-weight: bold; color: #2c3e50; }

/* 리스트 정렬 및 텍스트 전체 진하게 처리 (요구사항 반영) */
.deck-item-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.deck-item { border: 1px solid #eec; border-left: 4px solid #f1c40f; padding: 10px 12px; background: #fffcf4; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; gap: 15px; }
.deck-item-content { font-size: 13.5px; line-height: 1.6; word-break: break-all; flex: 1; text-align: left; }

/* 🔹 진하게(font-weight: bold) 전면 적용 */
.deck-date { color: #2980b9; font-weight: bold; margin-right: 6px; }
.deck-title-text { font-weight: bold; color: #2c3e50; text-decoration: underline; margin-right: 6px; }
.deck-summary { color: #27ae60; font-weight: bold; margin-right: 8px; }
.deck-content-text { color: #2c3e50; font-weight: bold; font-family: monospace; background: #fafafa; padding: 2px 6px; border: 1px solid #eee; border-radius: 3px; }
.deck-mini-img { max-height: 24px; vertical-align: middle; margin-left: 8px; border-radius: 3px; border: 1px solid #ccc; cursor: pointer; }

/* 버튼 관리 액션 구역 */
.deck-item-actions { display: flex; gap: 4px; flex-shrink: 0; }
.btn-action { border: none; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer; color: white; }
.btn-copy { background-color: #34495e; } 
.btn-edit { background-color: #3498db; }
.btn-delete { background-color: #e74c3c; }
.empty-sub-msg { color: #b2bec3; font-size: 12px; padding-left: 5px; font-style: italic; text-align: left; }

/* 폼 스타일 및 녹색 이미지 등록 버튼 */
.form-group { margin-bottom: 12px; display: flex; flex-direction: column; }
.form-group label { font-weight: bold; font-size: 14px; margin-bottom: 5px; text-align: left; color: #2c3e50; }
.form-group input, .form-group select, .form-group textarea { padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
.btn-save { color: white; padding: 10px; border: none; border-radius: 4px; font-weight: bold; width: 100%; cursor: pointer; }
.btn-img-only { background-color: #27ae60 !important; margin-top: 5px; } 
.btn-img-only:hover { background-color: #219653 !important; }
.btn-cancel { width: 100%; margin-top: 5px; padding: 8px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer; }

/* 반응형 처리 */
@media (max-width: 1024px) {
  .flex-container { flex-direction: column; }
  .grid-section, .form-section { width: 100%; flex: none; }
  .form-section { position: static; }
}
@media (max-width: 600px) {
  .deck-item { flex-direction: column; align-items: flex-start; gap: 10px; }
  .deck-item-actions { width: 100%; justify-content: flex-end; border-top: 1px dashed #eee; padding-top: 6px; }
}
</style>