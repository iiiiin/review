package ssafy.i13e206.interview.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import ssafy.i13e206.interview.entity.enums.InterviewType;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class InterviewHistorySummaryDto {
    private String interviewUuid;
    private InterviewType InterviewType;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime createdAt;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime finishedAt;
    private String enterpriseName;
    private String position;
    private int questionCount;
    private List<InterviewHistoryDocumentDto> files;
}
