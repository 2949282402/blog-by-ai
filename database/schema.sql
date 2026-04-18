-- ============================================
-- 博客系统数据库初始化脚本
-- 版本: v2.0
-- 数据库: MySQL 8.0
-- 更新时间: 2026-04-18
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS blog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE blog;

-- ============================================
-- 1. 用户表（预留）
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255),
    email VARCHAR(100) UNIQUE,
    nickname VARCHAR(100),
    avatar VARCHAR(500),
    role VARCHAR(20) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 文章表
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '文章标题',
    content LONGTEXT COMMENT '文章内容',
    summary TEXT COMMENT '文章摘要',
    author VARCHAR(100) COMMENT '作者',
    cover_image VARCHAR(500) COMMENT '封面图',
    view_count INT DEFAULT 0 COMMENT '阅读数',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    published BOOLEAN DEFAULT TRUE COMMENT '是否发布',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_published (published),
    INDEX idx_author (author),
    FULLTEXT INDEX ft_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- ============================================
-- 3. 分类表
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '分类名称',
    slug VARCHAR(100) UNIQUE COMMENT 'URL别名',
    description VARCHAR(500) COMMENT '分类描述',
    parent_id BIGINT DEFAULT NULL COMMENT '父分类ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_id),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ============================================
-- 4. 文章分类关联表
-- ============================================
CREATE TABLE IF NOT EXISTS post_categories (
    post_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章分类关联表';

-- ============================================
-- 5. 标签表
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- ============================================
-- 6. 文章标签关联表
-- ============================================
CREATE TABLE IF NOT EXISTS post_tags (
    post_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章标签关联表';

-- ============================================
-- 7. 评论表
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    parent_id BIGINT DEFAULT NULL COMMENT '父评论ID',
    author VARCHAR(100) NOT NULL COMMENT '评论者',
    email VARCHAR(100),
    content TEXT NOT NULL COMMENT '评论内容',
    user_ip VARCHAR(50) COMMENT '用户IP',
    user_agent VARCHAR(500) COMMENT '浏览器信息',
    status TINYINT DEFAULT 1 COMMENT '状态：0待审，1已发布，2垃圾',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_post (post_id),
    INDEX idx_parent (parent_id),
    INDEX idx_status (status),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ============================================
-- 8. 点赞表
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_ip VARCHAR(50) NOT NULL COMMENT '用户IP',
    user_agent VARCHAR(500) COMMENT '浏览器信息',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (post_id, user_ip),
    INDEX idx_post (post_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- ============================================
-- 9. 友情链接表
-- ============================================
CREATE TABLE IF NOT EXISTS links (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    description VARCHAR(500),
    logo VARCHAR(500),
    sort_order INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='友情链接表';

-- ============================================
-- 10. 系统配置表
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================
-- 初始化数据
-- ============================================

-- 插入默认分类
INSERT INTO categories (name, slug, description) VALUES
('技术分享', 'tech', '技术相关文章'),
('生活随笔', 'life', '生活感悟'),
('项目管理', 'pm', '项目管理经验'),
('工具推荐', 'tools', '开发工具推荐')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 插入示例文章
INSERT INTO posts (title, content, author, summary, published) VALUES
('欢迎来到我的博客', '这是第一篇博客文章，使用 Spring Boot + Vue3 + MySQL + MyBatis 搭建。', '博主', '第一篇博客，系统介绍', TRUE),
('MyBatis 集成实践', '本文介绍如何在 Spring Boot 中集成 MyBatis，实现更好的 SQL 控制。', '博主', 'MyBatis 集成教程', TRUE),
('Docker 部署实践', '使用 Docker Compose 一键部署博客系统，简单高效。', '博主', 'Docker 部署指南', TRUE)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 插入系统配置
INSERT INTO settings (setting_key, setting_value, description) VALUES
('site_name', '我的博客', '网站名称'),
('site_description', 'Spring Boot + Vue3 + MyBatis 博客系统', '网站描述'),
('posts_per_page', '10', '每页文章数')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- ============================================
-- 创建数据库用户并授权
-- ============================================
CREATE USER IF NOT EXISTS 'blog_user'@'localhost' IDENTIFIED BY 'blog_pass_123';
CREATE USER IF NOT EXISTS 'blog_user'@'%' IDENTIFIED BY 'blog_pass_123';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'localhost';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;