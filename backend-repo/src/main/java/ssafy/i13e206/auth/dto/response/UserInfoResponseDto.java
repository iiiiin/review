package ssafy.i13e206.auth.dto.response;


import lombok.Builder;
import lombok.Getter;
import ssafy.i13e206.user.constant.LoginType;

@Getter
@Builder
public class UserInfoResponseDto {
    private String id;
    private String username;
    private String accessToken;
    private LoginType loginType;
}