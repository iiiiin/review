package ssafy.i13e206.company.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class EnterpriseListResponseDto {
    private String enterpriseUuid;
    private String enterpriseName;
}
