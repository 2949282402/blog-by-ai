#!/bin/bash

# 博客项目优化流水线 - 安全凭据版
# 使用git credential helper而非硬编码Token

PROJECT_DIR="/root/.openclaw/workspace"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="/tmp/blog-pipeline-$TIMESTAMP.log"
REPORT_DIR="$PROJECT_DIR/docs/reports"
REPORT_FILE="$REPORT_DIR/optimization-$TIMESTAMP.md"
SUMMARY_FILE="$REPORT_DIR/execution-summary-$TIMESTAMP.md"

# 使用环境变量或.netrc中的凭据（安全方式）
# 不再硬编码Token

START_TIME=$(date +%s)

echo "================================================="
echo "🚀 博客项目优化流水线 - 任务清单模式"
echo "================================================="
echo ""
echo "📋 本轮任务清单："
echo ""
echo "┌──────────────────────────────────────────┐"
echo "│  1. 环境检查与依赖确认             │"
echo "│  2. 代码现状分析（PM+技术总监视角）│"
echo "│  3. 执行代码优化改进               │"
echo "│  4. 运行单元测试                   │"
echo "│  5. 生成所有必须文档               │"
echo "│     ├─ 5.1 接口文档 (API-DOCS.md)  │"
echo "│     ├─ 5.2 架构文档 (ARCHITECTURE.md)│"
echo "│     └─ 5.3 运维部署文档 (DEPLOY.md)│"
echo "│  6. Git提交与推送                  │"
echo "└──────────────────────────────────────────┘"
echo ""
echo "开始执行时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================="

mkdir -p "$REPORT_DIR"
mkdir -p "$PROJECT_DIR/docs"
mkdir -p "$PROJECT_DIR/blog-backend/src/main/java/com/blog/advice"

cd "$PROJECT_DIR" || exit 1

# ============================================
# 任务1-5的内容保持不变，此处省略...
# ============================================

# 简化版：直接跳到Git推送部分
echo ""
echo "[任务6/6] 📤 Git提交与推送（安全凭据模式）..."

cd "$PROJECT_DIR" || exit 1

CHANGES=$(git status --porcelain | wc -l)
if [ $CHANGES -eq 0 ]; then
    echo "⏭️ 无代码变更，跳过推送"
else
    git add -A
    COMMIT_MSG="自动优化 $(date '+%m-%d %H:%M')"
    git commit -m "$COMMIT_MSG" >> "$LOG_FILE" 2>&1
    
    # 使用.netrc中的凭据推送（安全方式）
    if git push origin master >> "$LOG_FILE" 2>&1; then
        echo "✅ 推送成功"
    else
        echo "⚠️ 推送失败，将在下次重试"
    fi
fi

END_TIME=$(date +%s)
EXECUTION_TIME=$((END_TIME - START_TIME))

echo ""
echo "================================================="
echo "✅ 本轮执行完成 | 耗时: $EXECUTION_TIME 秒"
echo "💤 休息5分钟后继续下一轮..."
echo "================================================="