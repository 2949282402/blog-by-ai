package com.blog.service;

import com.blog.dto.PostDTO;
import com.blog.entity.Post;
import com.blog.mapper.PostMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {
    
    @Autowired
    private PostMapper postMapper;
    
    public List<PostDTO> getAllPosts() {
        return postMapper.findAllPublished().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public PostDTO getPostById(Long id) {
        Post post = postMapper.findByIdAndPublished(id);
        return post != null ? toDTO(post) : null;
    }
    
    public PostDTO createPost(PostDTO postDTO) {
        Post post = toEntity(postDTO);
        postMapper.insert(post);
        return toDTO(post);
    }
    
    public PostDTO updatePost(Long id, PostDTO postDTO) {
        Post existing = postMapper.findById(id);
        if (existing != null) {
            existing.setTitle(postDTO.getTitle());
            existing.setContent(postDTO.getContent());
            existing.setSummary(postDTO.getSummary());
            existing.setAuthor(postDTO.getAuthor());
            existing.setCoverImage(postDTO.getCoverImage());
            existing.setPublished(postDTO.getPublished());
            postMapper.update(existing);
            return toDTO(existing);
        }
        return null;
    }
    
    public void deletePost(Long id) {
        postMapper.deleteById(id);
    }
    
    public void incrementViewCount(Long id) {
        postMapper.incrementViewCount(id);
    }
    
    public List<PostDTO> searchPosts(String keyword) {
        return postMapper.searchByKeyword(keyword).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    private PostDTO toDTO(Post post) {
        PostDTO dto = new PostDTO();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setSummary(post.getSummary());
        dto.setAuthor(post.getAuthor());
        dto.setCoverImage(post.getCoverImage());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());
        dto.setPublished(post.getPublished());
        return dto;
    }
    
    private Post toEntity(PostDTO dto) {
        Post post = new Post();
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setSummary(dto.getSummary());
        post.setAuthor(dto.getAuthor());
        post.setCoverImage(dto.getCoverImage());
        if (dto.getPublished() != null) {
            post.setPublished(dto.getPublished());
        }
        return post;
    }
}