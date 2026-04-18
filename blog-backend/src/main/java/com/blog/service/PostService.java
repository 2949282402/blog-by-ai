package com.blog.service;

import com.blog.dto.PostDTO;
import com.blog.entity.Post;
import com.blog.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {
    
    @Autowired
    private PostRepository postRepository;
    
    public List<PostDTO> getAllPosts() {
        return postRepository.findByPublishedTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public PostDTO getPostById(Long id) {
        Post post = postRepository.findByIdAndPublishedTrue(id);
        return post != null ? toDTO(post) : null;
    }
    
    public PostDTO createPost(PostDTO postDTO) {
        Post post = toEntity(postDTO);
        Post saved = postRepository.save(post);
        return toDTO(saved);
    }
    
    public PostDTO updatePost(Long id, PostDTO postDTO) {
        Post existing = postRepository.findById(id).orElse(null);
        if (existing != null) {
            existing.setTitle(postDTO.getTitle());
            existing.setContent(postDTO.getContent());
            existing.setSummary(postDTO.getSummary());
            existing.setAuthor(postDTO.getAuthor());
            existing.setCoverImage(postDTO.getCoverImage());
            existing.setPublished(postDTO.getPublished());
            Post updated = postRepository.save(existing);
            return toDTO(updated);
        }
        return null;
    }
    
    public void deletePost(Long id) {
        postRepository.deleteById(id);
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