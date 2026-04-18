<template>
  <div class="blog-container">
    <header class="blog-header">
      <h1>我的个人博客</h1>
      <p>分享技术，记录生活</p>
      <router-link to="/rag" class="rag-link">🤖 AI 智能问答</router-link>
    </header>
    
    <main class="posts-list">
      <article v-for="post in posts" :key="post.id" class="post-card" @click="goToPost(post.id)">
        <div class="post-cover" v-if="post.coverImage">
          <img :src="post.coverImage" :alt="post.title">
        </div>
        <div class="post-content">
          <h2>{{ post.title }}</h2>
          <p class="post-summary">{{ post.summary || post.content.substring(0, 100) + '...' }}</p>
          <div class="post-meta">
            <span class="author">{{ post.author || '匿名' }}</span>
            <span class="date">{{ formatDate(post.createdAt) }}</span>
          </div>
        </div>
      </article>
      
      <div v-if="posts.length === 0" class="empty-state">
        <p>暂无文章，敬请期待！</p>
      </div>
    </main>
  </div>
</template>

<script>
import { getPosts } from '../api'

export default {
  name: 'Home',
  data() {
    return {
      posts: []
    }
  },
  mounted() {
    this.fetchPosts()
  },
  methods: {
    async fetchPosts() {
      try {
        const response = await getPosts()
        this.posts = response.data
      } catch (error) {
        console.error('获取文章失败:', error)
      }
    },
    goToPost(id) {
      this.$router.push(`/post/${id}`)
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
.blog-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.blog-header {
  text-align: center;
  padding: 40px 0;
  border-bottom: 2px solid #eee;
  margin-bottom: 30px;
}

.blog-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.blog-header p {
  color: #666;
  font-size: 1.1rem;
}

.post-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 24px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.post-cover img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.post-content {
  padding: 20px;
}

.post-content h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 12px;
}

.post-summary {
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.rag-link {
  display: inline-block;
  margin-top: 16px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: 500;
  transition: transform 0.2s, box-shadow 0.2s;
}

.rag-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}
</style>