package ssafy.i13e206.feedback.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ssafy.i13e206.feedback.entity.Feedback;
import ssafy.i13e206.interview.entity.AnswerAttempt;
import ssafy.i13e206.interview.entity.PTAnswerAttempt;

import java.util.Optional;

@Repository
public interface FeedbackResultRepository extends JpaRepository<Feedback, String> {
    Optional<Feedback> findByPtAnswerAttempt_Id_PtAnswerAttemptUuidAndPtAnswerAttempt_Id_AttemptNumber(
            String ptAnswerAttemptUuid, int attemptNumber
    );

    Optional<Feedback> findByAnswerAttempt_Id_AnswerAttemptUuidAndAnswerAttempt_Id_AttemptNumber(
            String answerAttemptUuid, int attemptNumber
    );
    // 일반 답변 시도에 딸린 피드백
    void deleteByAnswerAttempt(AnswerAttempt answerAttempt);
    // PT 답변 시도에 딸린 피드백
    void deleteByPtAnswerAttempt(PTAnswerAttempt ptAnswerAttempt);


}