<template>
  <div class="login-container">
    <div class="login-box">
      <h2>SKIA 로그인</h2>
      <p class="subtitle">서비스를 이용하려면 로그인이 필요합니다.</p>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="username">아이디</label>
          <input 
            type="text" 
            id="username" 
            v-model="loginForm.user_id" 
            placeholder="아이디를 입력하세요" 
            autocomplete="username"
            required
          />
        </div>

        <div class="input-group">
          <label for="password">비밀번호</label>
          <input 
            type="password" 
            id="password" 
            v-model="loginForm.password" 
            autocomplete="current-password"
            placeholder="비밀번호를 입력하세요" 
            required
          />
        </div>

        <button type="submit" :disabled="isLoading" class="login-btn">
          {{ isLoading ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'

const emit = defineEmits(['login-success'])

const loginForm = reactive({
  user_id: '',
  password: ''
})

const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const BASE_URL = import.meta.env.VITE_API_URL;
    const BACKEND_URL = `${BASE_URL}/api/login`;

    const response = await axios.post(BACKEND_URL, {
      user_id: loginForm.user_id,
      password: loginForm.password
    })

    if (response.status === 200 || response.data.success) {
      console.log('백엔드 응답 성공:', response.data)
      
      const loggedInUser = response.data.user || { user_id: loginForm.user_id };
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      localStorage.setItem('isLoggedIn', 'true');
      
      // 🎯 [추가] 현재 시간에서 정확히 1시간 뒤의 만료 타임스탬프를 생성하여 저장합니다.
      // (1시간 = 60분 * 60초 * 1000밀리초 = 3,600,000)
      const oneHour = 60 * 60 * 1000;
      const expireTime = Date.now() + oneHour;
      localStorage.setItem('loginExpireTime', expireTime.toString());

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }        

      // App.vue에 로그인 성공 신호 전달
      emit('login-success')
    }

  } catch (error) {
    console.error('로그인 통신 에러:', error)
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '아이디 또는 비밀번호가 올바르지 않습니다.'
    } else {
      errorMessage.value = '백엔드 서버(3000번 포트)가 연결되지 않았거나 통신에 실패했습니다.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fb;
  font-family: 'Malgun Gothic', sans-serif;
}
.login-box {
  background: #ffffff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(149, 157, 165, 0.2);
  width: 100%;
  max-width: 400px;
  text-align: center;
}
h2 { margin-bottom: 8px; color: #333333; font-size: 24px; }
.subtitle { color: #666666; font-size: 14px; margin-bottom: 32px; }
.input-group { text-align: left; margin-bottom: 20px; }
.input-group label { display: block; margin-bottom: 8px; font-size: 14px; color: #444444; font-weight: bold; }
.input-group input { width: 100%; padding: 12px; border: 1px solid #cccccc; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
.input-group input:focus { border-color: #4f46e5; outline: none; }
.login-btn { width: 100%; padding: 14px; background-color: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; }
.login-btn:hover { background-color: #4338ca; }
.login-btn:disabled { background-color: #a5b4fc; cursor: not-allowed; }
.error-msg { color: #dc2626; font-size: 14px; margin-top: 16px; }
</style>