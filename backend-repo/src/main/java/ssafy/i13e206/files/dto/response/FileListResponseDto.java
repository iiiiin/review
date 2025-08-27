package ssafy.i13e206.files.dto.response;


import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FileListResponseDto {
    private String fileUuid;
    private String fileType;
    private String company;
    private String job;
    private String fileUrl;
    private String uploadedAt;
}
