#!/bin/bash

echo "🚀 Skia 서비스를 PM2로 재시작합니다..."

# PM2에 저장된 프로세스 재시작 (백엔드, 프론트엔드 전체)
pm2 restart all

echo "----------------------------------------"
echo "📊 현재 PM2 프로세스 상태:"
pm2 status