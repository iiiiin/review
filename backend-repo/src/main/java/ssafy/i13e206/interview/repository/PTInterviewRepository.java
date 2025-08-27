package ssafy.i13e206.interview.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ssafy.i13e206.interview.entity.Interview;
import ssafy.i13e206.interview.entity.PTInterview;
import ssafy.i13e206.user.entity.User;

import java.util.List;
import java.util.Optional;

public interface PTInterviewRepository extends JpaRepository<PTInterview, String> {
    List<PTInterview> findByInterview(Interview interview);

    Optional<PTInterview> findByInterview_InterviewUuid(String interviewUuid);

    List<PTInterview> findAllByInterview_InterviewUuidOrderByCreatedAtDesc(String interviewUuid);
    List<PTInterview> findAllByInterview_InterviewUuidOrderByCreatedAtAsc(String interviewUuid);
    Optional<PTInterview> findTopByInterviewOrderByCreatedAtDesc(Interview interview);
}
