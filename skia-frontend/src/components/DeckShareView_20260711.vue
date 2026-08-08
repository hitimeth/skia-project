<template>
  <div class="menu-style-container">
    <header class="main-banner-container">
      <div class="banner-inner">
        <div class="header-category-nav">
          <div class="nav-grid">
            <button v-for="cat in fixedCategories" :key="cat" @click="scrollToCategory(cat)" class="nav-link">
              {{ cat }}
            </button>
          </div>
        </div>
      </div>
      <div class="banner-bottom-accent"></div>
    </header>

    <div class="flex-container">
      <!-- 덱 리스트 구역 -->
      <div class="grid-section">        
        <div class="deck-list-wrapper">
          <div 
            v-for="category in fixedCategories" 
            :key="category" 
            :ref="'cat-' + category"
            class="category-block"
          >
            <!-- 🎯 [요청사항 반영] LIST 글씨를 슬림한 [추가] 버튼으로 변경 및 기능 바인딩 -->
            <div class="category-title-box">
              <button class="course-badge btn-add-category" @click="prepareRegisterByCategory(category)">
                추가
              </button>
              <h4 class="category-heading">{{ category }}</h4>
            </div>

            <div class="table-responsive grid-scroll-container" v-if="getSortedDecksByCategory(category).length > 0">
              <table class="deck-grid-table">
                <thead>
                  <!-- 구조 유지를 위한 빈 헤더 -->
                </thead>
                <tbody>
                  <tr v-for="deck in getSortedDecksByCategory(category)" :key="deck.board_id">
                    <!-- 날짜/기록일 영역 -->
                    <td class="td-center font-bold">{{ deck.log_date || 'N/A' }}</td>
                    
                    <!-- 덱 상세 내용 영역 -->
                    <td style="text-align: left; padding: 6px 8px; white-space: normal !important;">
                      <div class="deck-header-inline" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                        <span style="font-weight: 800; color: #1a1a1a; font-size: 11px;">{{ deck.title }}</span>
                        
                        <div class="deck-action-inline" style="display: flex; gap: 4px; align-items: center;">
                          <button class="btn-grid-mini" @click="setEditDeck(deck)">수정</button>
                          <button class="btn-grid-mini btn-delete-mini" @click="deleteDeckPost(deck.board_id)">✕</button>
                        </div>
                      </div>

                      <div v-if="deck.image_url" class="deck-image-preview-box" style="margin: 6px 0;">
                        <img 
                          :src="BASE_URL + deck.image_url" 
                          alt="등록된 덱 배치 이미지" 
                          class="deck-list-img"
                          @click="openImage(deck.image_url)"
                          style="max-width: 180px; max-height: 120px; border-radius: 4px; border: 1px solid #e2e8f0; cursor: pointer; display: block;"
                        />
                        <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 2px;">💡 이미지를 클릭하면 원본 크기로 볼 수 있습니다.</span>
                      </div>
                      
                      <template v-for="idx in [1, 2, 3]" :key="idx">
                        <div v-if="deck['deck_content' + idx]" class="deck-row-inline" style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                          <span style="font-size: 11px; color: #777; font-weight: bold; white-space: nowrap;">[덱{{ idx }}]</span>
                          <button @click="copyToClipboard(deck['deck_content' + idx])" class="btn-grid-copyinline">복사</button>
                          <span style="font-size: 11px; color: #333; word-break: break-all;">{{ deck['deck_content' + idx] }}</span>
                        </div>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="empty-sub-msg">현재 등록된 추천 공략 조합이 없습니다.</div>
          </div>
        </div>
      </div>  

      <!-- 우측 입력/수정 폼 구역 -->
      <div class="form-section" ref="formSection">
        <div class="registration-board-container">
          <h3 class="reg-main-title">📝 {{ isEditMode ? '덱 공략 및 조합 수정하기' : '덱 공략 및 조합키 등록' }}</h3>
        </div>
        
        <form @submit.prevent="saveDeckPost" class="signature-form-layout">
          
          <div class="signature-form-group">
            <div class="label-badge-box">📌 분류</div>
            <div class="input-field-box">
              <select v-model="deckForm.category" :disabled="isEditMode">
                <option v-for="cat in fixedCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>

          <div class="signature-form-group">
            <div class="label-badge-box">📅 기록날짜</div>
            <div class="input-field-box">
              <input type="text" v-model="deckForm.log_date" placeholder="예: 07/01">
            </div>
          </div>

          <div class="signature-form-group">
            <div class="label-badge-box">📝 내용</div>
            <div class="input-field-box">
              <input type="text" v-model="deckForm.title" placeholder="내용을 입력하세요" required>
            </div>
          </div>

          <div class="signature-form-group align-stretch">
            <div class="label-badge-box">💻 덱 1</div>
            <div class="input-field-box">
              <textarea v-model="deckForm.deck_content1" rows="1" placeholder="첫 번째 덱"></textarea>
            </div>
          </div>
          <div class="signature-form-group align-stretch">
            <div class="label-badge-box">💻 덱 2</div>
            <div class="input-field-box">
              <textarea v-model="deckForm.deck_content2" rows="1" placeholder="두 번째 덱"></textarea>
            </div>
          </div>
          <div class="signature-form-group align-stretch">
            <div class="label-badge-box">💻 덱 3</div>
            <div class="input-field-box">
              <textarea v-model="deckForm.deck_content3" rows="1" placeholder="세 번째 덱"></textarea>
            </div>
          </div>
                    
          <div class="signature-form-group align-stretch">
            <div class="label-badge-box text-nowrap">🖼️ 이미지첨부</div>
            <div class="input-field-box file-custom-box">
              <div v-if="isEditMode && deckForm.existing_image_url" style="margin-bottom: 8px;">
                <span style="font-size: 11px; color: #666; display: block; margin-bottom: 4px;">현재 등록된 이미지:</span>
                <img :src="BASE_URL + deckForm.existing_image_url" style="max-width: 100px; max-height: 70px; border-radius: 4px; border: 1px solid #cbd5e1;" />
              </div>
              <input type="file" ref="deckFile" accept="image/*">
              <span v-if="isEditMode" style="font-size: 10px; color: #e67e22; display: block; margin-top: 2px;">💡 이미지를 변경하려면 새 파일을 선택하세요. 선택하지 않으면 기존 이미지가 유지됩니다.</span>
            </div>
          </div>
          
          <div class="form-action-button-group">
            <button type="submit" class="btn-archive-submit btn-black-solid">
              🚀 {{ isEditMode ? '수정 완료하기' : '등록하기' }}
            </button>
            
            <button type="button" class="btn-cancel-floating" v-if="isEditMode" @click="resetDeckForm">
              ❌ 수정 모드 취소
            </button>
            
            <button type="button" class="btn-archive-submit btn-gray-trans" v-if="!isEditMode" @click="triggerImageOnlyUpload">
              🖼️ 이미지 전용 업로드 모드 전환
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 플로팅 탑 버튼 -->
    <button 
      v-show="showScrollTopBtn" 
      @click="scrollToTop" 
      class="btn-scroll-top"
      title="위로 이동"
    >
      ▲
    </button>
  </div>
</template>

<script>
export default {
  name: 'DeckShareView',
  data() {
    return {
      BASE_URL: import.meta.env.VITE_API_URL,
      decks: [],
      isEditMode: false,
      showScrollTopBtn: false,
      deckForm: { board_id: '', category: '깊은밤의악몽', log_date: '', title: '', char_buff_summary: '', content: '', existing_image_url: '', deck_content1: '', deck_content2: '', deck_content3: '' },
      fixedCategories: [
        "깊은밤의악몽", "천상결투장","신기루탑", "스테이지", "악몽조각", "악몽스테이지",
        "일반결투장", "상급결투장", "천상결투장", "보스전", "일일던전", "운명의굴레",
        "승천의탑", "신기루탑", "심연탐사", "혼돈", "하드보스", "강림의날", "덱이미지"
      ]
    }
  },
  mounted() { 
    this.fetchDeckPosts();  
    window.addEventListener('scroll', this.handleScroll);

    // 💡 [화면 유지를 위한 자동 강제 복원 로직]
    const lastMenu = localStorage.getItem('last_active_menu');
    const savedForm = localStorage.getItem('temp_deck_form');

    if (lastMenu === 'deck_share' && savedForm) {
      try {
        const parsedForm = JSON.parse(savedForm);
        this.deckForm = parsedForm;

        // 만약 수정 모드였다면 수정 모드 유지, 아니면 등록 모드 유지
        this.isEditMode = !!parsedForm.board_id;

        // ⏱️ 모바일 기기가 리로드되자마자 즉시 사용자가 보던 등록 폼 위치로 강제 스크롤 고정
        this.$nextTick(() => {
          setTimeout(() => {
            const targetCategory = this.$refs['cat-' + parsedForm.category];
            const targetForm = this.$refs.formSection;
            
            // 모바일 레이아웃(세로 배치) 특성에 맞춰 폼이나 선택했던 카테고리로 즉시 화면 이동
            if (targetForm) {
              targetForm.scrollIntoView({ behavior: 'auto', block: 'start' });
            } else if (targetCategory && targetCategory[0]) {
              targetCategory[0].scrollIntoView({ behavior: 'auto', block: 'start' });
            }
          }, 150); // 모바일 브라우저가 화면을 다 그리는 찰나의 대기 시간 부여
        });
      } catch (e) {
        console.error("복원 실패:", e);
      }
    }
  },
  watch: {
    deckForm: {
      deep: true,
      handler(newForm) {
        // 작성 중인 내용 저장
        localStorage.setItem('temp_deck_form', JSON.stringify(newForm));
        // 💡 [추가] 튕겼을 때 이 메뉴로 바로 돌아오도록 '덱공유' 상태임을 기록
        localStorage.setItem('last_active_menu', 'deck_share');
      }
    }
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    async fetchDeckPosts() {
      try {
        const res = await fetch(`${this.BASE_URL}/api/decks`);
        this.decks = await res.json();
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      }
    },
// 🎯 [정렬 수정] 화면 렌더링 시 날짜와 ID를 기준으로 내림차순 정렬
    getSortedDecksByCategory(category) {
      return this.decks
        .filter(deck => deck.category === category)
        .sort((a, b) => {
          // 1. 기준날짜(log_date) 문자열 내림차순 정렬 (예: '06/25'가 '06/12'보다 위로)
          // 값이 없을 경우(N/A) 빈 문자열 처리하여 아래로 내립니다.
          const dateA = a.log_date || '';
          const dateB = b.log_date || '';
          
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA); 
          }
          
          // 2. 날짜가 완벽히 같다면 board_id 기준 내림차순 정렬
          return b.board_id - a.board_id;
        });
    },
    scrollToCategory(category) {
      const targetArray = this.$refs['cat-' + category];
      if (targetArray && targetArray.length > 0) {
        targetArray[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    
    // 🎯 [요청사항 반영] 왼쪽 [추가] 버튼 클릭 시 작동 핸들러
    prepareRegisterByCategory(category) {
      this.isEditMode = false; // 수정 모드 해제 및 등록 모드 전환
      
      // 기존 입력 데이터는 깔끔하게 비우되, 선택한 분류(Category)를 폼에 자동 입력합니다.
      this.deckForm = { 
        board_id: '', 
        category: category, 
        log_date: '', 
        title: '', 
        char_buff_summary: '', 
        content: '', 
        existing_image_url: '', 
        deck_content1: '', 
        deck_content2: '', 
        deck_content3: '' 
      };
      if(this.$refs.deckFile) this.$refs.deckFile.value = '';

      // 등록 폼이 있는 우측 상단 영역으로 화면을 부드럽게 스크롤합니다.
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    copyToClipboard(text) {
      if (!text) { 
        alert('복사할 내용이 없습니다.'); 
        return; 
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          //alert('복사되었습니다! 📋');
        }).catch(() => {
          this.fallbackCopyText(text);
        });
      } else {
        this.fallbackCopyText(text);
      }
    },
    fallbackCopyText(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        if (document.execCommand('copy')) {
          //alert('복사되었습니다! 📋');
        } else {
          alert('복사에 실패했습니다.');
        }
      } catch (err) {
        alert('복사 중 오류가 발생했습니다.');
      }
      document.body.removeChild(textArea);
    },

    triggerImageOnlyUpload() {
      this.deckForm.category = "덱이미지";
      if(!this.deckForm.title) this.deckForm.title = "추천 배치도 파일";
      alert("분류가 [덱이미지] 모드로 전환되었습니다.");
    },

    async saveDeckPost() {
      const formData = new FormData();
      formData.append('title', this.deckForm.title);
      formData.append('category', this.deckForm.category);
      formData.append('char_buff_summary', '');
      formData.append('deck_content1', this.deckForm.deck_content1 || '');
      formData.append('deck_content2', this.deckForm.deck_content2 || '');
      formData.append('deck_content3', this.deckForm.deck_content3 || '');
      formData.append('log_date', this.deckForm.log_date);
      
      const fileInput = this.$refs.deckFile;
      if(!this.isEditMode && fileInput && fileInput.files[0]) {
        formData.append('deckImage', fileInput.files[0]);
      }

      let url = `${this.BASE_URL}/api/decks`;
      let method = 'POST';

      if(this.isEditMode) {
        url = `${this.BASE_URL}/api/decks/${this.deckForm.board_id}`;
        method = 'PUT';
        formData.append('existing_image_url', this.deckForm.existing_image_url || '');
      }

      try {
        const res = await fetch(url, { method: method, body: formData });
        const result = await res.json();
        if(result.success || result) {
          alert('성공적으로 저장되었습니다.');
          
          // 🎯 [요청사항 반영] 등록 성공 후에도 방금 등록한 최근 분류를 그대로 유지합니다.
          const currentCategory = this.deckForm.category; 
          this.resetDeckForm();
          this.deckForm.category = currentCategory; 
          
          this.fetchDeckPosts();
        }
      } catch (err) {
        console.error("저장 실패:", err);
        alert("처리에 실패했습니다.");
      }
    },

    setEditDeck(deck) {
      this.isEditMode = true;
      this.deckForm = { 
        board_id: deck.board_id, 
        category: deck.category, 
        log_date: deck.log_date || '', 
        title: deck.title, 
        deck_content1: deck.deck_content1 || '', 
        deck_content2: deck.deck_content2 || '', 
        deck_content3: deck.deck_content3 || '', 
        existing_image_url: deck.image_url || '' 
      };
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    async deleteDeckPost(boardId) {
      if(!confirm('정말 삭제하시겠습니까?')) return;
      try {
        await fetch(`${this.BASE_URL}/api/decks/${boardId}`, { method: 'DELETE' });
        this.fetchDeckPosts();
      } catch (err) {
        console.error("삭제 실패:", err);
      }
    },
    resetDeckForm() {
      this.isEditMode = false;
      this.deckForm = { board_id: '', category: '스테이지', log_date: '', title: '', char_buff_summary: '', content: '', existing_image_url: '', deck_content1: '', deck_content2: '', deck_content3: '' };
      if(this.$refs.deckFile) this.$refs.deckFile.value = '';

      // 💡 [추가] 완료 시 복원용 흔적 청소
      localStorage.removeItem('temp_deck_form');
      localStorage.removeItem('last_active_menu');
    },
    handleScroll() {
      this.showScrollTopBtn = window.scrollY > 100;
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },        
    openImage(url) { 
      window.open(this.BASE_URL + url, '_blank'); 
    }
  }
}
</script>

<style scoped>
.menu-style-container {
  font-family: 'Noto Sans KR', sans-serif;
  background-color: #faf9f5;
  color: #1a1a1a;
  padding: 20px;
  min-height: 100vh;
}
.main-banner-container {
  background-color: #121212;
  color: #ffffff;
  border-radius: 12px;
  padding: 20px 35px;
  margin-bottom: 25px;
  position: relative; 
  z-index: 10;
}
.banner-inner { display: flex; justify-content: space-between; align-items: center; }
.banner-bottom-accent { position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(to right, #1a1a1a, #e67e22, #1a1a1a); }

.flex-container { display: flex; gap: 24px; align-items: flex-start; }
.grid-section { flex: 2.1; min-width: 0; }
.form-section { 
  flex: 1.1; 
  background: #ffffff; 
  padding: 30px 24px; 
  border-radius: 8px; 
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  position: sticky; 
  top: 30px; 
}
.deck-list-wrapper { display: flex; flex-direction: column; gap: 25px; }
.category-block { background: white; border-radius: 12px; padding: 20px; border: 1px solid #eaeae8; }
.category-title-box { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; }

/* 🎯 [요청사항 반영] LIST 배지를 높이가 반인 [추가] 클릭 버튼으로 변경 */
.btn-add-category {
  background: #1a1a1a; 
  color: white; 
  font-size: 10px; 
  font-weight: 700; 
  padding: 2px 8px; /* 위아래 패딩을 줄여 높이를 절반 수준으로 슬림화 */
  border-radius: 3px;
  border: none;
  cursor: pointer;
  transition: background-color 0.1s ease;
  line-height: 1.2;
}
.btn-add-category:hover {
  background: #e67e22; /* 마우스 올렸을 때 강조 효과 */
}

.category-heading { margin: 0; font-size: 14px; font-weight: 700; color: #1a1a1a; }

.table-responsive { width: 100%; overflow-x: auto; }
.grid-scroll-container { max-height: 450px; overflow-y: auto; border-bottom: 1px solid #1a1a1a; }
.deck-grid-table { width: 100%; text-align: left; font-size: 11px; min-width: 480px; border-collapse: collapse; }
.deck-grid-table th { background-color: #f1f2f6; color: #1a1a1a; font-weight: 700; padding: 8px; border: 1px solid #bcbcbc; text-align: center; position: sticky; top: 0; z-index: 10; }
.deck-grid-table td { padding: 6px 8px; border: 1px solid #dcdee2; vertical-align: middle; }

.td-center { text-align: center !important; width: 12%; }
.font-bold { font-weight: 700; color: #1a1a1a; }

.btn-grid-mini {
  border: 1px solid #cbd5e1;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  background: #ffffff;
  color: #475569;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-grid-mini:hover { background: #f1f5f9; border-color: #94a3b8; }
.btn-delete-mini { color: #dc2626; border-color: #fca5a5; background: #fff5f5; }
.btn-delete-mini:hover { background: #fee2e2; border-color: #ef4444; }

.btn-grid-copyinline {
  background: none;
  border: none;
  padding: 0 2px;
  color: #0066cc;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.btn-grid-copyinline:hover { text-decoration: underline; color: #004499; }

.empty-sub-msg { color: #aaa; font-size: 13px; padding: 20px 0; font-style: italic; text-align: center; }

/* 등록 폼 레이아웃 */
.registration-board-container { margin-bottom: 20px; border-bottom: 1px solid #edf2f7; padding-bottom: 12px; text-align: center; }
.reg-main-title { margin: 0; font-size: 15px; font-weight: 800; color: #1a1a1a; }
.signature-form-layout { display: flex; flex-direction: column; gap: 10px; }
.signature-form-group { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; }

.signature-form-group:first-of-type select {
  border: 2px solid #2ecc71 !important;
  font-weight: 700;
}
.align-stretch { align-items: flex-start !important; }
.label-badge-box { color: #2d3748; font-weight: 700; font-size: 12px; width: 78px; text-align: left; }
.input-field-box { flex: 1; min-width: 0; }
.input-field-box input, .input-field-box select, .input-field-box textarea {
  width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; color: #334155; background-color: #ffffff; box-sizing: border-box; outline: none;
}
.input-field-box textarea { resize: vertical; min-height: 40px; }

.form-action-button-group { display: flex; flex-direction: column; gap: 8px; margin-top: 15px; }
.btn-black-solid { width: 100%; padding: 12px; font-size: 13px; font-weight: 700; border-radius: 6px; cursor: pointer; border: none; background-color: #1a1a1a; color: #ffffff; }
.btn-gray-trans { width: 100%; padding: 10px; font-size: 12px; font-weight: 700; border-radius: 6px; cursor: pointer; background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.btn-cancel-floating { width: 100%; padding: 10px; background-color: #ffffff; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }

.header-category-nav { flex: 1; }
.nav-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
.nav-link { background: #2a2a2a; border: none; color: #fff; font-size: 11px; padding: 6px 4px; border-radius: 4px; text-align: center; cursor: pointer; }
.nav-link:hover { background: #e67e22; }

.btn-scroll-top {
  position: fixed; bottom: 24px; right: 24px; z-index: 999; width: 40px; height: 40px; border-radius: 50%; background-color: #1a1a1a; color: #ffffff; border: none; font-size: 15px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

@media (max-width: 1024px) {
  .menu-style-container { padding: 10px 0; }
  .main-banner-container { padding: 15px; border-radius: 0; }
  .nav-grid { grid-template-columns: repeat(4, 1fr); }
  .flex-container { flex-direction: column; gap: 15px; }
  .form-section { order: 1; width: 100%; position: static; padding: 15px; border-radius: 0; border-left: none; border-right: none; }
  .grid-section { order: 2; width: 100%; }
  .category-block { border-radius: 0; border-left: none; border-right: none; padding: 12px; }
}
</style>