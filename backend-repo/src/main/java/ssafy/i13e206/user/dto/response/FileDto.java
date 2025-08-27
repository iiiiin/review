package ssafy.i13e206.user.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FileDto {
    private String fileUuid;
    private String fileType;
    private String company;
    private String job;
    private String fileUrl;
    private String fileName;
    private String uploadedAt;
}
