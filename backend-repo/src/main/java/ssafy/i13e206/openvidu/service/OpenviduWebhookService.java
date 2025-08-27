package ssafy.i13e206.openvidu.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ssafy.i13e206.interview.entity.AnswerAttempt;
import ssafy.i13e206.interview.entity.AnswerAttemptId;
import ssafy.i13e206.interview.entity.PTAnswerAttempt;
import ssafy.i13e206.interview.entity.PTAnswerAttemptId;
import ssafy.i13e206.interview.entity.enums.AttemptStatus;
import ssafy.i13e206.interview.repository.AnswerAttemptRepository;
import ssafy.i13e206.interview.repository.InterviewRepository;
import ssafy.i13e206.interview.repository.PTAnswerAttemptRepository;
import ssafy.i13e206.kafka.service.KafkaProducerService;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenviduWebhookService {

    private final AnswerAttemptRepository answerAttemptRepository;
    private final PTAnswerAttemptRepository ptAnswerAttemptRepository;
    private final InterviewRepository interviewRepository;
    private final KafkaProducerService kafkaProducerService;
    private static final String OPENVIDU_RECORDING_BASE_URL = "https://i13e206.p.ssafy.io:8442/openvidu/recordings/";
    private static final String RECORDING_FILE_BASE_PATH = "/home/ubuntu/openvidu_recordings/";

    @Transactional
    public void processRecordingReadyEvent(JsonNode payload) {
        String event = payload.path("event").asText();

        if (!"recordingStatusChanged".equals(event) || !"ready".equals(payload.path("status").asText())) {
            return;
        }

        String recordingID = payload.path("id").asText();
        String[] parts = recordingID.split("~");
        String sessionId = parts[0];
        int attemptNumber = (parts.length > 1) ? Integer.parseInt(parts[1]) + 1 : 1;

        log.info("Webhook 수신: sessionId={}, attemptNumber={}", sessionId, attemptNumber);

        String videoUrl = OPENVIDU_RECORDING_BASE_URL + recordingID + "/" + recordingID + ".mp4";
        String recordingFilePath = RECORDING_FILE_BASE_PATH + recordingID + "/" + recordingID + ".mp4";

        AnswerAttemptId attemptId = new AnswerAttemptId(sessionId, attemptNumber);
        Optional<AnswerAttempt> answerAttemptOptional = answerAttemptRepository.findById(attemptId);

        if (answerAttemptOptional.isPresent()) {
            updateAttemptAndSendKafka(answerAttemptOptional.get(), videoUrl, recordingFilePath, recordingID);
        } else {
            PTAnswerAttemptId ptAttemptId = new PTAnswerAttemptId(sessionId, attemptNumber);
            ptAnswerAttemptRepository.findById(ptAttemptId)
                    .ifPresentOrElse(
                            ptAttempt -> updateAttemptAndSendKafka(ptAttempt, videoUrl, recordingFilePath, recordingID),
                            () -> log.error("웹훅 수신 오류: 해당하는 면접 시도를 찾을 수 없습니다. RecordingId: {}", recordingID)
                    );
        }
    }

    /**
     * 일반/직무 면접 답변의 상태를 업데이트하고 Kafka 메시지를 전송
     */
    private void updateAttemptAndSendKafka(AnswerAttempt attempt, String videoUrl, String filePath, String recordingIdForKafka) {
        attempt.setStatus(AttemptStatus.PROCESSING);
        attempt.setVideoPath(videoUrl);
        attempt.getQuestion().getInterview().setFinishedAt(LocalDateTime.now());
        log.info("일반 면접 영상 분석 요청 발행: {}", recordingIdForKafka);
        kafkaProducerService.sendAnalysisRequest(recordingIdForKafka, filePath);
    }

    /**
     * PT 면접 답변의 상태를 업데이트하고 Kafka 메시지를 전송
     */
    private void updateAttemptAndSendKafka(PTAnswerAttempt ptAttempt, String videoUrl, String filePath, String recordingIdForKafka) {
        ptAttempt.setStatus(AttemptStatus.PROCESSING);
        ptAttempt.setVideoPath(videoUrl);
        ptAttempt.getPtInterview().getInterview().setFinishedAt(LocalDateTime.now());
        log.info("PT 면접 영상 분석 요청 발행: {}", recordingIdForKafka);
        kafkaProducerService.sendAnalysisRequest(recordingIdForKafka, filePath);
    }
}
