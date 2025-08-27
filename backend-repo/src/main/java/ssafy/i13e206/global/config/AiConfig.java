package ssafy.i13e206.global.config;

import org.springframework.ai.document.MetadataMode;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.ai.openai.OpenAiEmbeddingOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.retry.RetryUtils;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.redis.RedisVectorStore;
import org.springframework.ai.vectorstore.redis.RedisVectorStore.MetadataField;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import redis.clients.jedis.JedisPooled;

@Configuration
public class AiConfig {

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;

    @Bean
    public JedisPooled jedisPooled() {
        return new JedisPooled(redisHost, redisPort);
    }

//    @Bean
//    public EmbeddingModel embeddingModel(
//            @Value("${spring.ai.openai.base-url}") String baseUrl,
//            @Value("${spring.ai.openai.api-key}") String apiKey,
//            @Value("${spring.ai.openai.embedding.options.model}") String embeddingModelName
//    ) {
//        RestClient.Builder restClientBuilder = RestClient.builder()
//                .defaultHeader("Content-Type", "application/json; charset=UTF-8");
//
//        var openAiApi = new OpenAiApi.Builder()
//                .apiKey(apiKey)
//                .baseUrl(baseUrl)
//                .restClientBuilder(restClientBuilder)
//                .build();
//
//        OpenAiEmbeddingOptions options = OpenAiEmbeddingOptions.builder()
//                .model(embeddingModelName)
//                .build();
//
//        return new OpenAiEmbeddingModel(
//                openAiApi,
//                MetadataMode.EMBED,
//                options,
//                RetryUtils.DEFAULT_RETRY_TEMPLATE);
//    }
//
//    @Bean
//    public VectorStore vectorStore(JedisPooled jedisPooled, EmbeddingModel embeddingModel) {
//        return RedisVectorStore.builder(jedisPooled, embeddingModel)
//                .indexName("userUploadedFile")
//                .prefix("file-embedding:")
//                .initializeSchema(true)
//                .metadataFields(
//                        MetadataField.tag("fileUuid"),
//                        MetadataField.tag("fileType"),
//                        MetadataField.tag("enterpriseName"),
//                        MetadataField.tag("position"),
//                        MetadataField.tag("userId")
//                )
//                .build();
//    }
}