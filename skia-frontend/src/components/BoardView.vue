<template>
  <div class="menu-style-container">
    <div class="board-wrapper">
      <div class="home-container">
        <table class="board-table">
          <thead>
            <tr>
              <th class="col-title">게시글 - 일정기간이 지난글은 삭제합니다.</th>
            </tr>
          </thead>
          
          <tbody v-if="posts.length === 0">
            <tr>
              <td class="empty-board">등록된 게시글이 없습니다.</td>
            </tr>
          </tbody>

          <tbody v-for="post in posts" :key="post.id">
            <tr class="post-row" @click="togglePostDetail(post.id)">
              <td class="td-title">
                <div class="title-container">
                  <div class="title-text-wrapper">
                    <span class="title-text" v-html="truncateTitle(post.content)"></span>
                    <span v-if="post.image" class="img-icon">🖼️</span>
                    <span v-if="post.replies && post.replies.length > 0" class="reply-count">
                      [{{ post.replies.length }}]
                    </span>
                    
                    <div class="inline-info-group">
                      <span class="inline-author">{{ post.author || '익명' }}</span>
                      <span class="inline-divider">|</span>
                      <span class="inline-date">{{ formatDateOnly(post.date) }}</span>
                    </div>
                  </div>
                  
                  <div class="action-box-group">
                    <button class="btn-action-edit" @click.stop="openEditForm(post)">수정</button>
                    <button class="btn-action-delete" @click.stop="deletePost(post.id)">✕</button>
                  </div>
                </div>
              </td>
            </tr>

            <!-- 게시글 상세 / 댓글 영역 -->
            <tr v-if="openedPostId === post.id" class="detail-row">
              <td>
                <div class="detail-content-box">
                  <div class="full-content-display" v-html="post.content"></div>

                  <div v-if="post.image" class="attached-image-container">
                    <img :src="post.image" alt="첨부 이미지" />
                  </div>
                  
                  <!-- 답변 목록 -->
                  <div class="replies-section">
                    <div class="reply-box-item" v-for="(reply, rIdx) in post.replies" :key="rIdx">
                      <div class="reply-item-header">
                        <div class="reply-header-left">
                          <span class="reply-author">↳ {{ reply.author }}:</span>
                          <span class="reply-date">{{ reply.date }}</span>
                        </div>
                        <div class="action-box-group">
                          <button class="btn-action-edit" @click.stop="openEditReplyForm(post.id, reply, rIdx)">수정</button>
                          <button class="btn-action-delete" @click.stop="deleteReply(post.id, reply.id || rIdx)">✕</button>
                        </div>
                      </div>
                      <div class="reply-item-body">
                        <div class="reply-content-text" v-html="reply.content"></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 답변 작성/수정 폼 -->
                  <div class="reply-form">
                    <div class="reply-form-top">
                      <input v-model="replyInputs[post.id].author" type="text" placeholder="답변자" class="reply-input-author" />
                    </div>
                    
                    <div class="editor-container">
                      <div class="editor-toolbar">
                        <button type="button" @mousedown.prevent @click="execFormat('bold', 'reply_' + post.id)" title="굵게"><b>B</b></button>
                        <button type="button" @mousedown.prevent @click="execFormat('italic', 'reply_' + post.id)" title="기울임"><i>I</i></button>
                        <button type="button" @mousedown.prevent @click="execFormat('underline', 'reply_' + post.id)" title="밑줄"><u>U</u></button>
                        <span class="toolbar-divider"></span>
                        
                        <div class="color-picker-wrapper">
                          <button type="button" class="btn-color-toggle" @mousedown.prevent @click="toggleColorPicker('reply_' + post.id)">
                            <span class="color-preview-icon" :style="{ backgroundColor: activeColor }">A</span>
                          </button>
                          <div v-if="showColorPicker === 'reply_' + post.id" class="color-palette-popup">
                            <div 
                              v-for="color in colorPalette" 
                              :key="color" 
                              class="color-circle" 
                              :style="{ backgroundColor: color }"
                              @mousedown.prevent
                              @click="applyColor(color, 'reply_' + post.id)"
                            ></div>
                          </div>
                        </div>

                        <span class="toolbar-divider"></span>
                        <button type="button" @mousedown.prevent @click="execFormat('justifyLeft', 'reply_' + post.id)">⬅️</button>
                        <button type="button" @mousedown.prevent @click="execFormat('justifyCenter', 'reply_' + post.id)">↔️</button>
                        <button type="button" @mousedown.prevent @click="execFormat('justifyRight', 'reply_' + post.id)">➡️</button>
                        <span class="toolbar-divider"></span>
                        <button type="button" @mousedown.prevent @click="addLink('reply_' + post.id)">🔗</button>
                      </div>

                      <div 
                        class="editor-content reply-editor" 
                        contenteditable="true" 
                        :ref="'replyEditorBox_' + post.id"
                        @input="onReplyEditorInput(post.id)"
                        placeholder="답변 내용을 입력하세요..."
                      ></div>
                    </div>
                    
                    <div class="reply-form-actions">
                      <button v-if="replyInputs[post.id].isEditMode" @click="cancelReplyEdit(post.id)" class="btn-reply-cancel">취소</button>
                      <button @click="handleReplySubmit(post.id)" class="btn-reply-submit">
                        {{ replyInputs[post.id].isEditMode ? '수정' : '답변' }}
                      </button>
                    </div>
                  </div>

                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 하단 페이징 & 글쓰기 버튼 -->
      <div class="board-footer">
        <div class="pagination">
          <button class="page-btn active">1</button>
          <button class="page-btn">2</button>
          <button class="page-btn">3</button>
        </div>
        
        <button class="btn-write-toggle" @click="toggleWriteMode">
          📝 글쓰기
        </button>
      </div>

      <!-- 🎯 [새 게시글 등록/수정 폼] -->
      <div v-if="showForm" class="write-form-container" ref="formContainer">
        <h3>{{ isEditMode ? '📝 게시글 수정하기' : '📝 새 게시글 등록하기' }}</h3>
        <form @submit.prevent="handleFormSubmit">
          <div class="form-group">
            <label>작성자</label>
            <input v-model="formData.author" type="text" placeholder="닉네임 입력" required />
          </div>

          <div class="form-group">
            <label>내용</label>
            <div class="editor-container">
              <div class="editor-toolbar">
                <button type="button" @mousedown.prevent @click="execFormat('bold', 'mainForm')" title="굵게"><b>B</b></button>
                <button type="button" @mousedown.prevent @click="execFormat('italic', 'mainForm')" title="기울임"><i>I</i></button>
                <button type="button" @mousedown.prevent @click="execFormat('underline', 'mainForm')" title="밑줄"><u>U</u></button>
                <span class="toolbar-divider"></span>

                <div class="color-picker-wrapper">
                  <button type="button" class="btn-color-toggle" @mousedown.prevent @click="toggleColorPicker('mainForm')">
                    <span class="color-preview-icon" :style="{ backgroundColor: activeColor }">A</span>
                  </button>
                  <div v-if="showColorPicker === 'mainForm'" class="color-palette-popup">
                    <div 
                      v-for="color in colorPalette" 
                      :key="color" 
                      class="color-circle" 
                      :style="{ backgroundColor: color }"
                      @mousedown.prevent
                      @click="applyColor(color, 'mainForm')"
                    ></div>
                  </div>
                </div>

                <span class="toolbar-divider"></span>
                <button type="button" @mousedown.prevent @click="execFormat('justifyLeft', 'mainForm')">⬅️</button>
                <button type="button" @mousedown.prevent @click="execFormat('justifyCenter', 'mainForm')">↔️</button>
                <button type="button" @mousedown.prevent @click="execFormat('justifyRight', 'mainForm')">➡️</button>
                <span class="toolbar-divider"></span>
                <button type="button" @mousedown.prevent @click="addLink('mainForm')">🔗</button>
                <button type="button" @mousedown.prevent @click="insertImageInline('mainForm')">🖼️</button>
              </div>

              <div 
                class="editor-content post-editor" 
                contenteditable="true" 
                ref="mainEditorBox"
                @input="onMainEditorInput"
                placeholder="질문이나 공유할 내용을 입력하세요."
              ></div>
            </div>
          </div>
          
          <div v-if="!isEditMode" class="form-group">
            <label>이미지 첨부</label>
            <div class="file-upload-wrapper">
              <input type="file" accept="image/*" @change="handleImageUpload" ref="fileInput" />
              <div v-if="imagePreview" class="preview-box">
                <img :src="imagePreview" alt="미리보기" />
                <button type="button" @click="removeSelectedImage" class="btn-remove-preview">✕ 제거</button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeForm">취소</button>
            <button type="submit" class="btn-save">
              {{ isEditMode ? '수정 완료' : '게시글 올리기' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

export default {
  name: 'BoardView',
  data() {
    return {
      showForm: false,
      isEditMode: false,
      editingPostId: null,
      formData: { author: '', content: '', image: null },
      imagePreview: null,
      posts: [],
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
  mounted() {
    this.fetchPosts();
  },
  methods: {
    /* 🎯 타겟 에디터 요소 구하기 */
    getEditorElement(targetKey) {
      if (targetKey === 'mainForm') {
        return this.$refs.mainEditorBox;
      } else if (targetKey && targetKey.startsWith('reply_')) {
        const postId = targetKey.replace('reply_', '');
        const ref = this.$refs['replyEditorBox_' + postId];
        return Array.isArray(ref) ? ref[0] : ref;
      }
      return null;
    },

    /* 🎯 포커스 보장형 서식 적용 */
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

    /* 🎯 [핵심 해결] 색상 적용 함수 */
    applyColor(color, targetKey) {
      this.activeColor = color;
      const editor = this.getEditorElement(targetKey);

      if (editor) {
        editor.focus();

        const selection = window.getSelection();
        // 선택된 영역이 없는 경우 (커서만 깜빡일 때) -> span 생성하여 포커스
        if (!selection.rangeCount || selection.isCollapsed) {
          document.execCommand('foreColor', false, color);
        } else {
          // 드래그 영역이 있을 때
          document.execCommand('foreColor', false, color);
        }

        this.syncEditorContent(targetKey);
      }

      this.showColorPicker = null;
    },

    /* 🎯 데이터 수동 동기화 */
    syncEditorContent(targetKey) {
      if (targetKey === 'mainForm') {
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

    insertImageInline(targetKey) {
      const url = prompt('이미지 URL을 입력하세요:');
      if (url) this.execFormat('insertImage', targetKey, url);
    },

    /* 입력 감지 연동 */
    onMainEditorInput() {
      if (this.$refs.mainEditorBox) {
        this.formData.content = this.$refs.mainEditorBox.innerHTML;
      }
    },
    onReplyEditorInput(postId) {
      const targetRef = this.$refs['replyEditorBox_' + postId];
      const target = Array.isArray(targetRef) ? targetRef[0] : targetRef;
      if (target && this.replyInputs[postId]) {
        this.replyInputs[postId].content = target.innerHTML;
      }
    },

    truncateTitle(value) {
      if (!value) return '내용 없음';
      const text = String(value).replace(/<[^>]*>?/gm, '');
      return text.length > 35 ? text.substring(0, 35) + '...' : text || '내용 없음';
    },
    formatDateOnly(value) {
      if (!value || value === 0) return '-';
      return String(value).split(' ')[0].replace(/-/g, '.');
    },
    togglePostDetail(postId) {
      this.openedPostId = this.openedPostId === postId ? null : postId;
      this.showColorPicker = null;
    },
    async fetchPosts() {
      try {
        const response = await axios.get(`${BASE_URL}/api/posts`);
        this.posts = Array.isArray(response.data) ? response.data : [];
        this.posts.forEach(post => {
          if (!this.replyInputs[post.id]) {
            this.replyInputs[post.id] = { author: '', content: '', isEditMode: false, editingReplyId: null, editingIndex: null };
          }
        });
      } catch (err) {
        console.error('게시판 로드 실패:', err);
        this.posts = [];
      }
    },
    toggleWriteMode() {
      this.isEditMode = false;
      this.editingPostId = null;
      this.formData = { author: '', content: '', image: null };
      this.imagePreview = null;
      this.showForm = !this.showForm;
      this.showColorPicker = null;

      if (this.showForm) {
        this.$nextTick(() => {
          if (this.$refs.mainEditorBox) this.$refs.mainEditorBox.innerHTML = '';
        });
      }
    },
    openEditForm(post) {
      this.isEditMode = true;
      this.editingPostId = post.id;
      this.formData = { author: post.author, content: post.content, image: post.image };
      this.showForm = true;
      this.showColorPicker = null;
      
      this.$nextTick(() => {
        if (this.$refs.mainEditorBox) this.$refs.mainEditorBox.innerHTML = post.content || '';
        if (this.$refs.formContainer) this.$refs.formContainer.scrollIntoView({ behavior: 'smooth' });
      });
    },
    closeForm() {
      this.showForm = false;
      this.isEditMode = false;
      this.editingPostId = null;
      this.formData = { author: '', content: '', image: null };
      this.imagePreview = null;
      this.showColorPicker = null;
    },
    async handleFormSubmit() {
      if (!this.formData.author || !this.formData.content) return;
      if (this.isEditMode) {
        await this.submitEditPost();
      } else {
        await this.createPost();
      }
    },
    async createPost() {
      try {
        const response = await axios.post(`${BASE_URL}/api/posts`, {
          author: this.formData.author,
          content: this.formData.content,
          image: this.formData.image
        });
        this.posts.unshift(response.data);
        this.replyInputs[response.data.id] = { author: '', content: '', isEditMode: false, editingReplyId: null, editingIndex: null };
        this.closeForm();
        alert('새 게시글이 등록되었습니다.');
      } catch (err) {
        console.error('게시글 등록 실패:', err);
      }
    },
    async submitEditPost() {
      try {
        await axios.patch(`${BASE_URL}/api/posts/${this.editingPostId}`, {
          author: this.formData.author.trim(),
          content: this.formData.content.trim()
        });
        const targetPost = this.posts.find(p => p.id === this.editingPostId);
        if (targetPost) {
          targetPost.author = this.formData.author.trim();
          targetPost.content = this.formData.content.trim();
        }
        this.closeForm();
        alert('글이 수정되었습니다.');
      } catch (err) {
        console.error('게시글 수정 실패:', err);
      }
    },
    async deletePost(postId) {
      if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
      try {
        await axios.delete(`${BASE_URL}/api/posts/${postId}`);
        this.posts = this.posts.filter(p => (p.id || p._id) !== postId);
        if (this.openedPostId === postId) this.openedPostId = null;
        if (this.editingPostId === postId) this.closeForm();
        alert('게시글이 삭제되었습니다.');
      } catch (err) {
        console.error('게시글 삭제 실패:', err);
      }
    },
    handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target.result;
        this.formData.image = e.target.result; 
      };
      reader.readAsDataURL(file);
    },
    removeSelectedImage() {
      this.imagePreview = null;
      this.formData.image = null;
      if (this.$refs.fileInput) { this.$refs.fileInput.value = ''; }
    },
    async handleReplySubmit(postId) {
      const input = this.replyInputs[postId];
      if (!input || !input.author || !input.content) return;

      if (input.isEditMode) {
        await this.submitEditReply(postId);
      } else {
        await this.createReply(postId);
      }
    },
    async createReply(postId) {
      const input = this.replyInputs[postId];
      try {
        const response = await axios.post(`${BASE_URL}/api/posts/${postId}/replies`, {
          author: input.author,
          content: input.content
        });

        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.replies.push(response.data);
          input.content = '';
          const targetRef = this.$refs['replyEditorBox_' + postId];
          const target = Array.isArray(targetRef) ? targetRef[0] : targetRef;
          if (target) target.innerHTML = '';
        }
      } catch (err) {
        console.error('답변 등록 실패:', err);
      }
    },
    openEditReplyForm(postId, reply, index) {
      const input = this.replyInputs[postId];
      input.isEditMode = true;
      input.author = reply.author;
      input.content = reply.content;
      input.editingReplyId = reply.id || index;
      input.editingIndex = index;

      this.$nextTick(() => {
        const targetRef = this.$refs['replyEditorBox_' + postId];
        const target = Array.isArray(targetRef) ? targetRef[0] : targetRef;
        if (target) {
          target.innerHTML = reply.content || '';
        }
      });
    },
    async submitEditReply(postId) {
      const input = this.replyInputs[postId];
      try {
        await axios.put(`${BASE_URL}/api/posts/${postId}/replies/${input.editingReplyId}`, {
          content: input.content.trim(),
          author: input.author.trim()
        });
        
        const post = this.posts.find(p => p.id === postId);
        if (post && post.replies[input.editingIndex]) {
          post.replies[input.editingIndex].author = input.author.trim();
          post.replies[input.editingIndex].content = input.content.trim();
        }
        
        this.cancelReplyEdit(postId);
        alert('답변이 수정되었습니다.');
      } catch (err) {
        console.error('답변 수정 실패:', err);
      }
    },
    cancelReplyEdit(postId) {
      const input = this.replyInputs[postId];
      input.isEditMode = false;
      input.author = '';
      input.content = '';
      input.editingReplyId = null;
      input.editingIndex = null;

      const targetRef = this.$refs['replyEditorBox_' + postId];
      const target = Array.isArray(targetRef) ? targetRef[0] : targetRef;
      if (target) target.innerHTML = '';
    },
    async deleteReply(postId, replyId) {
      if (!confirm('정말 이 답변을 삭제하시겠습니까?')) return;
      try {
        await axios.delete(`${BASE_URL}/api/posts/${postId}/replies/${replyId}`);
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.replies = post.replies.filter((r, idx) => r.id !== replyId && idx !== replyId);
        }
        this.cancelReplyEdit(postId);
        alert('답변이 삭제되었습니다.');
      } catch (err) {
        console.error('답변 삭제 실패:', err);
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
  padding: 0px;
  box-sizing: border-box;
}
.board-container {
  background: white;
  border-radius: 4px;
  border-top: 2px solid #1a1a1a;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.board-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.board-table th {
  background-color: #fafdff;
  border-bottom: 1px solid #eee;
  padding: 12px 10px;
  font-size: 12px !important;
  font-weight: bold;
  color: #333;
}
.board-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #f2f2f2;
  font-size: 11px !important;
  color: #444;
}

.col-title { width: 100%; text-align: left; padding-left: 15px; }

.post-row {
  cursor: pointer;
  transition: background-color 0.15s;
}
.post-row:hover {
  background-color: #f9f9f9;
}

.title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 15px;
}

.title-text-wrapper {
  display: flex;
  align-items: center;
  flex-wrap: wrap;       
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.title-text {
  color: #222;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;       
}
.reply-count {
  font-weight: bold;
  color: #ff3f3f;
  font-size: 10px !important;
  flex-shrink: 0;
}
.img-icon {
  font-size: 10px;
  flex-shrink: 0;
}

.inline-info-group {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 12px;     
  flex-shrink: 0;
}

.inline-author {
  color: #555;
  font-size: 11px;
  font-weight: bold;
  white-space: nowrap;
}

.inline-divider {
  color: #ddd;
  font-size: 10px;
  user-select: none;
}

.inline-date {
  color: #999;
  font-size: 11px;
  white-space: nowrap;
}

.empty-board {
  text-align: center;
  color: #999;
  padding: 50px 0 !important;
}

.detail-row {
  background-color: #fcfcfc;
}
.detail-content-box {
  padding: 10px 20px;
}
.full-content-display {
  font-size: 12px;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
  margin-bottom: 12px;
}
.attached-image-container {
  max-width: 400px;
  border: 1px solid #eee;
  margin-top: 5px;
  margin-bottom: 15px;
  border-radius: 4px;
  overflow: hidden;
}
.attached-image-container img {
  width: 100%;
  height: auto;
  display: block;
}

.replies-section {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.reply-box-item {
  background: #f5f6f7;
  border: 1px solid #eef0f2;
  border-radius: 4px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.reply-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.reply-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.reply-author { 
  font-weight: bold; 
  color: #333; 
  font-size: 11px !important; 
}
.reply-date { 
  color: #aaa; 
  font-size: 10px !important; 
}
.reply-item-body {
  width: 100%;
}
.reply-content-text { 
  color: #222; 
  font-size: 11px !important; 
  line-height: 1.5;
  word-break: break-all; 
  margin: 0;
}

.action-box-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.btn-action-edit {
  background: none;
  border: none;
  color: #666;
  font-size: 10px !important;
  cursor: pointer;
  padding: 2px 5px;
  transition: color 0.2s;
}
.btn-action-edit:hover {
  color: #2e7d32;
  text-decoration: underline;
}

.btn-action-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #ddd;
  color: #999;
  cursor: pointer;
  font-size: 9px;
  width: 15px;
  height: 15px;
  padding: 0;
  border-radius: 3px;
  transition: all 0.2s ease;
}
.btn-action-delete:hover {
  color: #ff3f3f;
  border-color: #ff3f3f;
  background-color: #fee2e2;
}

/* 🎯 [에디터 툴바 스타일] */
.editor-container {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  overflow: visible;
}
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 6px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  border-radius: 4px 4px 0 0;
}
.editor-toolbar button {
  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 3px;
  padding: 2px 5px;
  font-size: 11px !important;
  cursor: pointer;
  height: 24px;
  line-height: 1;
}
.editor-toolbar button:hover {
  background: #e9ecef;
}

.color-picker-wrapper { position: relative; }
.btn-color-toggle { padding: 2px 4px !important; }
.color-preview-icon {
  display: inline-block;
  width: 12px;
  height: 12px;
  line-height: 12px;
  border-radius: 2px;
  color: white;
  font-size: 9px;
  font-weight: bold;
  text-align: center;
}
.color-palette-popup {
  position: absolute;
  top: 28px;
  left: 0;
  z-index: 100;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  width: 130px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.color-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.1);
}

.toolbar-divider {
  width: 1px;
  height: 12px;
  background: #dee2e6;
  margin: 0 2px;
}

.editor-content {
  padding: 8px;
  font-size: 11px !important;
  outline: none;
  line-height: 1.5;
  color: #333;
  box-sizing: border-box;
}
.post-editor { min-height: 120px; }
.reply-editor { min-height: 70px; }
.editor-content[placeholder]:empty:before {
  content: attr(placeholder);
  color: #aaa;
}

.reply-form { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  margin-top: 15px; 
  background: #fff;
  padding: 12px;
  border: 1px solid #e1e4e6;
  border-radius: 6px;
  box-sizing: border-box;
}
.reply-form-top {
  display: flex;
  width: 100%;
}
.reply-input-author { 
  width: 50%; 
  max-width: 180px;
  padding: 6px 8px; 
  border: 1px solid #ddd; 
  border-radius: 4px; 
  font-size: 11px !important; 
  box-sizing: border-box;
}

.reply-form-actions {
  display: flex;
  justify-content: flex-end; 
  gap: 6px;
}
.btn-reply-submit { 
  background: #444; 
  color: white; 
  border: none; 
  padding: 5px 12px; 
  border-radius: 4px; 
  font-weight: bold; 
  cursor: pointer; 
  font-size: 11px !important; 
}
.btn-reply-submit:hover { background: #222; }
.btn-reply-cancel { 
  background: #eee; 
  color: #333; 
  border: 1px solid #ccc; 
  padding: 5px 12px; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 11px !important; 
}
.btn-reply-cancel:hover { background: #ddd; }

.board-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding: 0 5px;
}
.pagination {
  display: flex;
  gap: 4px;
}
.page-btn {
  border: 1px solid #ddd;
  background: white;
  padding: 5px 9px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  color: #333;
  transition: all 0.2s;
}
.page-btn.active {
  background: #1a1a1a;
  color: white;
  border-color: #1a1a1a;
  font-weight: bold;
}
.page-btn:hover:not(.active) {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.btn-write-toggle {
  background-color: #ffffff;
  color: #1a1a1a;
  border: 1px solid #1a1a1a;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-write-toggle:hover {
  background-color: #1a1a1a;
  color: #ffffff;
}

.write-form-container .form-group {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  margin-bottom: 14px !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.write-form-container .form-group label {
  font-weight: bold;
  font-size: 12px !important;
  margin-bottom: 6px !important;
  color: #333;
  width: auto !important; /* 기존 고정 너비(80px 등) 해제 */
}

.write-form-container .form-group input[type="text"],
.write-form-container .editor-container,
.write-form-container .file-upload-wrapper {
  width: 100% !important;
  box-sizing: border-box !important;
}
.form-group { display: flex; margin-bottom: 12px; align-items: center; box-sizing: border-box; }
.align-stretch { align-items: flex-start !important; }
.form-group label { font-weight: bold; font-size: 12px !important; width: 80px; flex-shrink: 0; }
.form-group input { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px !important; outline: none; box-sizing: border-box; font-family: inherit; }

.file-upload-wrapper { flex: 1; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box; }
.preview-box { position: relative; width: 80px; height: 80px; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px; overflow: hidden; }
.preview-box img { width: 100%; height: 100%; object-fit: cover; }
.btn-remove-preview { position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(220,38,38,0.85); color: white; border: none; font-size: 8px !important; padding: 1px 0; cursor: pointer; }

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