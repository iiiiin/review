package ssafy.i13e206.interview.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ssafy.i13e206.interview.dto.WebSocketMessage;
import ssafy.i13e206.interview.entity.AnswerAttempt;
import ssafy.i13e206.interview.entity.Interview;
import ssafy.i13e206.interview.entity.Question;
import ssafy.i13e206.interview.entity.enums.AttemptStatus;
import ssafy.i13e206.interview.repository.AnswerAttemptRepository;
import ssafy.i13e206.interview.repository.InterviewRepository;
import ssafy.i13e206.kafka.dto.AnalysisResult;
// import ssafy.i13e206.rag.RagQuestionGenerator;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewContinuationService {

    private final AnswerAttemptRepository answerAttemptRepository;
    private final InterviewRepository interviewRepository;
    private final SimpMessagingTemplate messagingTemplate;
    // private final RagQuestionGenerator ragQuestionGenerator;
    // private final FeedbackRepository feedbackRepository;

    @Transactional
    public void processAnalysisAndContinue(AnalysisResult result) {
        // 1. DB에 분석 결과 업데이트
        AnswerAttempt attempt = answerAttemptRepository.findById(result.answerAttemptUuid())
                .orElseThrow(() -> new RuntimeException("AnswerAttempt not found"));
        attempt.setStatus(AttemptStatus.COMPLETED);
        // feedbackRepository.save(new Feedback(..., result.transcript(), ...));
        answerAttemptRepository.save(attempt);
        log.info("DB 업데이트 완료: {}", result.answerAttemptUuid());

        // 2. 꼬리 질문 생성
        // Question nextQuestion = ragQuestionGenerator.createNextQuestion(result.transcript());
        
        // Mock 꼬리 질문 생성
        Interview interview = interviewRepository.findByAnswerAttemptUuid(result.answerAttemptUuid())
                .orElseThrow(() -> new RuntimeException("Interview not found"));
        
        Question nextQuestion = Question.builder()
                .questionUuid(UUID.randomUUID().toString())
                .interview(interview)
                .questionNumber(attempt.getQuestion().getQuestionNumber() + 1)
                .parent(attempt.getQuestion())
                .question("방금 하신 답변에서 ~에 대해 더 자세히 설명해주시겠어요?")
                .purpose("답변의 깊이를 확인하기 위함")
                .suggestedAnswer("...")
                .build();
        // questionRepository.save(nextQuestion);

        // 3. 웹소켓으로 프론트엔드에 알림 전송
        String destination = "/topic/interview/" + interview.getInterviewUuid();
        WebSocketMessage<Question> wsMessage = WebSocketMessage.<Question>builder()
                .type("NEXT_QUESTION_READY")
                .data(nextQuestion)
                .build();
        
        messagingTemplate.convertAndSend(destination, wsMessage);
        log.info("웹소켓 알림 전송: {} -> {}", destination, wsMessage.getType());
    }
}