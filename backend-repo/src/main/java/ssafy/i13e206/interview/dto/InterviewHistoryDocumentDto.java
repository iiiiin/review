package ssafy.i13e206.interview.dto;

import lombok.Builder;
import lombok.Data;
import ssafy.i13e206.files.constant.FileType;
import ssafy.i13e206.files.dto.response.FileListResponseDto;
import ssafy.i13e206.interview.entity.enums.InterviewType;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class InterviewHistoryDocumentDto {
    private String fileUuid;
    private FileType fileType;
    private String fileUrl;

}
