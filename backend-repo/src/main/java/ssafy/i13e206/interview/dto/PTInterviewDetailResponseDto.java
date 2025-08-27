package ssafy.i13e206.interview.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ssafy.i13e206.interview.entity.enums.InterviewType;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
public class PTInterviewDetailResponseDto {
    private String title;
    private String situation;
    private String enterpriseName;
    private String position;
    private InterviewType interviewType;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime createdAt;
    private String time;
    private int questionCount;
    private int retryCount;
    private List<RetryDto> retry;
    private List<QuestionDto> questions;

    public PTInterviewDetailResponseDto(String title,
                                        String situation,
                                        String enterpriseName,
                                        String position,
                                        InterviewType interviewType,
                                        LocalDateTime createdAt,
                                        String time,
                                        int questionCount,
                                        int retryCount,
                                        List<RetryDto> retry,
                                        List<QuestionDto> questions) {
        this.title = title;
        this.situation = situation;
        this.enterpriseName = enterpriseName;
        this.position = position;
        this.interviewType = interviewType;
        this.createdAt = createdAt;
        this.time = time;
        this.questionCount = questionCount;
        this.retryCount = retryCount;
        this.retry = retry;
        this.questions = questions;
    }

}
