package ssafy.i13e206.kafka.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import ssafy.i13e206.feedback.dto.AnalysisResultRequest;
import ssafy.i13e206.feedback.service.AnalysisResultService;
import ssafy.i13e206.global.service.WebSocketService;
import ssafy.i13e206.kafka.dto.TranscriptMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final ObjectMapper objectMapper;
    private final AnalysisResultService analysisResultService;
    private final WebSocketService webSocketService;

    @KafkaListener(topics = "analysis-result-topic", groupId = "interview-group")
    public void consumeAnalysisResult(String message) {
        try {
            log.info("KAFKA >> 분석 결과 수신: {}", message);
            AnalysisResultRequest result = objectMapper.readValue(message, AnalysisResultRequest.class);
            String modelAnswer = analysisResultService.saveAnalysisResult(result);
            AnalysisResultRequest enrichedResult = new AnalysisResultRequest(result.recordingId(), result.transcript(), result.analysisResult(), modelAnswer);

            webSocketService.sendAnalysisResult(enrichedResult);
        } catch (Exception e) {
            log.error("Failed to process message from Kafka", e);
        }
    }

    @KafkaListener(topics = "transcript-topic", groupId = "interview-group")
    public void consumeTranscript(String message) {
        try {
            log.info("KAFKA >> 전사 결과 수신: {}", message);
            TranscriptMessage transcriptMsg = objectMapper.readValue(message, TranscriptMessage.class);
            log.info("전사 결과 : {}", transcriptMsg);

            webSocketService.sendTranscript(transcriptMsg);
        } catch (Exception e) {
            log.error("Failed to process transcript message from Kafka", e);
        }
    }
}