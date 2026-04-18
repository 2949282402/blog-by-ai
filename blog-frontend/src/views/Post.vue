<template>
  <div class="post-container">
    <div class="post-header">
      <button class="back-btn" @click="goBack">← 返回</button>
    </div>
    
    <article v-if="post" class="post-detail">
      <h1>{{ post.title }}</h1>
      
      <div class="post-meta">
        <span class="author">作者: {{ post.author || '匿名' }}</span>
        <span class="date">{{ formatDate(post.createdAt) }}</span>
      </div>
      
      <div class="post-cover" v-if="post.coverImage">
        <img :src="post.coverImage" :alt="post.title">
      </div>
      
      <div class="post-body" v-html="post.content"></div>
    </article>
    
    <div v-else class="loading">
      <p>加载中...</p>
    </div>
  </div>
</template>

<script>
import { getPost } from '../api'

export default {
  name: 'Post',
  data() {
    return {
      post: null
    }
  },
  mounted() {
    this.fetchPost()
  },
  methods: {
    async fetchPost() {
      try {
        const id = this.$route.params.id
        const response = await getPost(id)
        this.post = response.data
      } catch (error) {
        console.error('获取文章失败:', error)
      }
    },
    goBack() {
      this.$router.push('/')
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN')
    }
  }
}
</script>

<style scoped>
.post-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.post-header {
  margin-bottom: 20px;
}

.back-btn {
  background: #fff;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.post-detail {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.post-detail h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 16px;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  color: #999;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.post-cover {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
}

.post-cover img {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
}

.post-body {
  line-height: 1.8;
  color: #333;
  font-size: 1.1rem;
}

.post-body :deep(p) {
  margin-bottom: 16px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}
</style>