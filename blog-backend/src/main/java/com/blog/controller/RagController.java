package com.blog.controller;

import com.blog.dto.RagQueryResult;
import com.blog.service.RagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rag")
@CrossOrigin(origins = "*")
public class RagController {
    
    @Autowired
    private RagService ragService;
    
    /**
     * 语义搜索
     */
    @PostMapping("/search")
    public ResponseEntity<List<RagQueryResult>> semanticSearch(
            @RequestBody Map<String, Object> request) {
        String query = (String) request.get("query");
        int topK = request.containsKey("topK") ? (Integer) request.get("topK") : 5;
        
        List<RagQueryResult> results = ragService.semanticSearch(query, topK);
        return ResponseEntity.ok(results);
    }
    
    /**
     * 智能问答
     */
    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> ask(@RequestBody Map<String, String> request) {
        String question = request.get("question");
        String answer = ragService.intelligentAnswer(question);
        
        Map<String, String> response = new HashMap<>();
        response.put("question", question);
        response.put("answer", answer);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 重建索引
     */
    @PostMapping("/rebuild")
    public ResponseEntity<Map<String, String>> rebuildIndex() {
        ragService.rebuildIndex();
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "RAG索引重建完成");
        
        return ResponseEntity.ok(response);
    }
}