package ssafy.i13e206.security.jwt;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@AllArgsConstructor
@Data
public class JwtToken {
    private String grantType; // JWT에 대한 인증 타입 (Bearer)
    private String accessToken;
    private String refreshToken;
}
