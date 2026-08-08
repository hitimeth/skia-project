<template>
  <div class="menu-style-container">
    <div class="home-container">
      
      <!-- 리디자인된 상단 헤더 영역 -->
      <header class="custom-header">
        
        <!-- 1. 메인 캘리그라피 타이틀 -->
        <div class="title-wrapper">
          <h1 class="site-title"></h1>
        </div>

        <!-- 2. 검은색 메인 배너 카드 (TODAY'S MENU 스타일) -->
        <div class="dark-banner-card">
          <div class="banner-content-left">
            <span class="badge-tag">길드 정보 안내</span>
            <span class="divider-line">|</span>
            <span class="brand-name">적십자단</span>
          </div>
          <div class="banner-content-right">
            <span class="notice-inline">
              <span class="mega-icon">📢</span> 길드 덱 공유 사이트입니다.
            </span>
          </div>
        </div>

      </header>

      <div class="home-body">
        
        <!-- 1. 안내사항 -->
        <section class="info-section intro-card">
          <h3 class="section-title"><span class="star-icon">⭐</span> 안내사항</h3>
          <div class="highlight-box">
            <p class="highlight-text" style="text-align: left;">부담없이 즐기면서 게임하시길 바랍니다.</p>
          </div>
          <ul class="styled-list">
            <li>
              <span class="alert-tag text-red">✔</span> 
              <strong>[사이트 주소 & 로그인 ID/PW] 길드외 공유 금지</strong>
            </li>
            <li>
              <span class="alert-tag">✔</span> 
              클린사이트로 운영할 예정입니다. 게시글 등록 시 비방 또는 혐오 관련 글은 자제해 주십시오.
            </li>
            <li>
              <span class="alert-tag">✔</span> 
              인증서 등록 및 도메인 등록을 진행하지 않았습니다. (현재 무료 서버 운영 중)
            </li>            
          </ul>
        </section>

        <!-- 2. 길드 참여 및 운영 규칙 -->
        <section class="info-section rule-card">
          <h3 class="section-title"><span class="danger-icon">⚠️</span> 길드 참여 및 운영 규칙</h3>
          <ul class="styled-list">
            <li><span class="alert-tag text-blue">✔</span> 적십자단은 참여를 제일 우선으로 합니다.</li>
            <li>
              <span class="alert-tag text-blue">✔</span> <span class="sub-label">강퇴 사유</span>
              <div class="badge-group">                
                <span class="rule-badge">3일 미접</span>
                <span class="rule-badge">3일 연속길드전 미참여</span>
                <span class="rule-badge">강림 4회 미만 참여</span>
              </div>
            </li>      
          </ul>
          <div class="notice-footer-text">
            <span>💡 휴가 등 사유가 있으시면 미리 알려주세요!!</span>
            <span>(챗 또는 게시판)</span>
          </div>
        </section>

        <!-- 3. 길드전 및 URL 안내 -->
        <section class="info-section rule-card">
          <h3 class="section-title"><span class="danger-icon">⚠️</span> 기타 안내 사항</h3>
          <ul class="styled-list">
            <li><span class="alert-tag text-blue">✔</span> 길드전 참여 또는 길드가입 익일에 URL을 알려드리고 있습니다.</li>
            <li><span class="alert-tag text-blue">✔</span> 덱공유 해주실 분은 덱공유 제출 또는 길드 챗에 공유해 주세요. 길드에 큰 도움이 됩니다.</li>     
            <li><span class="alert-tag text-blue">✔</span> ID/PASSWORD는 매주 금요일 또는 인원 변경 시 변경됩니다.</li>               
          </ul>
          <div class="guide-footer-alert">
            📌 <strong>공지사항에서 ID/PASSWORD 확인!!</strong>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView'
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap');

.menu-style-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
  font-family: 'Noto Sans KR', sans-serif;
  color: #222;
}

/* =======================================
   ✨ 헤더 리디자인 스타일
======================================= */
.custom-header {
  margin-bottom: 25px;
}

/* 상단 캘리그라피 폰트 메인 타이틀 */
.title-wrapper {
  margin-bottom: 14px;
}

.site-title {
  font-family: 'Gowun Batang', serif; /* 이미지 느낌의 맛깔스러운 폰트 */
  font-size: 2.4rem;
  font-weight: 700;
  color: #111111;
  margin: 0;
  letter-spacing: -1px;
  line-height: 1.2;
}

/* 다크 메인 배너 (TODAY'S MENU 캡슐 바 스타일) */
.dark-banner-card {
  background: #1c1c1e;
  color: #ffffff;
  border-radius: 16px;
  padding: 8px 26px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  gap: 12px;
}

.banner-content-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-tag {
  font-size: 0.92rem;
  font-weight: 600;
  color: #f1f5f9;
}

.divider-line {
  color: #475569;
  font-size: 0.85rem;
}

.brand-name {
  font-size: 0.9rem;
  color: #94a3b8;
}

.banner-content-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notice-inline {
  font-size: 0.88rem;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mega-icon {
  font-size: 1rem;
}

.arrow-btn {
  font-size: 1.3rem;
  color: #94a3b8;
  font-weight: 300;
  line-height: 1;
}

/* =======================================
   기존 카드 섹션 스타일 유지 및 다듬기
======================================= */
.home-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  align-items: center;
  gap: 8px;
}

.styled-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.styled-list li {
  font-size: 13.5px;
  line-height: 1.6;
  color: #4a5568;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.alert-tag {
  font-weight: bold;
  color: #a0aec0;
  flex-shrink: 0;
}

.text-red { color: #e53e3e; }
.text-blue { color: #3182ce; }

.highlight-box {
  background-color: #ebf8ff;
  border-left: 4px solid #3182ce;
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.highlight-text {
  margin: 0;
  font-weight: 600;
  color: #2b6cb0;
  font-size: 14px;
}

.sub-label {
  font-weight: bold;
  color: #2d3748;
  margin-right: 6px;
  min-width: 80px;
}

.badge-group {
  display: contents;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  width: 100%;
}

.rule-badge {
  background-color: #2d3748;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  letter-spacing: -0.3px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.notice-footer-text {
  margin-top: 16px;
  background-color: #fffaf0;
  border: 1px solid #feebc8;
  color: #c05621;
  text-align: left;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.guide-footer-alert {
  margin-top: 16px;
  background-color: #f7fafc;
  border: 1px dashed #cbd5e0;
  padding: 12px;
  border-radius: 8px;
  text-align: left;
  font-size: 13.5px;
  color: #2d3748;
}

  .home-container{
    padding: 20px;
  }

/* 모바일 반응형 */
@media (max-width: 1024px) {
  .menu-style-container {
    padding: 12px 4px; /* 모바일에서 좌우 여백 축소 */
    text-align: left;
  }

  .site-title {
    font-size: 1.7rem;
  }

  .badge-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  }
  .dark-banner-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px 16px;
    gap: 8px;
  }

  .home-container{
    padding: 8px;
  }

  .banner-content-right {
    width: 100%;
    border-top: 1px solid #334155;
    padding-top: 8px;
  }

  .info-section { 
    padding: 8px; /* 내부 여백 축소로 모바일 가독성 증대 */
  }

  .rule-badge {
    padding: 6px 12px;
  }
}
</style>