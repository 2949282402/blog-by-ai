# Spring Boot 后端 Dockerfile
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# 复制 Maven 构建产物
COPY target/blog-backend-1.0.0.jar app.jar

# 暴露端口
EXPOSE 8081

# 启动命令
ENTRYPOINT ["java", "-jar", "app.jar"]