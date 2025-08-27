package ssafy.i13e206.openvidu.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import ssafy.i13e206.interview.dto.AttemptResponseDto;
import ssafy.i13e206.interview.service.AnswerAttemptService;
import ssafy.i13e206.openvidu.dto.RecordingResponse;
import ssafy.i13e206.openvidu.dto.StartRecordingRequest;
import ssafy.i13e206.openvidu.dto.StartRecordingResponseDto; // 반환 타입 DTO
import ssafy.i13e206.user.entity.User;

import java.util.Map;

@Service
@Slf4j
public class RecordingService {

    private final RestTemplate restTemplate;
    private final AnswerAttemptService answerAttemptService;
    private final String OPENVIDU_URL;
    private final String OPENVIDU_SECRET;

    public RecordingService(
            RestTemplate restTemplate,
            AnswerAttemptService answerAttemptService,
            @Value("${openvidu.url}") String openviduUrl,
            @Value("${openvidu.secret}") String openviduSecret
    ) {
        this.restTemplate = restTemplate;
        this.answerAttemptService = answerAttemptService;
        this.OPENVIDU_URL = openviduUrl;
        this.OPENVIDU_SECRET = openviduSecret;
    }

    public StartRecordingResponseDto createAttemptAndStartRecording(StartRecordingRequest request) {
        AttemptResponseDto attemptResponse = answerAttemptService.createAttempt(request.getInterviewId());
        String sessionId = attemptResponse.getSessionId();

        RecordingResponse recordingResponse = startOpenViduRecording(sessionId);

        return StartRecordingResponseDto.builder()
                .sessionId(sessionId)
                .recordingId(recordingResponse.getId())
                .build();
    }

    public RecordingResponse stopRecording(String recordingId) {
        String apiUrl = OPENVIDU_URL + "openvidu/api/recordings/stop/" + recordingId;
        log.info("{} 녹화를 중지합니다.", recordingId);

        HttpHeaders headers = createHeaders();
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<RecordingResponse> response = restTemplate.postForEntity(apiUrl, entity, RecordingResponse.class);
            log.info("녹화가 성공적으로 중지되었습니다.");
            return response.getBody();
        } catch (Exception e) {
            log.error("OpenVidu 녹화 중지에 실패했습니다.", e);
            throw new RuntimeException("녹화 중지에 실패했습니다: " + e.getMessage());
        }
    }

    private RecordingResponse startOpenViduRecording(String sessionId) {
        String apiUrl = OPENVIDU_URL + "openvidu/api/recordings/start";
        log.info("{} 세션의 녹화를 시작합니다.", sessionId);

        HttpHeaders headers = createHeaders();
        Map<String, Object> body = Map.of(
                "session", sessionId,
                "outputMode", "COMPOSED",
                "hasAudio", true,
                "hasVideo", true
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<RecordingResponse> response = restTemplate.postForEntity(apiUrl, entity, RecordingResponse.class);
            RecordingResponse recordingResponse = response.getBody();
            if (recordingResponse != null) {
                log.info("녹화가 성공적으로 시작되었습니다. Recording ID: {}", recordingResponse.getId());
                return recordingResponse;
            } else {
                throw new RuntimeException("녹화 시작 후 OpenVidu로부터 유효한 응답을 받지 못했습니다.");
            }
        } catch (Exception e) {
            log.error("OpenVidu 녹화 시작에 실패했습니다.", e);
            throw new RuntimeException("녹화 시작에 실패했습니다: " + e.getMessage());
        }
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth("OPENVIDUAPP", OPENVIDU_SECRET);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
