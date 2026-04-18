package com.blog.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PostDTO {
    private Long id;
    private String title;
    private String content;
    private String summary;
    private String author;
    private String coverImage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean published;
}