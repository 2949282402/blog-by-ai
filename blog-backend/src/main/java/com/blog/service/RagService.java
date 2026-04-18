package com.blog.service;

import com.blog.dto.RagQueryResult;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 轻量级RAG服务 - 基于TF-IDF相似度
 * 无需外部模型，纯Java实现
 */
@Service
public class RagService {
    
    private final PostService postService;
    private final Map<String, PostVector> vectorStore = new HashMap<>();
    private boolean isIndexed = false;
    
    public RagService(PostService postService) {
        this.postService = postService;
    }
    
    /**
     * 语义搜索 - 基于文本相似度
     */
    public List<RagQueryResult> semanticSearch(String query, int topK) {
        ensureIndexed();
        
        Map<String, Double> queryVector = buildTfVector(query);
        
        return vectorStore.values().stream()
            .map(post -> new RagQueryResult(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                cosineSimilarity(queryVector, post.getTfVector())
            ))
            .sorted(Comparator.comparingDouble(RagQueryResult::getScore).reversed())
            .limit(topK)
            .collect(Collectors.toList());
    }
    
    /**
     * 智能问答 - 基于检索+生成式回答
     */
    public String intelligentAnswer(String question) {
        ensureIndexed();
        
        // 1. 检索相关文档
        List<RagQueryResult> relevantDocs = semanticSearch(question, 3);
        
        if (relevantDocs.isEmpty() || relevantDocs.get(0).getScore() < 0.1) {
            return "抱歉，没有找到与问题相关的文章。请尝试用其他关键词提问。";
        }
        
        // 2. 构建上下文
        StringBuilder context = new StringBuilder();
        context.append("根据以下文章回答用户问题：\n\n");
        for (int i = 0; i < relevantDocs.size(); i++) {
            RagQueryResult doc = relevantDocs.get(i);
            context.append(String.format("[文章%d] %s\n%s\n\n", 
                i + 1, doc.getTitle(), doc.getContent().substring(0, Math.min(300, doc.getContent().length()))));
        }
        
        // 3. 生成回答（简化版：基于关键词匹配）
        return generateAnswer(question, relevantDocs);
    }
    
    /**
     * 重建索引
     */
    public void rebuildIndex() {
        vectorStore.clear();
        postService.getAllPosts().forEach(post -> {
            String text = post.getTitle() + " " + (post.getContent() != null ? post.getContent() : "");
            vectorStore.put(post.getId().toString(), 
                new PostVector(post.getId(), post.getTitle(), text, buildTfVector(text)));
        });
        isIndexed = true;
    }
    
    private void ensureIndexed() {
        if (!isIndexed) {
            rebuildIndex();
        }
    }
    
    private Map<String, Double> buildTfVector(String text) {
        Map<String, Integer> termFreq = new HashMap<>();
        String[] words = text.toLowerCase().split("\\W+");
        int totalTerms = 0;
        
        for (String word : words) {
            if (word.length() > 1 && !isStopWord(word)) {
                termFreq.put(word, termFreq.getOrDefault(word, 0) + 1);
                totalTerms++;
            }
        }
        
        Map<String, Double> tfVector = new HashMap<>();
        for (Map.Entry<String, Integer> entry : termFreq.entrySet()) {
            tfVector.put(entry.getKey(), (double) entry.getValue() / totalTerms);
        }
        
        return tfVector;
    }
    
    private double cosineSimilarity(Map<String, Double> vec1, Map<String, Double> vec2) {
        double dotProduct = 0;
        double norm1 = 0;
        double norm2 = 0;
        
        for (double v : vec1.values()) {
            norm1 += v * v;
        }
        for (double v : vec2.values()) {
            norm2 += v * v;
        }
        
        Set<String> commonTerms = new HashSet<>(vec1.keySet());
        commonTerms.retainAll(vec2.keySet());
        
        for (String term : commonTerms) {
            dotProduct += vec1.get(term) * vec2.get(term);
        }
        
        if (norm1 == 0 || norm2 == 0) return 0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
    
    private String generateAnswer(String question, List<RagQueryResult> docs) {
        StringBuilder answer = new StringBuilder();
        
        // 提取问题关键词
        Set<String> keywords = Arrays.stream(question.toLowerCase().split("\\W+"))
            .filter(w -> w.length() > 1 && !isStopWord(w))
            .collect(Collectors.toSet());
        
        answer.append("根据检索到的文章，我来回答您的问题：\n\n");
        
        // 提取最相关文档的关键句
        for (RagQueryResult doc : docs) {
            if (doc.getScore() > 0.3) {
                String[] sentences = doc.getContent().split("[。！？]");
                for (String sentence : sentences) {
                    for (String keyword : keywords) {
                        if (sentence.toLowerCase().contains(keyword) && sentence.length() > 10) {
                            answer.append("• ").append(sentence.trim()).append("\n");
                            break;
                        }
                    }
                }
            }
        }
        
        // 如果没有找到相关句子，给出参考
        if (answer.toString().equals("根据检索到的文章，我来回答您的问题：\n\n")) {
            answer.append("根据文章《").append(docs.get(0).getTitle()).append("》，相关内容如下：\n");
            answer.append(docs.get(0).getContent().substring(0, Math.min(200, docs.get(0).getContent().length())));
        }
        
        return answer.toString();
    }
    
    private boolean isStopWord(String word) {
        Set<String> stopWords = Set.of("的", "是", "了", "在", "有", "我", "他", "她", "它", "们",
            "这", "那", "之", "与", "或", "及", "和", "就", "都", "而", "从", "也", "到");
        return stopWords.contains(word);
    }
    
    private static class PostVector {
        private final Long id;
        private final String title;
        private final String content;
        private final Map<String, Double> tfVector;
        
        public PostVector(Long id, String title, String content, Map<String, Double> tfVector) {
            this.id = id;
            this.title = title;
            this.content = content;
            this.tfVector = tfVector;
        }
        
        public Long getId() { return id; }
        public String getTitle() { return title; }
        public String getContent() { return content; }
        public Map<String, Double> getTfVector() { return tfVector; }
    }
}