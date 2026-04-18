<template>
  <div class="search-bar">
    <input
      v-model="searchQuery"
      @keyup.enter="handleSearch"
      placeholder="搜索文章..."
      class="search-input"
    />
    <button @click="handleSearch" class="search-btn">搜索</button>
  </div>
</template>

<script>
export default {
  name: 'SearchBar',
  data() {
    return {
      searchQuery: ''
    }
  },
  methods: {
    handleSearch() {
      if (this.searchQuery.trim()) {
        this.$router.push(`/?search=${encodeURIComponent(this.searchQuery)}`)
      }
    }
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}
.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}
.search-btn {
  padding: 10px 20px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
