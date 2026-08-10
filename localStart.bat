@echo off
title Skia Local Servers
echo 로컬 프론트엔드 및 백엔드 서비스를 시작합니다...
concurrently "cd backend && node index.js" "cd skia-frontend && npm run dev"
pause