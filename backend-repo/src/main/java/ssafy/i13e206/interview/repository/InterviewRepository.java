package ssafy.i13e206.interview.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ssafy.i13e206.interview.entity.Interview;
import ssafy.i13e206.interview.entity.InterviewSet;
import ssafy.i13e206.user.entity.User;

public interface InterviewRepository extends JpaRepository<Interview, String> {
    @Query("SELECT i FROM Interview i JOIN i.questions q JOIN q.answerAttempts a WHERE a.id.answerAttemptUuid = :answerAttemptUuid")
    Optional<Interview> findByAnswerAttemptUuid(@Param("answerAttemptUuid") String answerAttemptUuid);

    Optional<Interview> findByUserAndInterviewUuid(User user, String uuid);

    @Query("SELECT i FROM Interview i " +
            "JOIN FETCH i.interviewSet is " +
            "JOIN FETCH is.recruit r " +
            "JOIN FETCH r.enterprise e " +
            "JOIN FETCH is.resume " +
            "LEFT JOIN FETCH is.portfolio " +
            "LEFT JOIN FETCH is.scriptFile " +
            "WHERE i.user = :user " +
            "ORDER BY i.createdAt DESC")
    List<Interview> findInterviewsWithDetailsByUser(@Param("user") User user);

    long countByUser(User user);

    @Query("SELECT COALESCE(SUM(FUNCTION('TIMESTAMPDIFF', SECOND, i.createdAt, i.finishedAt)), 0) " +
            "FROM Interview i " +
            "WHERE i.user = :user AND i.finishedAt IS NOT NULL")
    long findTotalPracticeSecondsByUser(@Param("user") User user);

    void deleteByUser(User user);

    List<Interview> findByUser(User user);

    List<Interview> findByInterviewSet(InterviewSet interviewSet);
}
