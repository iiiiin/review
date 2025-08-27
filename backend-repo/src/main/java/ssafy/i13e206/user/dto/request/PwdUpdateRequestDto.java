package ssafy.i13e206.user.dto.request;

import lombok.Data;

@Data
public class PwdUpdateRequestDto {
    private String currentPassword;
    private String newPassword;
}
