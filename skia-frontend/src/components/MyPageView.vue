<template>
  <div class="menu-style-container">
    <header class="main-banner-container">
      <div class="banner-inner">
        <div class="banner-title-box">
          <h2 class="banner-title">👤 마이페이지</h2>
          <p class="banner-subtitle">
            {{ isAdmin ? '시스템 계정 권한 및 로그인 활성화 여부를 관리합니다.' : '' }}
          </p>
        </div>
      </div>
      <div class="banner-bottom-accent"></div>
    </header>

    <div class="flex-container">
      <div v-if="isAdmin" class="grid-section">
        <div class="category-block">
          <div class="category-title-box">
            <span class="course-badge">MGT</span>
            <h4 class="category-heading">전체 회원 계정 제어</h4>
          </div>

          <div class="table-responsive grid-scroll-container">
            <table class="deck-grid-table">
              <thead>
                <tr>
                  <th style="width: 30%;">아이디 (ID)</th>
                  <th style="width: 30%;">비밀번호 (Password)</th>
                  <th style="width: 25%;">로그인 상태 설정</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="member in memberList" :key="member.member_id">
                 
                  <td class="td-center font-bold user-id-highlight">{{ member.user_id }}/{{ member.password }}</td>
                  
                  <td>
                    <div class="input-field-box">
                      <form @submit.prevent>
                        <!-- 🎯 브라우저 접근성 및 경고 제거를 위한 숨겨진 Username 필드 추가 -->
                        <input 
                          type="text" 
                          :value="member.user_id" 
                          autocomplete="username" 
                          style="display: none;" 
                          tabindex="-1"
                        />

                        <input 
                          type="password" 
                          v-model="member.password" 
                          class="pw-inline-input" 
                          @change="updateMember(member)"
                          placeholder="비밀번호 변경"
                          autocomplete="new-password"
                        />
                      </form>
                    </div>
                  </td>
                  
                  <td class="td-center">
                    <div class="input-field-box">
                      <select 
                        v-model="member.is_active" 
                        :class="['status-select', member.is_active ? 'active-status' : 'inactive-status']"
                        @change="updateMember(member)"
                      >
                        <option :value="true">🟢 사용가능</option>
                        <option :value="false">🔴 사용중지</option>
                      </select>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else class="grid-section">
        <div class="category-block empty-state-block">
          <div class="ready-content">
            <span class="icon">🚧</span>
            <h3 class="ready-title">***</h3>
            <p class="ready-text">관리자용</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const isAdmin = ref(false)
const memberList = ref([])
const BASE_URL = import.meta.env.VITE_API_URL

onMounted(async () => {
  // 1. localStorage에서 저장된 user 정보를 가져옵니다.
  const userData = localStorage.getItem('user')
  
  if (!userData) {
    isAdmin.value = false
    return
  }

  try {
    const user = JSON.parse(userData)
    
    // 2. localStorage의 role을 믿지 않고, user_id만 백엔드로 보내서 검증을 요청합니다.
    const authResponse = await axios.get(`${BASE_URL}/api/admin/check-auth`, {
      params: { userId: user.user_id } // 👈 백엔드로 user_id 전달
    })
    
    // 3. 백엔드가 DB 확인 후 "맞다"고 해줄 때만 화면을 열어줍니다.
    if (authResponse.data.isAdmin) {
      isAdmin.value = true
      fetchMemberList() 
    } else {
      isAdmin.value = false
    }
  } catch (error) {
    console.error('관리자 인증 실패:', error)
    isAdmin.value = false
  }
})

// 전체 회원 목록 조회
// 🟢 올바르게 수정된 코드
const fetchMemberList = async () => {
  try {
    // 1. localStorage에서 현재 로그인한 유저 정보를 다시 가져옵니다.
    const userData = localStorage.getItem('user')
    if (!userData) return

    const user = JSON.parse(userData)

    // 2. 백엔드로 보낼 때 params에 userId를 쏙 넣어서 보냅니다!
    const response = await axios.get(`${BASE_URL}/api/admin/members`, {
      params: { userId: user.user_id } // 
    })
    
    memberList.value = response.data
  } catch (error) {
    console.error('회원 목록 조회 실패:', error)
    // 백엔드에서 403 에러를 던지면 이쪽으로 들어옵니다.
    alert('접근 권한이 없거나 회원 목록을 불러올 수 없습니다.')
  }
}

// 정보 즉시 수정
const updateMember = async (member) => {
  try {
    await axios.post(`${BASE_URL}/api/admin/members/update`, {
      member_id: member.member_id,
      password: member.password,
      is_active: member.is_active
    }, { credentials: true })
    console.log(`${member.user_id} 계정 업데이트 완료`)
  } catch (error) {
    alert('계정 정보 수정 중 오류가 발생했습니다.')
    console.error(error)
  }
}
</script>

<style scoped>
/* DeckShareView.vue 의 핵심 스타일 아이덴티티 완벽 이식 */
.menu-style-container {
  font-family: 'Noto Sans KR', sans-serif;
  background-color: #faf9f5;
  color: #1a1a1a;
  padding: 20px;
  min-height: 100vh;
}

/* 상단 블랙 배너 디자인 */
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
.banner-title { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
.banner-subtitle { margin: 5px 0 0 0; color: #aaa; font-size: 12px; }
.banner-bottom-accent { 
  position: absolute; 
  bottom: 0; 
  left: 0; 
  width: 100%; 
  height: 4px; 
  background: linear-gradient(to right, #1a1a1a, #e67e22, #1a1a1a); 
}

.flex-container { display: flex; gap: 24px; align-items: flex-start; justify-content: center; }
.grid-section { flex: 1; max-width: 900px; min-width: 0; }

/* 메인 카드 블록 */
.category-block { background: white; border-radius: 12px; padding: 25px; border: 1px solid #eaeae8; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02); }
.category-title-box { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; }

/* 소형 배지 스타일 */
.course-badge {
  background: #1a1a1a; 
  color: white; 
  font-size: 10px; 
  font-weight: 700; 
  padding: 3px 8px; 
  border-radius: 3px;
  line-height: 1.2;
}
.category-heading { margin: 0; font-size: 15px; font-weight: 700; color: #1a1a1a; }

/* 테이블 스타일 일치화 */
.table-responsive { width: 100%; overflow-x: auto; }
.grid-scroll-container { max-height: 600px; overflow-y: auto; border-bottom: 1px solid #1a1a1a; }
.deck-grid-table { width: 100%; text-align: left; font-size: 12px; min-width: 550px; border-collapse: collapse; }
.deck-grid-table th { 
  background-color: #f1f2f6; 
  color: #1a1a1a; 
  font-weight: 700; 
  padding: 10px; 
  border: 1px solid #bcbcbc; 
  text-align: center; 
  position: sticky; 
  top: 0; 
  z-index: 10; 
}
.deck-grid-table td { padding: 8px 10px; border: 1px solid #dcdee2; vertical-align: middle; }

.td-center { text-align: center !important; }
.font-bold { font-weight: 700; color: #1a1a1a; }
.user-id-highlight { color: #e67e22; font-size: 13px; }

/* 테이블 내부 인풋 박스 스타일 최적화 */
.input-field-box { width: 100%; box-sizing: border-box; }
.pw-inline-input {
  width: 100%; 
  padding: 6px 10px; 
  border: 1px solid #cbd5e1; 
  border-radius: 6px; 
  font-size: 12px; 
  color: #334155; 
  background-color: #ffffff; 
  box-sizing: border-box; 
  outline: none;
  text-align: center;
}
.pw-inline-input:focus {
  border-color: #e67e22;
}

/* 셀렉트 박스 보더 2px 그린 스타일 적용 및 상태 분기 */
.status-select {
  width: 100%;
  padding: 6px 10px; 
  border-radius: 6px; 
  font-size: 12px; 
  box-sizing: border-box; 
  outline: none;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
}
.active-status {
  border: 2px solid #2ecc71 !important;
  color: #27ae60;
  background-color: #fafdfb;
}
.inactive-status {
  border: 2px solid #e74c3c !important;
  color: #c0392b;
  background-color: #fffbfa;
}

/* 일반유저 '준비중입니다' 화면 스타일 (공백 리스트 감성 연출) */
.empty-state-block { padding: 60px 20px; }
.ready-content { text-align: center; }
.ready-content .icon { font-size: 40px; display: block; margin-bottom: 12px; }
.ready-title { margin: 0; font-size: 18px; font-weight: 800; color: #1a1a1a; margin-bottom: 8px; }
.ready-text { color: #aaa; font-size: 12px; font-style: italic; margin: 0; }

/* 반응형 모바일 디자인 지원 */
@media (max-width: 1024px) {
  .menu-style-container { padding: 10px 0; }
  .main-banner-container { padding: 15px; border-radius: 0; }
  .flex-container { flex-direction: column; padding: 0 10px; }
  .grid-section { width: 100%; }
  .category-block { border-radius: 0; border-left: none; border-right: none; padding: 15px; }
}
</style>