package ssafy.i13e206.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class EmailSendResponse {
    private String email;
    private LocalDateTime sentAt;
}
