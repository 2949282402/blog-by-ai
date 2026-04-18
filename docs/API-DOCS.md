# 博客系统 API 接口文档

**版本**: v1.0  
**更新时间**: $(date '+%Y-%m-%d %H:%M:%S')  
**维护状态**: 自动生成

---

## 📝 文章管理接口

### 获取所有文章
```
GET /api/posts
```
**响应**: `ApiResponse<List<PostDTO>>`

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
  "author": "作者名"
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

## 🤖 RAG智能问答接口

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

## 📊 响应格式

所有接口返回统一格式:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "success": true
}
```
