package com.blog.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class RagQueryResult {
    private Long id;
    private String title;
    private String content;
    private double score;
}