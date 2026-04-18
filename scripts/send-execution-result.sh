#!/bin/bash

# 流水线结果推送脚本
# 在每轮执行完成后调用此脚本发送结果到支付宝小程序

REPORT_FILE="/tmp/blog-last-execution-result.txt"
SUMMARY_DIR="/root/.openclaw/workspace/docs/reports"

# 获取最新的执行汇报
LATEST_SUMMARY=$(ls -t $SUMMARY_DIR/execution-summary-*.md 2>/dev/null | head -1)

if [ -f "$LATEST_SUMMARY" ]; then
    # 提取关键信息
    EXEC_TIME=$(grep "执行时间" "$LATEST_SUMMARY" | head -1 | awk -F': ' '{print $2}')
    EXEC_DURATION=$(grep "执行时长" "$LATEST_SUMMARY" | awk -F': ' '{print $2}')
    
    # 统计任务完成情况
    SUCCESS_COUNT=$(grep -c "✅" "$LATEST_SUMMARY" | head -1 || echo "0")
    WARNING_COUNT=$(grep -c "⚠️" "$LATEST_SUMMARY" | head -1 || echo "0")
    
    # Git推送状态
    GIT_STATUS=$(grep "Git推送" "$LATEST_SUMMARY" | grep -o "✅\|⚠️\|❌" | head -1 || echo "未知")
    
    # 构建通知消息
    cat > /tmp/notify-result.txt << EOF
📊 博客优化流水线 - 执行汇报

执行时间: $EXEC_TIME
执行耗时: $EXEC_DURATION

任务完成: $SUCCESS_COUNT/6 ✅
警告问题: $WARNING_COUNT 项

Git推送: $GIT_STATUS

详细汇报: docs/reports/execution-summary-*.md
EOF
    
    cat /tmp/notify-result.txt
else
    echo "⚠️ 未找到执行汇报文件"
fi