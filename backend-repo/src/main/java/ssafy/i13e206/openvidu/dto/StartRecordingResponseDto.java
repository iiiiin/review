package ssafy.i13e206.openvidu.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StartRecordingResponseDto {
    private String sessionId;
    private String recordingId;
}
