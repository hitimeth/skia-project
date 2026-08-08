import { createRouter, createWebHistory } from 'vue-router'
import DeckShareView from '../components/DeckShareView.vue' // 컴포넌트 위치에 맞게 수정하세요

const routes = [
  {
    path: '/',
    name: 'Home',
    component: DeckShareView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router