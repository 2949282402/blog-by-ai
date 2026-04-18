# 运维部署手册

## 🚀 快速启动

```bash
# 1. 启动后端
cd blog-backend
mvn clean package -DskipTests
java -jar target/blog-*.jar

# 2. 构建前端
cd blog-frontend
npm install
npm run build

# 3. 配置Nginx
sudo cp nginx.conf /etc/nginx/sites-available/blog
sudo service nginx reload
```

## 📋 持续优化流水线

```bash
# 启动持续优化
bash scripts/blog-continuous-pipeline.sh

# 查看实时日志
tail -f /tmp/blog-pipeline-*.log
```

## 🔍 监控

- 健康检查: `curl http://localhost:8081/actuator/health`
- 日志位置: `/tmp/blog-*.log`
- 报告目录: `docs/reports/`
