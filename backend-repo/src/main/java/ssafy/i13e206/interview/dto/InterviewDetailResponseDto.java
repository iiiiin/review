package ssafy.i13e206.interview.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import ssafy.i13e206.interview.entity.enums.InterviewType;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InterviewDetailResponseDto {
    private String interviewUuid;
    private String enterpriseName;
    private String position;
    private InterviewType interviewType;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime createdAt;
    private String duration;

    private List<PTInterviewDetailResponseDto> ptInterviews;

    private int questionCount;
    private List<QuestionDto> questions;
}