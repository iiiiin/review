package ssafy.i13e206.user.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MyPageResponseDto {
    private ProfileDto profile;
    private SummaryDto summary;
    private List<FileDto> file;
}
