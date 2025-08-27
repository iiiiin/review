package ssafy.i13e206.feedback.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.feedback.entity.Feedback;
import ssafy.i13e206.feedback.entity.FeedbackSource;

public interface FeedbackSourceRepository extends JpaRepository<FeedbackSource, Long> {
    void deleteByFeedback(Feedback feedback);

}
