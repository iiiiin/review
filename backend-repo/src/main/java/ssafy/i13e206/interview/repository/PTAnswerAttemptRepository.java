package ssafy.i13e206.interview.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;
import ssafy.i13e206.interview.entity.*;

import java.util.List;
import java.util.Optional;

@Repository
public interface PTAnswerAttemptRepository extends JpaRepository<PTAnswerAttempt, PTAnswerAttemptId> {
    List<PTAnswerAttempt> findByPtInterviewOrderById_AttemptNumber(PTInterview ptInterview);
    long countByPtInterview(PTInterview ptInterview);
    Optional<PTAnswerAttempt> findTopByPtInterview_PtUuidOrderById_AttemptNumberDesc(String ptUuid);
    @EntityGraph(attributePaths = {"ptInterview", "ptInterview.interview", "ptInterview.interview.user"})
    Optional<PTAnswerAttempt> findById(PTAnswerAttempt id);
    @EntityGraph(attributePaths = {"ptInterview", "ptInterview.interview", "ptInterview.interview.user"})
    Optional<PTAnswerAttempt> findTopById_PtAnswerAttemptUuidOrderById_AttemptNumberDesc(String ptAnswerAttemptUuid);

    List<PTAnswerAttempt> findByPtInterview(PTInterview ptInterview);
}
