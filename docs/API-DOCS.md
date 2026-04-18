# 博客系统 API 接口文档

**版本**: v2.0  
**数据库**: MySQL 8.0  
**更新时间**: $(date '+%Y-%m-%d %H:%M:%S')

---

## 📝 文章管理

### 获取所有文章
```
GET /api/posts
```
**响应**: `List<PostDTO>`

### 获取单篇文章
```
GET /api/posts/{id}
```

### 创建文章
```
POST /api/posts
Content-Type: application/json

{
  "title": "文章标题",
  "content": "文章内容",
  "author": "作者名",
  "categoryId": 1
}
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
{
  "query": "搜索词",
  "topK": 5
}
```

### 智能问答
```
POST /api/rag/ask
{
  "question": "问题内容"
}
```

---

## 📂 分类管理

### 获取所有分类
```
GET /api/categories
```

### 创建分类
```
POST /api/categories
{
  "name": "分类名",
  "description": "分类描述"
}
```

---

## 💬 评论管理

### 获取文章评论
```
GET /api/posts/{postId}/comments
```

### 添加评论
```
POST /api/posts/{postId}/comments
{
  "author": "评论者",
  "content": "评论内容"
}
```

---

## ❤️ 点赞功能

### 点赞文章
```
POST /api/posts/{postId}/like
X-Forwarded-For: 用户IP
```

### 获取点赞数
```
GET /api/posts/{postId}/likes
```
