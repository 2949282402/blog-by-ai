#!/bin/bash

# 博客项目持续优化流水线
# 执行完休息5分钟再跑下一轮

PROJECT_DIR="/root/.openclaw/workspace"
SCRIPT="$PROJECT_DIR/scripts/blog-optimize-cicd.sh"

echo "启动持续优化流水线..."
echo "执行完一轮后自动休息5分钟继续"
echo "=================================="

while true; do
    echo ""
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ========== 新一轮优化开始 =========="
    
    # 执行优化任务
    if bash "$SCRIPT"; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 本轮优化完成"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 本轮优化失败"
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 💤 休息5分钟后继续下一轮..."
    sleep 300  # 300秒 = 5分钟
    
    echo "=================================="
done