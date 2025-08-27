package ssafy.i13e206.user.dto.request;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import ssafy.i13e206.user.constant.LoginType;

@Data
public class SignupRequest {

    @Size(min = 6, max = 20, message = "아이디는 6~20자여야 합니다.")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{6,20}$",
            message = "아이디는 영문과 숫자를 모두 포함해야 하며, 6~20자여야 합니다."
    )
    private String id;

    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    @Pattern(
            regexp = "^(?:(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)|(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9])|(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9])|(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z0-9])).{8,}$",
            message = "비밀번호는 영문 대소문자, 숫자, 특수문자 중 3가지 이상 조합이어야 합니다."
    )
    private String password;

    @Email(message = "올바른 이메일 주소 형식이어야 합니다.")
    private String email;

    private String username;
    private LoginType loginType;
}
