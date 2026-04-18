#!/bin/bash

# Blog 项目每小时优化任务
# 执行：产品经理视角 + 技术总监视角的全面优化

PROJECT_DIR="/root/.openclaw/workspace"
LOG_FILE="/tmp/blog-optimization.log"
DATE=$(date "+%Y-%m-%d %H:%M:%S")

echo "========= $DATE 项目优化开始 =========" >> $LOG_FILE

cd $PROJECT_DIR

# 1. 产品经理视角优化检查
echo "[PM视角] 分析产品体验..." >> $LOG_FILE

# 检查前端优化点
if [ -d "$PROJECT_DIR/blog-frontend" ]; then
    echo "[PM] 前端用户体验检查..." >> $LOG_FILE
    
    # 检查是否有Loading状态
    if ! grep -q "loading" $PROJECT_DIR/blog-frontend/src/views/Home.vue; then
        echo "[PM] 建议：添加Loading状态提升用户体验" >> $LOG_FILE
    fi
    
    # 检查是否有错误处理
    if ! grep -q "error" $PROJECT_DIR/blog-frontend/src/api/index.js; then
        echo "[PM] 建议：添加API错误处理" >> $LOG_FILE
    fi
fi

# 2. 技术总监视角优化检查
echo "[技术总监] 分析代码质量..." >> $LOG_FILE

# 后端检查
if [ -d "$PROJECT_DIR/blog-backend" ]; then
    echo "[技术] 后端代码质量检查..." >> $LOG_FILE
    
    # 检查是否有统一的响应封装
    if ! grep -q "Result" $PROJECT_DIR/blog-backend/src/main/java/com/blog/controller/PostController.java; then
        echo "[技术] 建议：添加统一的API响应封装类" >> $LOG_FILE
    fi
    
    # 检查是否有日志
    if ! grep -q "@Slf4j" $PROJECT_DIR/blog-backend/src/main/java/com/blog/service/PostService.java; then
        echo "[技术] 建议：添加日志记录" >> $LOG_FILE
    fi
    
    # 检查是否有配置类
    if [ ! -d "$PROJECT_DIR/blog-backend/src/main/java/com/blog/config" ]; then
        echo "[技术] 建议：添加配置类" >> $LOG_FILE
    fi
fi

echo "[完成] 优化分析完成，生成报告..." >> $LOG_FILE
echo "========= 优化任务结束 =========" >> $LOG_FILE

# 输出简要结果
cat $LOG_FILE | tail -20