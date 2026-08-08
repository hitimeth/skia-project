<template>
  <div class="dashboard">
    <h3 class="section-title">⭐ 7렙 핵심 버프 / 디버프 안내</h3>
    <div class="buff-grid">
      <div class="buff-card" v-for="(heroes, type) in buffGuide" :key="type">
        <div class="buff-type">{{ type }}</div>
        <div class="buff-heroes">{{ heroes }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      buffGuide: {
        "1. 공격": "아벨, 브브, 쥬리, 나단, 루나",
        "2. 공속": "바네사, 에이스, 제이브",
        "3. 치확": "레이첼, 시리스, 온크리스",
        "4. 치피": "아그니, 온루디",
        "5. 약확": "연희, 펜리르",
        "6. 악피증": "태오, 쥬리, 제라드",
        "7. 추피확": "온델론",
        "8. 추피증": "린, 진, 세이지",
        "9. 받피증": "쥬다스, 트루드, 에린, 엘가",
        "10. 치확저": "카일, 루시아, 스쿨드",
        "11. 방감": "수르트, 티이, 요나",
        "12. 회감": "플라톤, 카르마"
      }
    };
  }
};
</script>

<style scoped>
.welcome-box { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 25px; text-align: center; }
.section-title { color: #35495e; margin-bottom: 15px; font-weight: bold; }
.buff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
.buff-card { background: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 4px solid #42b983; }
.buff-type { font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
.buff-heroes { color: #666; font-size: 14px; }

/* 🎨 신규 추가된 이미지 카드 디자인 (모바일 핏 반영) */
.image-dashboard-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eef2f5;
  box-sizing: border-box;
}
.image-wrapper {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
}
.dashboard-img {
  width: 100%;
  max-width: 600px; /* 모바일과 PC에서 너무 거대해지지 않도록 가이드 조절 */
  height: auto;
  display: block;
  object-fit: contain;
}
.image-caption {
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
  text-align: center;
  font-weight: 500;
}

@media (max-width: 600px) {
  .buff-grid { grid-template-columns: 1fr; }
  .image-dashboard-card { padding: 10px; }
}
</style>