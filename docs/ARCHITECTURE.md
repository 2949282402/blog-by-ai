# 博客系统架构设计

**数据库**: MySQL 8.0  
**部署模式**: Docker Compose  
**更新时间**: $(date '+%Y-%m-%d %H:%M:%S')

---

## 📐 系统架构

```
┌─────────────┐
│   Nginx     │ (80)
│  反向代理   │
└──────┬──────┘
       │
       ├──▶ /        → Vue3 前端
       │
       └──▶ /api/    → Spring Boot (8081)
                           │
                     ┌─────┴─────┐
                     │   MySQL   │ (3306)
                     │  持久存储  │
                     └───────────┘
```

---

## 🏗️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | Vue3 + Vite | 3.x |
| 后端 | Spring Boot | 3.2.0 |
| 数据库 | MySQL | 8.0 |
| ORM | Spring Data JPA | 3.2.0 |
| Web | Nginx | Alpine |
| 容器 | Docker | 29.x |

---

## 🔧 核心功能模块

### 文章系统
- Post 实体：文章CRUD
- Category 实体：分类管理
- Comment 实体：评论系统
- Like 实体：点赞统计

### RAG系统
- RagService：TF-IDF语义检索
- RagController：问答接口

### 自动化流水线
- 每5分钟-execution循环优化
- 自动添加新功能模块
- 文档强制更新
- Git自动推送

---

## 📊 数据库设计

### 表结构
- `posts`：文章表
- `categories`：分类表  
- `comments`：评论表
- `likes`：点赞表

### 索引
- `idx_posts_created_at`：发布时间索引
- `idx_posts_published`：发布状态索引
- `unique_like`：点赞唯一约束
