package ssafy.i13e206.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SegmentDto {
    private float start;
    private float end;
    private String text;
    private String intent;
}
