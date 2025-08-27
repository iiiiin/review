package ssafy.i13e206.openvidu.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecordingResponse {
    private String id;
    private String sessionId;
    private String recordingId;
    private String status;
    private long duration;
    private String url;
}