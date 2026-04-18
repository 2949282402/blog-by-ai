#!/bin/bash

# 博客优化流水线监控脚本
# 检查流水线是否在运行，如果没跑就启动

PIPELINE_PROCESS="blog-continuous-pipeline"
PIPELINE_SCRIPT="/root/.openclaw/workspace/scripts/blog-continuous-pipeline.sh"
LOG_FILE="/tmp/blog-pipeline-monitor.log"

# 检查进程是否在运行
check_process() {
    pgrep -f "$PIPELINE_PROCESS" > /dev/null 2>&1
}

# 获取当前时间
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 检查运行状态
if check_process; then
    # 进程在运行
    PID=$(pgrep -f "$PIPELINE_PROCESS" | head -1)
    echo "[$TIMESTAMP] ✅ 流水线正常运行中 (PID: $PID)" >> "$LOG_FILE"
    exit 0
else
    # 进程没运行，需要启动
    echo "[$TIMESTAMP] ⚠️ 检测到流水线未运行，正在启动..." >> "$LOG_FILE"
    
    # 启动流水线
    nohup bash "$PIPELINE_SCRIPT" > /tmp/blog-pipeline.log 2>&1 &
    NEW_PID=$!
    
    # 等待几秒确认启动成功
    sleep 2
    
    if check_process; then
        echo "[$TIMESTAMP] ✅ 流水线启动成功 (PID: $NEW_PID)" >> "$LOG_FILE"
        
        # 发送启动通知
        NOTIFICATION="{
  \"message\": \"🚀 博客优化流水线自动启动通知
━━━━━━━━━━━━━━━━━━━━━━━━━━━
检测到流水线停止，已自动重启

启动时间: $TIMESTAMP
新进程PID: $NEW_PID
托管脚本: blog-continuous-pipeline.sh
━━━━━━━━━━━━━━━━━━━━━━━━━━━\"
}"
        echo "$NOTIFICATION" >> "$LOG_FILE"
        exit 0
    else
        echo "[$TIMESTAMP] ❌ 流水线启动失败，请手动检查" >> "$LOG_FILE"
        exit 1
    fi
fi