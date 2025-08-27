package ssafy.i13e206.interview.repository;

import io.lettuce.core.Value;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.interview.entity.AnswerAttempt;
import ssafy.i13e206.interview.entity.AnswerAttemptId;
import ssafy.i13e206.interview.entity.Question;
import java.util.List;
import java.util.Optional;

public interface AnswerAttemptRepository extends JpaRepository<AnswerAttempt, String> {

    boolean existsByQuestion(Question question);
    long countByQuestion(Question question);

    List<AnswerAttempt> findByQuestion_QuestionUuidOrderById_AttemptNumber(String questionQuestionUuid);
    Optional<AnswerAttempt> findTopByQuestion_QuestionUuidOrderById_AttemptNumberDesc(String questionUuid);


    @EntityGraph(attributePaths = {"question", "question.interview", "question.interview.user"})
    Optional<AnswerAttempt> findById(AnswerAttemptId answerAttemptId);

    @EntityGraph(attributePaths = {"question", "question.interview", "question.interview.user"})
    Optional<AnswerAttempt> findTopById_AnswerAttemptUuidOrderById_AttemptNumberDesc(String answerAttemptUuid);

    List<AnswerAttempt> findByQuestion(Question question);
}