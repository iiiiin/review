package ssafy.i13e206.auth.dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class PasswordVerifyCodeResponseDto {

    String email;

    boolean isVerified;
}
