package ssafy.i13e206.interview.dto;

import lombok.Builder;
import lombok.Data;
import ssafy.i13e206.files.dto.response.FileListResponseDto;
import java.util.List;

@Data
@Builder
public class InterviewHistoryResponseDto {
    private int totalCount;
    private int thisMonthCount;
    private List<InterviewHistorySummaryDto> interviews;
}
