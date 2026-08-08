import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// 🎯 백엔드와 유연하게 쿠키/인증 정보를 주고받을 수 있도록 기본 셋팅을 켜줍니다.
axios.defaults.withCredentials = true;

const app = createApp(App)
app.use(router)
app.mount('#app')