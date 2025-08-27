package ssafy.i13e206.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EmailVerificationResponse {
    String email;
    boolean isVerified;
}
