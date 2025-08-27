package ssafy.i13e206.user.dto.request;

import lombok.Data;

@Data
public class EmailVerificationRequest {
    private String email;
    private String code;
}
