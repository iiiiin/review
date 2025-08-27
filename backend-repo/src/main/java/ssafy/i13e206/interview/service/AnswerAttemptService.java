package ssafy.i13e206.interview.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ssafy.i13e206.interview.dto.AttemptResponseDto;
import ssafy.i13e206.interview.entity.*;
import ssafy.i13e206.interview.entity.enums.AttemptStatus;
import ssafy.i13e206.interview.repository.AnswerAttemptRepository;
import ssafy.i13e206.interview.repository.PTAnswerAttemptRepository;
import ssafy.i13e206.interview.repository.PTInterviewRepository;
import ssafy.i13e206.interview.repository.QuestionRepository;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnswerAttemptService {

    private final QuestionRepository questionRepository;
    private final AnswerAttemptRepository answerAttemptRepository;
    private final PTInterviewRepository ptInterviewRepository;
    private final PTAnswerAttemptRepository ptAnswerAttemptRepository;

    @Transactional
    public AttemptResponseDto createAttempt(String id) {
        Optional<Question> questionOptional = questionRepository.findById(id);

        if (questionOptional.isPresent()) {
            // --- 일반/직무 면접 답변 시도 생성 ---
            Question question = questionOptional.get();

            long attemptCount = answerAttemptRepository.countByQuestion(question);
            int nextAttemptNumber = (int) attemptCount + 1;
            AnswerAttemptId attemptId = AnswerAttemptId.builder()
                    .answerAttemptUuid(id)
                    .attemptNumber(nextAttemptNumber)
                    .build();

            AnswerAttempt attempt = AnswerAttempt.builder()
                    .id(attemptId)
                    .question(question)
                    .status(AttemptStatus.PENDING)
                    .build();
            answerAttemptRepository.save(attempt);

            return AttemptResponseDto.builder()
                    .sessionId(attempt.getId().getAnswerAttemptUuid())
                    .build();
        } else {
            Optional<PTInterview> ptInterviewOptional = ptInterviewRepository.findById(id);

            if (ptInterviewOptional.isPresent()) {
                // --- PT 면접 답변 시도 생성 ---
                PTInterview ptInterview = ptInterviewOptional.get();
                long attemptCount = ptAnswerAttemptRepository.countByPtInterview(ptInterview);
                int nextAttemptNumber = (int) attemptCount + 1;

                PTAnswerAttemptId ptAttemptId = PTAnswerAttemptId.builder()
                        .ptAnswerAttemptUuid(id)
                        .attemptNumber(nextAttemptNumber)
                        .build();

                PTAnswerAttempt ptAttempt = PTAnswerAttempt.builder()
                        .id(ptAttemptId)
                        .ptInterview(ptInterview)
                        .status(AttemptStatus.PENDING)
                        .build();
                ptAnswerAttemptRepository.save(ptAttempt);

                return AttemptResponseDto.builder()
                        .sessionId(ptAttempt.getId().getPtAnswerAttemptUuid())
                        .build();
            } else {
                throw new IllegalArgumentException("유효하지 않은 질문 또는 PT 면접 UUID 입니다: " + id);
            }
        }
    }
}
