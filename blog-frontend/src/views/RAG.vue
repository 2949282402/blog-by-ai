<template>
  <div class="rag-container">
    <h2>🤖 AI 智能问答</h2>
    <p class="rag-desc">基于博客文章的 RAG 检索增强问答</p>
    
    <div class="rag-tabs">
      <button :class="{ active: activeTab === 'qa' }" @click="activeTab = 'qa'">
        智能问答
      </button>
      <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">
        语义搜索
      </button>
    </div>
    
    <!-- Q&A Tab -->
    <div v-if="activeTab === 'qa'" class="qa-section">
      <div class="chat-container">
        <div v-for="(msg, index) in chatHistory" :key="index" 
             :class="['message', msg.type]">
          <div class="msg-content">{{ msg.content }}</div>
        </div>
        <div v-if="loading" class="typing-indicator">🤔 正在思考...</div>
      </div>
      
      <div class="input-area">
        <input 
          v-model="question" 
          @keyup.enter="askQuestion"
          placeholder="输入你的问题..."
          :disabled="loading"
        />
        <button @click="askQuestion" :disabled="loading || !question">
          {{ loading ? '思考中...' : '提问' }}
        </button>
      </div>
    </div>
    
    <!-- Search Tab -->
    <div v-if="activeTab === 'search'" class="search-section">
      <div class="input-area">
        <input 
          v-model="searchQuery" 
          @keyup.enter="doSearch"
          placeholder="搜索博客文章..."
        />
        <button @click="doSearch">搜索</button>
      </div>
      
      <div class="search-results" v-if="searchResults.length > 0">
        <article v-for="result in searchResults" :key="result.id" class="result-card">
          <h3>{{ result.title }}</h3>
          <p class="score">相关度: {{ (result.score * 100).toFixed(1) }}%</p>
          <p class="preview">{{ result.content?.substring(0, 150) }}...</p>
        </article>
      </div>
      <div v-else-if="searched" class="no-results">
        未找到相关文章
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'RAG',
  data() {
    return {
      activeTab: 'qa',
      question: '',
      searchQuery: '',
      chatHistory: [],
      searchResults: [],
      loading: false,
      searched: false
    }
  },
  methods: {
    async askQuestion() {
      if (!this.question.trim() || this.loading) return
      
      this.loading = true
      this.chatHistory.push({ type: 'user', content: this.question })
      
      try {
        const response = await axios.post('/api/rag/ask', {
          question: this.question
        })
        this.chatHistory.push({ type: 'ai', content: response.data.answer })
      } catch (error) {
        this.chatHistory.push({ 
          type: 'error', 
          content: '抱歉，问答服务暂时不可用' 
        })
      } finally {
        this.question = ''
        this.loading = false
      }
    },
    
    async doSearch() {
      if (!this.searchQuery.trim()) return
      
      try {
        const response = await axios.post('/api/rag/search', {
          query: this.searchQuery,
          topK: 5
        })
        this.searchResults = response.data
        this.searched = true
      } catch (error) {
        console.error('搜索失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.rag-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  text-align: center;
  color: #333;
}

.rag-desc {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
}

.rag-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.rag-tabs button {
  flex: 1;
  padding: 12px;
  border: none;
  background: #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.rag-tabs button.active {
  background: #4a90d9;
  color: white;
}

.chat-container {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.message {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 80%;
}

.message.user {
  background: #4a90d9;
  color: white;
  margin-left: auto;
}

.message.ai {
  background: white;
  color: #333;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.typing-indicator {
  color: #999;
  font-style: italic;
  padding: 10px;
}

.input-area {
  display: flex;
  gap: 10px;
}

.input-area input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.input-area button {
  padding: 12px 24px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.input-area button:disabled {
  background: #ccc;
}

.search-results {
  margin-top: 20px;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.result-card h3 {
  color: #333;
  margin-bottom: 8px;
}

.result-card .score {
  color: #4a90d9;
  font-size: 14px;
  margin-bottom: 8px;
}

.result-card .preview {
  color: #666;
  line-height: 1.6;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>