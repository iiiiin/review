package ssafy.i13e206.files.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FileResponseDto {
    private final String fileUuid;
    private final String fileUrl;
    private final String uploadedAt;
    private final String fileType;
}
