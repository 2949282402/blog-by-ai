package com.blog.mapper;

import com.blog.entity.Post;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface PostMapper {
    
    @Select("SELECT * FROM posts WHERE published = true ORDER BY created_at DESC")
    List<Post> findAllPublished();
    
    @Select("SELECT * FROM posts ORDER BY created_at DESC")
    List<Post> findAll();
    
    @Select("SELECT * FROM posts WHERE id = #{id}")
    Post findById(Long id);
    
    @Select("SELECT * FROM posts WHERE id = #{id} AND published = true")
    Post findByIdAndPublished(Long id);
    
    @Insert("INSERT INTO posts(title, content, summary, author, cover_image, view_count, published, created_at, updated_at) " +
            "VALUES(#{title}, #{content}, #{summary}, #{author}, #{coverImage}, #{viewCount}, #{published}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Post post);
    
    @Update("UPDATE posts SET title=#{title}, content=#{content}, summary=#{summary}, " +
            "author=#{author}, cover_image=#{coverImage}, view_count=#{viewCount}, " +
            "published=#{published}, updated_at=NOW() WHERE id=#{id}")
    int update(Post post);
    
    @Delete("DELETE FROM posts WHERE id = #{id}")
    int deleteById(Long id);
    
    @Update("UPDATE posts SET view_count = view_count + 1 WHERE id = #{id}")
    int incrementViewCount(Long id);
    
    @Select("SELECT * FROM posts WHERE title LIKE CONCAT('%', #{keyword}, '%') OR content LIKE CONCAT('%', #{keyword}, '%')")
    List<Post> searchByKeyword(String keyword);
}