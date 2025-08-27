package ssafy.i13e206.global.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ssafy.i13e206.feedback.dto.AnalysisResultRequest;
import ssafy.i13e206.interview.entity.AnswerAttempt;
import ssafy.i13e206.interview.entity.AnswerAttemptId;
import ssafy.i13e206.interview.entity.PTAnswerAttempt;
import ssafy.i13e206.interview.entity.PTAnswerAttemptId;
import ssafy.i13e206.interview.repository.AnswerAttemptRepository;
import ssafy.i13e206.interview.repository.PTAnswerAttemptRepository;
import ssafy.i13e206.kafka.dto.TranscriptMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final AnswerAttemptRepository answerAttemptRepository;
    private final PTAnswerAttemptRepository ptAnswerAttemptRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public void sendAnalysisResult(AnalysisResultRequest result) {
        log.info("분석 결과 전송: {}", result.toString());
        String recordingId = result.recordingId();
        String[] parts = recordingId.split("~");
        String sessionId = parts[0];
        int attemptNumber = (parts.length > 1) ? Integer.parseInt(parts[1]) + 1 : 1;

        String userUuid = resolveUserUuid(sessionId, attemptNumber);
        if (userUuid != null) {
            log.info("{}에게 분석 결과 전송",userUuid);
            messagingTemplate.convertAndSend("/topic/users/" + userUuid + "/analysis-results", result);
        } else {
            // fallback: 브로드캐스트
            messagingTemplate.convertAndSend("/topic/analysis-results", result);
        }
    }

    @Transactional(readOnly = true)
    public void sendTranscript(TranscriptMessage transcript) {
        log.info("전사 결과 전송: {}", transcript.toString());
        String recordingId = transcript.answerAttemptUuid();
        String[] parts = recordingId.split("~");
        String sessionId = parts[0];
        int attemptNumber = (parts.length > 1) ? Integer.parseInt(parts[1]) + 1 : 1;
        String userUuid = resolveUserUuid(sessionId, attemptNumber);
        if (userUuid != null) {
            log.info("{}에게 전사 결과 전송",userUuid);
            messagingTemplate.convertAndSend("/topic/users/" + userUuid + "/transcript-results", transcript);
        } else {
            // fallback: 브로드캐스트
            messagingTemplate.convertAndSend("/topic/transcript-results", transcript);
        }
    }

    private String resolveUserUuid(String sessionId, int attemptNumber) {
        // 일반/직무 면접 시도 탐색
        AnswerAttemptId answerAttemptId = new AnswerAttemptId(sessionId, attemptNumber);
        return answerAttemptRepository.findById(answerAttemptId)
                .map(AnswerAttempt::getQuestion)
                .map(q -> q.getInterview().getUser().getUserUuid())
                .orElseGet(() -> {
                    // PT 면접 시도 탐색
                    PTAnswerAttemptId ptId = new PTAnswerAttemptId(sessionId, attemptNumber);
                    return ptAnswerAttemptRepository.findById(ptId)
                            .map(PTAnswerAttempt::getPtInterview)
                            .map(pt -> pt.getInterview().getUser().getUserUuid())
                            .orElse(null);
                });
    }
}
