package ssafy.i13e206.interview.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy.i13e206.interview.entity.Interview;
import ssafy.i13e206.interview.entity.Question;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, String> {
    List<Question> findByInterview_InterviewUuidOrderByQuestionNumber(String interviewInterviewUuid);

    List<Question> findByParent_QuestionUuidOrderByQuestionNumberAsc(String parentQuestionUuid);

    List<Question> findByInterview_InterviewUuidOrderByQuestionNumberAsc(String interviewInterviewUuid);

    // 루트 질문 (parent_uuid IS NULL) 만 가져오기
    List<Question> findByInterviewAndParentIsNull(Interview interview);    // 특정 질문의 자식(후속) 질문 가져오기
    List<Question> findByParent(Question parent);
}
