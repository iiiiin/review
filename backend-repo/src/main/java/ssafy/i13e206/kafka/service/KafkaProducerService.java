package ssafy.i13e206.kafka.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import ssafy.i13e206.kafka.dto.AnalysisRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void sendAnalysisRequest(String answerAttemptUuid, String videoPath) {
        try {
            AnalysisRequest request = new AnalysisRequest(answerAttemptUuid, videoPath);
            String jsonMessage = objectMapper.writeValueAsString(request);
            
            log.info("KAFKA << 분석 요청 발행: {}", jsonMessage);
            kafkaTemplate.send("analysis-request-topic", jsonMessage);
        } catch (Exception e) {
            log.error("Failed to send message to Kafka", e);
        }
    }
}