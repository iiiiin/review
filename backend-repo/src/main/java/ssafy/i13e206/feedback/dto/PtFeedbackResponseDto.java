package ssafy.i13e206.feedback.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PtFeedbackResponseDto {
    private String interviewUuid;
    private String ptTitle;
    private String ptSituation;
    private List<PtPresentationFeedbackDto> presentationFeedbacks; // PT 발표에 대한 피드백
//    private List<PtQuestionFeedbackDto> questionFeedbacks; // PT 후속 질문들에 대한 피드백
}