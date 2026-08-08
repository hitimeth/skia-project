#!/bin/bash

# 1. 백엔드 서버 실행
cd /home/ec2-user/backend && node index.js > backend.log 2>&1 &

# 2. 프론트엔드 서버 실행 (경로: skia-frontend)
# 🎯 주석: --mode production을 명확히 주입하여 .env.production을 읽도록 만듭니다.
cd /home/ec2-user/skia-frontend && npm run dev -- --host --mode production > frontend.log 2>&1 &

echo "Skia 서비스가 시작되었습니다."