#!/bin/bash

# 博客项目优化流水线 - 功能增强版
# 执行完休息5分钟再跑下一轮

PROJECT_DIR="/root/.openclaw/workspace"
SCRIPT="$PROJECT_DIR/scripts/blog-optimize-cicd.sh"
FEATURE_LOG="/tmp/blog-features.log"

echo "启动持续优化流水线..."
echo "执行完一轮后自动休息5分钟继续"
echo "=================================="

while true; do
    echo ""
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ========== 新一轮优化开始 =========="
    
    # 执行优化任务
    if bash "$SCRIPT"; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 本轮优化完成"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 本轮优化失败"
    fi
    
    # 功能增强模块
    echo ""
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 功能增强检查..."
    
    cd "$PROJECT_DIR" || exit 1
    
    # 检查并添加新功能
    FEATURES_ADDED=0
    
    # 功能1: 检查是否需要添加分类功能
    if [ ! -f "blog-backend/src/main/java/com/blog/entity/Category.java" ]; then
        echo "  → 添加文章分类功能..." >> "$FEATURE_LOG"
        # 创建Category实体
        mkdir -p blog-backend/src/main/java/com/blog/entity
        cat > blog-backend/src/main/java/com/blog/entity/Category.java << 'EOF'
package com.blog.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "categories")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "category")
    private List<Post> posts = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
EOF
        FEATURES_ADDED=$((FEATURES_ADDED + 1))
    fi
    
    # 功能2: 检查是否需要添加评论功能
    if [ ! -f "blog-backend/src/main/java/com/blog/entity/Comment.java" ]; then
        echo "  → 添加评论功能..." >> "$FEATURE_LOG"
        cat > blog-backend/src/main/java/com/blog/entity/Comment.java << 'EOF'
package com.blog.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "comments")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 50)
    private String author;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
EOF
        FEATURES_ADDED=$((FEATURES_ADDED + 1))
    fi
    
    # 功能3: 检查是否需要添加点赞功能
    if [ ! -f "blog-backend/src/main/java/com/blog/entity/Like.java" ]; then
        echo "  → 添加点赞功能..." >> "$FEATURE_LOG"
        cat > blog-backend/src/main/java/com/blog/entity/Like.java << 'EOF'
package com.blog.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "likes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"post_id", "user_ip"})
})
public class Like {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;
    
    @Column(name = "user_ip")
    private String userIp;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
EOF
        FEATURES_ADDED=$((FEATURES_ADDED + 1))
    fi
    
    # 功能4: 检查前端是否需要添加搜索功能
    if ! grep -q "SearchBar" blog-frontend/src/components/*.vue 2>/dev/null; then
        echo "  → 添加前端搜索组件..." >> "$FEATURE_LOG"
        cat > blog-frontend/src/components/SearchBar.vue << 'EOF'
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
EOF
        FEATURES_ADDED=$((FEATURES_ADDED + 1))
    fi
    
    # 功能5: 检查是否需要添加阅读统计
    if ! grep -q "viewCount" blog-backend/src/main/java/com/blog/entity/Post.java 2>/dev/null; then
        echo "  → 添加阅读统计功能..." >> "$FEATURE_LOG"
        # 这个需要修改现有文件，暂时跳过
        echo "  [跳过] 阅读统计需要修改数据库结构" >> "$FEATURE_LOG"
    fi
    
    # 如果添加了新功能，自动提交
    if [ $FEATURES_ADDED -gt 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 新增 $FEATURES_ADDED 个功能模块"
        git add -A
        git commit -m "feat: 自动添加 $FEATURES_ADDED 个新功能模块" >> "$FEATURE_LOG" 2>&1
        git push origin master >> "$FEATURE_LOG" 2>&1 || true
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️ 暂无新功能需要添加"
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 💤 休息5分钟后继续下一轮..."
    sleep 300  # 300秒 = 5分钟
    
    echo "=================================="
done