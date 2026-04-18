#!/bin/bash

# Git 推送测试脚本
# 确保推送成功的检查与重试机制

REPO_DIR="/root/.openclaw/workspace"
MAX_RETRIES=3
RETRY_DELAY=10

cd "$REPO_DIR" || exit 1

echo "🚀 Git 推送测试"
echo "================================"

git status

echo ""
echo "📤 尝试推送到 GitHub..."

for i in $(seq 1 $MAX_RETRIES); do
    echo "尝试 $i/$MAX_RETRIES..."
    
    if git push origin master 2>&1; then
        echo "✅ 推送成功！"
        exit 0
    else
        echo "❌ 推送失败，等待 ${RETRY_DELAY}s 后重试..."
        sleep $RETRY_DELAY
    fi
done

echo "⚠️ $MAX_RETRIES 次尝试均失败，可能存在网络或认证问题"
echo "查看日志: git push --verbose origin master"
exit 1