#!/bin/bash

# 博客项目优化流水线 - 任务清单版
# 每轮读取/更新任务清单，确保稳定执行

PROJECT_DIR="/root/.openclaw/workspace"
TASK_CHECKLIST="$PROJECT_DIR/TASK_CHECKLIST.json"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="/tmp/blog-pipeline-$TIMESTAMP.log"

START_TIME=$(date +%s)

echo "================================================="
echo "🚀 博客项目优化流水线 - 任务清单驱动"
echo "================================================="

# 读取当前任务清单
if [ -f "$TASK_CHECKLIST" ]; then
    CURRENT_ROUND=$(grep '"currentRound"' "$TASK_CHECKLIST" | grep -o '[0-9]*')
    CURRENT_ROUND=$((CURRENT_ROUND + 1))
else
    CURRENT_ROUND=1
fi

echo "📋 当前轮次: $CURRENT_ROUND"
echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================="

cd "$PROJECT_DIR" || exit 1

# ============================================
# 任务1: 数据库连接检查
# ============================================
echo ""
echo "[任务1/4] 🗄️ MySQL连接检查..."

if mysql -u blog_user -pblog_pass_123 -e "USE blog; SELECT 1;" &>/dev/null; then
    echo "✅ MySQL连接正常"
    TASK1_STATUS="completed"
else
    echo "⚠️ MySQL连接失败，尝试启动..."
    service mysql start && echo "✅ MySQL已启动" && TASK1_STATUS="completed" || TASK1_STATUS="failed"
fi

# ============================================
# 任务2: 代码编译与测试
# ============================================
echo ""
echo "[任务2/4] 🔨 代码编译..."

cd "$PROJECT_DIR/blog-backend" || exit 1

if mvn compile -q >> "$LOG_FILE" 2>&1; then
    echo "✅ 编译成功"
    TASK2_STATUS="completed"
    
    # 运行测试
    if mvn test -q >> "$LOG_FILE" 2>&1; then
        echo "✅ 单元测试通过"
        TASK2_TEST="passed"
    else
        echo "⚠️ 部分测试失败"
        TASK2_TEST="partial"
    fi
else
    echo "❌ 编译失败"
    TASK2_STATUS="failed"
    mvn compile >> "$LOG_FILE" 2>&1
fi

cd - > /dev/null || exit 1

# ============================================
# 任务3: 文档强制更新（从任务清单读取状态）
# ============================================
echo ""
echo "[任务3/4] 📝 文档强制更新（基于任务清单）..."

# 读取任务清单中的待办事项
DOCS_PENDING=$(grep -A 5 '"docs"' "$TASK_CHECKLIST" | grep '"status": "pending"' | wc -l || echo "0")

echo "  发现 $DOCS_PENDING 个待更新文档..."

# 强制删除旧文档
rm -f "$PROJECT_DIR/docs/API-DOCS.md" 
rm -f "$PROJECT_DIR/docs/ARCHITECTURE.md"
rm -f "$PROJECT_DIR/docs/DEPLOY.md"

echo "  [3.1] 生成API接口文档..."
cat > "$PROJECT_DIR/docs/API-DOCS.md" << 'HEREDOC'
# 博客系统 API 接口文档

**版本**: v2.0 (MyBatis)
**数据库**: MySQL 8.0
**更新时间**: TIMESTAMP

---

## 📝 文章管理

### 获取所有文章
```
GET /api/posts
```

### 获取单篇文章
```
GET /api/posts/{id}
```

### 创建文章
```
POST /api/posts
Content-Type: application/json
```

### 更新文章
```
PUT /api/posts/{id}
```

### 删除文章
```
DELETE /api/posts/{id}
```

---

## 🤖 RAG智能问答

### 语义搜索
```
POST /api/rag/search
{"query": "关键词", "topK": 5}
```

### 智能问答
```
POST /api/rag/ask
{"question": "问题"}
```
HEREDOC
sed -i "s/TIMESTAMP/$(date '+%Y-%m-%d %H:%M:%S')/" "$PROJECT_DIR/docs/API-DOCS.md"
echo "    ✅ API-DOCS.md"

echo "  [3.2] 生成架构文档..."
cat > "$PROJECT_DIR/docs/ARCHITECTURE.md" << 'HEREDOC'
# 博客系统架构设计

**数据库**: MySQL 8.0
**ORM框架**: MyBatis 3.0
**更新时间**: TIMESTAMP

---

## 📐 系统架构

```
┌─────────────┐
│   Nginx     │ (80)
└──────┬──────┘
       │
       ├──▶ /        → Vue3 前端
       │
       └──▶ /api/    → Spring Boot (8081)
                           │
                           │ MyBatis
                           │
                     ┌─────┴─────┐
                     │   MySQL   │ (3306)
                     │  持久存储  │
                     └───────────┘
```

---

## 🔧 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | Vue3 + Vite | 3.x |
| 后端 | Spring Boot | 3.2.0 |
| ORM | MyBatis | 3.0.3 |
| 数据库 | MySQL | 8.0 |
| Web | Nginx | Alpine |

---

## 📊 数据库表

- posts (文章表)
- categories (分类表)
- comments (评论表)
- likes (点赞表)
- tags (标签表)
- users (用户表)
HEREDOC
sed -i "s/TIMESTAMP/$(date '+%Y-%m-%d %H:%M:%S')/" "$PROJECT_DIR/docs/ARCHITECTURE.md"
echo "    ✅ ARCHITECTURE.md"

echo "  [3.3] 生成运维文档..."
cat > "$PROJECT_DIR/docs/DEPLOY.md" << 'HEREDOC'
# 运维部署手册

**更新时间**: TIMESTAMP

---

## 🚀 快速部署

```bash
# MySQL初始化
mysql -u root < database/schema.sql

# 编译后端
cd blog-backend
mvn clean package -DskipTests

# 启动后端
java -jar target/blog-backend-1.0.0.jar

# 构建前端
cd blog-frontend
npm install && npm run build
```

---

## 📦 Docker部署

```bash
docker-compose up -d
```

---

## 🔄 自动化流水线

流水线脚本位于：`scripts/blog-continuous-pipeline.sh`

任务清单文件：`TASK_CHECKLIST.json`
HEREDOC
sed -i "s/TIMESTAMP/$(date '+%Y-%m-%d %H:%M:%S')/" "$PROJECT_DIR/docs/DEPLOY.md"
echo "    ✅ DEPLOY.md"

TASK3_STATUS="completed"
echo "✅ 文档已强制更新"

# ============================================
# 任务4: Git提交与推送
# ============================================
echo ""
echo "[任务4/4] 📤 Git提交与推送..."

cd "$PROJECT_DIR" || exit 1

# 更新任务清单
if [ -f "$TASK_CHECKLIST" ]; then
    # 更新当前轮次
    sed -i "s/\"currentRound\": [0-9]*/\"currentRound\": $CURRENT_ROUND/" "$TASK_CHECKLIST"
    
    # 添加历史记录
    HISTORY_ENTRY=",{\"round\": $CURRENT_ROUND, \"timestamp\": \"$(date -Iseconds)\", \"duration\": \"$(($(date +%s) - START_TIME))s\"}"
    sed -i "s/\"history\": \\[/\"history\": \\[$HISTORY_ENTRY/" "$TASK_CHECKLIST" 2>/dev/null || true
fi

git add -A
CHANGES=$(git status --porcelain | wc -l)

if [ $CHANGES -gt 0 ]; then
    COMMIT_MSG="优化 R$CURRENT_ROUND | MyBatis版本 | 文档强制更新 | $(date '+%m-%d %H:%M')"
    git commit -m "$COMMIT_MSG" >> "$LOG_FILE" 2>&1
    
    if git push origin master >> "$LOG_FILE" 2>&1; then
        echo "✅ 推送成功"
        TASK4_STATUS="completed"
    else
        echo "⚠️ 推送失败，下轮重试"
        TASK4_STATUS="partial"
    fi
else
    echo "ℹ️ 无变更需要提交"
    TASK4_STATUS="skipped"
fi

END_TIME=$(date +%s)
EXECUTION_TIME=$((END_TIME - START_TIME))

# 更新总轮次
if [ -f "$TASK_CHECKLIST" ]; then
    TOTAL_ROUNDS=$(grep '"totalRounds"' "$TASK_CHECKLIST" | grep -o '[0-9]*')
    TOTAL_ROUNDS=$((TOTAL_ROUNDS + 1))
    sed -i "s/\"totalRounds\": [0-9]*/\"totalRounds\": $TOTAL_ROUNDS/" "$TASK_CHECKLIST"
    sed -i "s/\"lastUpdated\": \"[^\"]*\"/\"lastUpdated\": \"$(date -Iseconds)\"/" "$TASK_CHECKLIST"
fi

echo ""
echo "================================================="
echo "✅ 本轮完成 | 轮次: $CURRENT_ROUND | 耗时: $EXECUTION_TIME 秒"
echo "📊 已更新任务清单: TASK_CHECKLIST.json"
echo "💤 休息5分钟后继续下一轮..."
echo "================================================="

# 输出摘要
echo ""
echo "📈 本轮摘要:"
echo "  数据库: $TASK1_STATUS"
echo "  编译测试: $TASK2_STATUS (测试: $TASK2_TEST)"
echo "  文档更新: $TASK3_STATUS"
echo "  Git推送: $TASK4_STATUS"