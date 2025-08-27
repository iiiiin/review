package ssafy.i13e206.auth.dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class FindPasswordEmailResponseDto {
    String email;
    LocalDateTime sentAt;
}
