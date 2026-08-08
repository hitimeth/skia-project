<template>
  <!-- 1. 팝업 창으로 열렸을 때 (헤더/푸터 없이 단독 표시) -->
  <div v-if="isPopupView" class="popup-full-container">
    <DeckBuildBuffManageView />
  </div>

  <!-- 2. 일반 메인 앱 화면 -->
  <div v-else id="app" class="app-container">    
    <header class="global-header">
      <div class="header-inner">
        <div class="logo-area" @click="isLoggedIn && (currentTab = 'home')">
          <img src="/Logo.png" alt="적십자단" class="main-logo-img" />
        </div>

        <nav v-if="isLoggedIn" class="main-navigation">
          <button class="nav-item" :class="{ active: currentTab === 'home' }" @click="currentTab = 'home'">홈</button>          
          <button class="nav-item" :class="{ active: currentTab === 'info' }" @click="currentTab = 'info'">링크</button>
          <!-- <button class="nav-item" :class="{ active: currentTab === 'buff' }" @click="currentTab = 'buff'"></button> -->
          <button class="nav-item" :class="{ active: currentTab === 'deck-share' }" @click="currentTab = 'deck-share'">덱공유</button>
          <button class="nav-item" :class="{ active: currentTab === 'deck-build' }" @click="currentTab = 'deck-build'">깊악</button>
          <button class="nav-item" :class="{ active: currentTab === 'deck-build_descent' }" @click="currentTab = 'deck-build_descent'">강림</button>
          <button class="nav-item" :class="{ active: currentTab === 'deck-build_celestial' }" @click="currentTab = 'deck-build_celestial'">천결</button>
          <button class="nav-item" :class="{ active: currentTab === 'char' }" @click="currentTab = 'char'">캐릭터</button>
          <button class="nav-item" :class="{ active: currentTab === 'board' }" @click="currentTab = 'board'">게시판</button>
          <button class="nav-item" :class="{ active: currentTab === 'mypage' }" @click="currentTab = 'mypage'">마이페이지</button>
        </nav>

        <div class="header-utilities">
          <button v-if="isLoggedIn" class="btn-utility-action" @click="handleLogout">로그아웃</button>
          <button v-else class="btn-utility-action active"> 로그인 필요</button>          
          <div class="grid-menu-trigger" title="전체 메뉴 보기">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content-wrapper">
      <div class="content-area">
        <div v-if="!isLoggedIn">
          <LoginEntrance @login-success="handleLoginSuccess" />
        </div>
        
        <div v-else>
          <HomeView v-if="currentTab === 'home'" />
          <InfoListView v-else-if="currentTab === 'info'" />
          <HomeBuffListView v-else-if="currentTab === 'buff'" />
          <DeckShareView v-else-if="currentTab === 'deck-share'" />
          <DeckBuildView v-else-if="currentTab === 'deck-build'" :boardCategory="'nightmare'" />
          <DeckBuildView v-else-if="currentTab === 'deck-build_descent'" :boardCategory="'descent'" />
          <DeckBuildView v-else-if="currentTab === 'deck-build_celestial'" :boardCategory="'celestial'" />
          <SkiaCharView v-else-if="currentTab === 'char'" />
          <BoardView v-else-if="currentTab === 'board'" />
          <MyPageView v-else-if="currentTab === 'mypage'" />
        </div>
      </div>
    </main>

    <footer class="global-footer">
      <div class="footer-inner">
        <div class="footer-top-row">
          <h2 class="footer-brand-title">세븐나이츠키우기 적십자단</h2>
        </div>
        <hr class="footer-divider" />
        <div class="footer-bottom-row">
          <div class="footer-info-left">
            <p class="footer-copy">© 2026 적십자단 DECK ARCHIVE. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>

  </div>
</template>

<script>

import HomeView from './components/HomeView.vue';
import InfoListView from './components/InfoListView.vue';
import HomeBuffListView from './components/HomeBuffListView.vue';
import DeckShareView from './components/DeckShareView.vue';
import DeckBuildView from './components/DeckBuildView.vue';
import SkiaCharView from './components/SkiaCharView.vue';
import BoardView from './components/BoardView.vue';
import MyPageView from './components/MyPageView.vue';
import LoginEntrance from './components/LoginEntrance.vue';
import DeckBuildBuffManageView from './components/DeckBuildBuffManageView.vue';

export default {
  name: 'App',
  components: { 
    HomeView,
    InfoListView, 
    HomeBuffListView, 
    DeckShareView, 
    DeckBuildView,
    SkiaCharView, 
    BoardView, 
    MyPageView,
    LoginEntrance,
    DeckBuildBuffManageView  
  },
  data() {
    return { 
      isPopupView: window.location.search.includes('view=buff-manage'),
      isLoggedIn: false,
      currentTab: localStorage.getItem('activeGlobalTab') || 'home',  
      username: '',
      isAdmin: false,
      isMaster: false,
      showRegisterModal: false,
    };
  },
  // 🎯 앱이 초기화될 때 1시간 만료 여부를 검사합니다.
  created() {
    this.checkLoginValidity();
  },
  // 🎯 사용자가 메뉴(탭)를 클릭할 때마다 유효 시간을 검사합니다.
  watch: {
    // 🎯 currentTab이 바뀔 때마다 두 가지 기능을 순서대로 모두 실행합니다.
    currentTab(newTab) {
      // 1. 기존의 로그인 유효 시간 검사 기능 수행
      this.checkLoginValidity();
      
      // 2. 다른 앱에 갔다 와도 복원되도록 로컬 스토리지에 새 탭 저장
      localStorage.setItem('activeGlobalTab', newTab);
    }
  },
  methods: {
    // 🎯 1시간 유효성 검사 함수
    checkLoginValidity() {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const expireTime = localStorage.getItem('loginExpireTime');
      
      if (isLoggedIn && expireTime) {
        // 현재 시간이 만료 시간을 지났다면 자동으로 로그아웃 처리
        if (Date.now() > parseInt(expireTime, 10)) {
          //alert('로그인 유효 시간(1시간)이 만료되어 자동 로그아웃되었습니다.');
          this.handleLogout();
        } else {
          this.isLoggedIn = true;
        }
      } else {
        this.isLoggedIn = false;
      }
    },
    // 로그인 성공 시 호출될 핸들러
    handleLoginSuccess() {
      this.checkLoginValidity();
      this.currentTab = 'home'; 
    },
    // 로그아웃 기능
    handleLogout() {
      this.isLoggedIn = false;
      // 로그아웃 시 관련 데이터 및 만료 시간 정보까지 깔끔하게 제거
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('loginExpireTime');
      localStorage.removeItem('activeGlobalTab');
      this.currentTab = 'home';
      this.isLoggedIn = false;
    }
  }
};
</script>

<style>
/* 전역 스타일 및 미디어 쿼리 원본 동일 유지 */
body { 
  margin: 0; 
  padding: 0;
  background-color: #F4F6F5; 
  color: #1a1a1a; 
  font-family: 'Segoe UI', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
}

.global-header {
  background-color: #ffffff;
  border-bottom: 1px solid #eaeae8;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 75px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-area {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.main-logo-img {
  height: 45px;
  width: auto;
  object-fit: contain;
}

.main-navigation {
  display: flex;
  gap: 15px;
}
.nav-item {
  background: none;
  border: none;
  color: #333333;
  font-size: 17px;
  font-weight: 700;
  padding: 10px 15px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  font-family: inherit;
}
.nav-item:hover, .nav-item.active {
  color: #0b5999;
}
.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 15px;
  width: calc(100% - 30px);
  height: 3px;
  background-color: #0b5999;
  border-radius: 2px;
}

.header-utilities {
  display: flex;
  align-items: center;
  gap: 16px;
}
.btn-utility-action {
  background-color: #ffffff;
  border: 1px solid #cdcbc4;
  color: #333333;
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-utility-action:hover, .btn-utility-action.active {
  background-color: #1a1a1a;
  color: white;
  border-color: #1a1a1a;
}
.grid-menu-trigger {
  width: 22px;
  height: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
}
.grid-menu-trigger span {
  display: block;
  width: 100%;
  height: 3px;
  background-color: #333333;
  border-radius: 2px;
}

.main-content-wrapper {
  flex: 1;
  width: 100%;
}
.content-area { 
  padding: 30px 24px; 
  max-width: 1400px; 
  margin: 0 auto; 
  box-sizing: border-box;
}

.global-footer {
  background-color: #eef1f3; 
  padding: 35px 0;
  border-top: 1px solid #eaeae8;
  color: #444444;
  margin-top: auto;
}
.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}
.footer-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.footer-brand-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}
.footer-divider {
  border: 0;
  height: 1px;
  background-color: #d1d5db;
  margin: 18px 0;
}
.footer-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.6;
}
.footer-info-left { text-align: left; }
.footer-copy { font-weight: 700; margin: 0 0 4px 0; color: #1a1a1a; }
.footer-address { margin: 0; color: #777777; }
/* 팝업 창 꽉 차게 보이도록 설정 */
.popup-app-wrapper {
  width: 100vw;
  min-height: 100vh;
  background-color: #0f172a;
  box-sizing: border-box;
}
.popup-full-container {
  width: 100vw;
  min-height: 100vh;
  background-color: #0f172a; /* 원하는 배경색 */
  box-sizing: border-box;
}
@media (max-width: 1024px) {
  .header-inner {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between;
    align-items: center;
    height: 60px !important;
    padding: 0 8px !important;
    gap: 8px;
  }
  .logo-area { flex-shrink: 0; }
  .main-logo-img { height: 32px !important; width: auto; }
  .main-navigation {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    flex: 1;
    gap: 4px !important;
    padding: 0 4px !important;
    align-items: center;
    -webkit-overflow-scrolling: touch;
  }
  .main-navigation::-webkit-scrollbar { display: none !important; }
  .nav-item {
    font-size: 13px !important;
    padding: 6px 10px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }
  .nav-item.active::after {
    bottom: 0px !important;
    left: 10px !important;
    width: calc(100% - 20px) !important;
  }
  .header-utilities { flex-shrink: 0; gap: 8px !important; }
  .btn-utility-action { padding: 6px 12px !important; font-size: 12px !important; }
  .grid-menu-trigger { width: 20px !important; height: 15px !important; }
}
</style>