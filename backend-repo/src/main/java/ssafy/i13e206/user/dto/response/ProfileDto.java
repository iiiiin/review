package ssafy.i13e206.user.dto.response;

import lombok.Builder;
import lombok.Getter;
import ssafy.i13e206.user.constant.LoginType;

@Getter
@Builder
public class ProfileDto {
    private String id;
    private String email;
    private String username;
    private LoginType loginType;
}
