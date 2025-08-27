package ssafy.i13e206.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponseDto {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private UserInfo userInfo;
    private String loginType;

    @Getter
    @Builder
    public static class UserInfo {
        private String id;
        private String username;
    }
}
