<template>
  <div class="menu-style-container">
    <!-- 🎯 [최상단 고정] 1번 게시글 상시 노출 & 바로 수정 영역 -->
    <div v-if="noticePost" class="fixed-notice-card">
      <div class="notice-header">
        <div class="notice-title-group">
          <h3 class="notice-main-title">📌 세븐나이츠 키우기 모음</h3>
        </div>
        <button class="btn-action-edit notice-edit-btn" @click="toggleNoticeEdit">
          {{ isEditingNotice ? '👁️ 보기 모드' : '✏️ 1번 글 수정' }}
        </button>
      </div>

      <!-- 1번 글 보기 모드 -->
      <div v-if="!isEditingNotice" class="notice-body">
        <div class="full-content-display" v-html="formatNoticeContent(noticePost.content)"></div>
        <div v-if="noticePost.image" class="attached-image-container">
          <img :src="noticePost.image" alt="첨부 이미지" />
        </div>
      </div>

      <!-- 1번 글 수정 모드 -->
      <div v-else class="notice-edit-form">
        <div class="editor-container">
          <div class="editor-toolbar">
            <!-- @mousedown.prevent 로 포커스 이탈 방지 -->
            <button type="button" @mousedown.prevent @click="execFormat('bold', 'notice')" title="굵게"><b>B</b></button>
            <button type="button" @mousedown.prevent @click="execFormat('italic', 'notice')" title="기울임"><i>I</i></button>
            <button type="button" @mousedown.prevent @click="execFormat('underline', 'notice')" title="밑줄"><u>U</u></button>
            <span class="toolbar-divider"></span>

            <div class="color-picker-wrapper">
              <button type="button" class="btn-color-toggle" @mousedown.prevent @click="toggleColorPicker('notice')">
                <span class="color-preview-icon" :style="{ backgroundColor: activeColor }">A</span>
              </button>
              <div v-if="showColorPicker === 'notice'" class="color-palette-popup">
                <div 
                  v-for="color in colorPalette" 
                  :key="color" 
                  class="color-circle" 
                  :style="{ backgroundColor: color }"
                  @mousedown.prevent
                  @click="applyColor(color, 'notice')"
                ></div>
              </div>
            </div>

            <span class="toolbar-divider"></span>
            <button type="button" @mousedown.prevent @click="execFormat('justifyLeft', 'notice')">⬅️</button>
            <button type="button" @mousedown.prevent @click="execFormat('justifyCenter', 'notice')">↔️</button>
            <button type="button" @mousedown.prevent @click="execFormat('justifyRight', 'notice')">➡️</button>
            <span class="toolbar-divider"></span>
            <button type="button" @mousedown.prevent @click="addLink('notice')">🔗</button>
          </div>

          <div 
            class="editor-content post-editor" 
            contenteditable="true" 
            ref="noticeEditorBox"
            @input="onNoticeEditorInput"
            placeholder="1번 게시글 내용을 입력하세요..."
          ></div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="toggleNoticeEdit">취소</button>
          <button type="button" class="btn-save" @click="saveNoticePost">💾 1번 글 저장하기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
const NOTICE_POST_ID = 1; // 🎯 상시 고정할 1번 게시글 ID

export default {
  name: 'NoticeBoardView',
  data() {
    return {
      posts: [],
      noticePost: null, // 1번 게시글
      isEditingNotice: false,
      noticeEditContent: '',

      showForm: false,
      isEditMode: false,
      editingPostId: null,
      formData: { author: '', content: '', image: null },
      replyInputs: {},
      openedPostId: null,

      showColorPicker: null,
      activeColor: '#333333',
      colorPalette: [
        '#222222', '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#3182ce',
        '#805ad5', '#d63384', '#718096', '#a0aec0', '#4a5568', '#000000'
      ]
    };
  },
  computed: {
    regularPosts() {
      return this.posts.filter(p => p.id !== NOTICE_POST_ID);
    }
  },
  mounted() {
    this.fetchPosts();
  },
  methods: {
    /* 🎯 에디터 Element 검색 (notice 대상 포함) */
    getEditorElement(targetKey) {
      if (targetKey === 'notice') {
        return this.$refs.noticeEditorBox;
      } else if (targetKey === 'mainForm') {
        return this.$refs.mainEditorBox;
      } else if (targetKey && targetKey.startsWith('reply_')) {
        const postId = targetKey.replace('reply_', '');
        const ref = this.$refs['replyEditorBox_' + postId];
        return Array.isArray(ref) ? ref[0] : ref;
      }
      return null;
    },

    /* 🎯 서식 실행 (포커스 유지) */
    execFormat(command, targetKey, value = null) {
      const editor = this.getEditorElement(targetKey);
      if (editor) {
        editor.focus();
      }
      document.execCommand(command, false, value);
      this.syncEditorContent(targetKey);
    },

    toggleColorPicker(targetKey) {
      this.showColorPicker = this.showColorPicker === targetKey ? null : targetKey;
    },

    /* 🎯 색상 적용 로직 */
    applyColor(color, targetKey) {
      this.activeColor = color;
      const editor = this.getEditorElement(targetKey);

      if (editor) {
        editor.focus();
        document.execCommand('foreColor', false, color);
        this.syncEditorContent(targetKey);
      }

      this.showColorPicker = null;
    },

    /* 🎯 서식 적용 후 데이터 동기화 */
    syncEditorContent(targetKey) {
      if (targetKey === 'notice') {
        this.onNoticeEditorInput();
      } else if (targetKey === 'mainForm') {
        this.onMainEditorInput();
      } else if (targetKey && targetKey.startsWith('reply_')) {
        const postId = targetKey.replace('reply_', '');
        this.onReplyEditorInput(postId);
      }
    },

    addLink(targetKey) {
      const url = prompt('연결할 URL을 입력하세요:', 'https://');
      if (url) this.execFormat('createLink', targetKey, url);
    },

    async fetchPosts() {
      try {
        const response = await axios.get(`${BASE_URL}/api/posts`);
        if (Array.isArray(response.data)) {
          this.posts = response.data;
          this.noticePost = this.posts.find(p => p.id === NOTICE_POST_ID) || {
            id: NOTICE_POST_ID,
            author: '관리자',
            content: '종합 덱 모음\nhttps://naver.me/FnsLdkcc\n\n악몽,깊은밤의악몽,자사덱\nhttps://naver.me/5dh1doK7'
          };
        }
        
        this.posts.forEach(post => {
          if (!this.replyInputs[post.id]) {
            this.replyInputs[post.id] = { author: '', content: '', isEditMode: false, editingReplyId: null, editingIndex: null };
          }
        });
      } catch (err) {
        console.error('게시판 로드 실패:', err);
      }
    },

    /* 🎯 1번 글 수정 관련 로직 */
    toggleNoticeEdit() {
      this.isEditingNotice = !this.isEditingNotice;
      this.showColorPicker = null;
      if (this.isEditingNotice) {
        this.noticeEditContent = this.noticePost.content;
        this.$nextTick(() => {
          if (this.$refs.noticeEditorBox) {
            this.$refs.noticeEditorBox.innerHTML = this.noticePost.content || '';
          }
        });
      }
    },
    onNoticeEditorInput() {
      if (this.$refs.noticeEditorBox) {
        this.noticeEditContent = this.$refs.noticeEditorBox.innerHTML;
      }
    },
    async saveNoticePost() {
      try {
        await axios.patch(`${BASE_URL}/api/posts/${NOTICE_POST_ID}`, {
          content: this.noticeEditContent
        });
        this.noticePost.content = this.noticeEditContent;
        this.isEditingNotice = false;
        alert('1번 게시글이 성공적으로 저장되었습니다.');
      } catch (err) {
        console.error('1번 글 저장 실패:', err);
        alert('저장 중 오류가 발생했습니다.');
      }
    },
    formatNoticeContent(content) {
      if (!content) return '';
      // 이미 에디터에서 HTML 태그(a 태그, span 태그 등)로 저장되므로
      // 정규식 치환 없이 그대로 출력만 해주면 됩니다.
      return content;
    },
    truncateTitle(value) {
      if (!value) return '내용 없음';
      const text = String(value).replace(/<[^>]*>?/gm, '');
      return text.length > 35 ? text.substring(0, 35) + '...' : text;
    },
    formatDateOnly(value) {
      if (!value) return '-';
      return String(value).split(' ')[0].replace(/-/g, '.');
    },
    togglePostDetail(postId) {
      this.openedPostId = this.openedPostId === postId ? null : postId;
    },
    onMainEditorInput() {
      if (this.$refs.mainEditorBox) this.formData.content = this.$refs.mainEditorBox.innerHTML;
    },
    onReplyEditorInput(postId) {
      const targetRef = this.$refs['replyEditorBox_' + postId];
      const target = Array.isArray(targetRef) ? targetRef[0] : targetRef;
      if (target && this.replyInputs[postId]) this.replyInputs[postId].content = target.innerHTML;
    },
    toggleWriteMode() {
      this.showForm = !this.showForm;
      if (this.showForm) {
        this.$nextTick(() => { if (this.$refs.mainEditorBox) this.$refs.mainEditorBox.innerHTML = ''; });
      }
    },
    closeForm() {
      this.showForm = false;
      this.isEditMode = false;
    },
    async deletePost(postId) {
      if (!confirm('정말 삭제하시겠습니까?')) return;
      try {
        await axios.delete(`${BASE_URL}/api/posts/${postId}`);
        this.posts = this.posts.filter(p => p.id !== postId);
      } catch (err) {
        console.error('삭제 실패:', err);
      }
    }
  }
};
</script>

<style scoped>
.board-wrapper {
  font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", helvetica, sans-serif !important;
  max-width: 1000px;
  margin: 0 auto;
  padding: 10px;
  box-sizing: border-box;
}
.menu-style-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
  font-family: 'Noto Sans KR', sans-serif;
  color: #222;
}

/* 🎯 1번 게시글 고정 카드 스타일 */
.fixed-notice-card {
  background: #ffffff;
  border: 1px solid #d9deef;
  border-radius: 8px;
  padding: 18px 20px;
  margin-bottom: 20px;
  box-shadow: 0 3px 8px rgba(76, 110, 245, 0.08);
}
.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid #edf2ff;
  padding-bottom: 10px;
}
.notice-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.notice-main-title {
    color: rgb(26, 26, 26);
    font-family: "Noto Sans KR", sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.18px;
}
.notice-edit-btn {
  background: #edf2ff;
  border: 1px solid #bac8ff;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: bold;
  color: #364fc7;
  cursor: pointer;
}
.notice-edit-btn:hover {
  background: #dbe4ff;
}

:deep(.custom-link) {
  color: #2b6cb0;
  text-decoration: underline;
  font-weight: 600;
}

/* 에디터 스타일 */
.editor-container { flex: 1; border: 1px solid #ddd; border-radius: 4px; background: #fff; }
.editor-toolbar { display: flex; align-items: center; gap: 3px; padding: 4px 6px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
.editor-toolbar button { background: #fff; border: 1px solid #ced4da; border-radius: 3px; padding: 2px 5px; font-size: 11px !important; cursor: pointer; height: 24px; }
.toolbar-divider { width: 1px; height: 12px; background: #dee2e6; margin: 0 2px; }
.editor-content { padding: 8px; font-size: 11px !important; outline: none; line-height: 1.5; color: #333; }
.post-editor { min-height: 120px; }

/* 팔레트 팝업 스타일 */
.color-picker-wrapper { position: relative; display: inline-block; }
.btn-color-toggle { display: flex; align-items: center; justify-content: center; }
.color-preview-icon { width: 12px; height: 12px; color: #fff; font-size: 9px; font-weight: bold; line-height: 12px; border-radius: 2px; }
.color-palette-popup {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 6px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.color-circle { width: 16px; height: 16px; border-radius: 50%; cursor: pointer; border: 1px solid rgba(0,0,0,0.1); }
.color-circle:hover { transform: scale(1.15); }

.full-content-display { font-size: 12px; color: #333; line-height: 1.5; word-break: break-all; margin-bottom: 12px; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 15px; }
.btn-cancel { background: #eee; border: none; padding: 8px 16px; border-radius: 4px; font-size: 11px !important; cursor: pointer; }
.btn-save { background: #1a1a1a; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-size: 11px !important; font-weight: bold; cursor: pointer; }

/* 모바일 반응형 */
@media (max-width: 1024px) {
  .menu-style-container {
    padding: 12px 4px; /* 모바일에서 좌우 여백 축소 */
    text-align: left;
  }
}
</style>