# 运维部署手册

**更新时间**: $(date '+%Y-%m-%d %H:%M:%S')

---

## 🐳 Docker部署（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 📦 手动部署

### 1. MySQL配置

```bash
service mysql start
mysql -u root << EOF
CREATE DATABASE blog;
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'blog_pass_123';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;
