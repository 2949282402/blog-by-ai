package com.blog.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 文章实体（MyBatis版本）
 */
@Data
public class Post {
    private Long id;
    private String title;
    private String content;
    private String summary;
    private String author;
    private String coverImage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean published = true;
    private Integer viewCount = 0;
}