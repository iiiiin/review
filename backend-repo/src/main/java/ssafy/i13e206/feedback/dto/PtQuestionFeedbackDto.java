package ssafy.i13e206.feedback.dto;

import lombok.Builder;
import lombok.Getter;
// 통합된 단일 FeedbackRepository를 import 합니다.
import ssafy.i13e206.feedback.repository.FeedbackResultRepository;
import ssafy.i13e206.interview.entity.AnswerAttempt;
import ssafy.i13e206.interview.entity.Question;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class PtQuestionFeedbackDto {
    private String questionUuid;
    private String question;
    private String intent;
    private FeedbackDto feedback;
    private List<PtQuestionFeedbackDto> followUpQuestions;

    public static PtQuestionFeedbackDto of(
            Question question,
            List<Question> allQuestions,
            FeedbackResultRepository feedbackRepository,
            AnswerAttempt targetAttempt) {

        // follow-up(꼬리) 질문 재귀 구성
        List<PtQuestionFeedbackDto> followUps = allQuestions.stream()
                .filter(q -> question.getQuestionUuid().equals(
                        q.getParent() != null ? q.getParent().getQuestionUuid() : null))
                .map(followUp -> PtQuestionFeedbackDto.of(followUp, allQuestions, feedbackRepository, targetAttempt))
                .collect(Collectors.toList());

        FeedbackDto feedback = feedbackRepository.findByAnswerAttempt_Id_AnswerAttemptUuidAndAnswerAttempt_Id_AttemptNumber(
                        targetAttempt.getId().getAnswerAttemptUuid(),
                        targetAttempt.getId().getAttemptNumber()
                )
                .map(FeedbackDto::of)
                .orElse(null);

        return PtQuestionFeedbackDto.builder()
                .questionUuid(question.getQuestionUuid())
                .question(question.getQuestion())
                .intent(question.getPurpose())
                .feedback(feedback)
                .followUpQuestions(followUps)
                .build();
    }

}