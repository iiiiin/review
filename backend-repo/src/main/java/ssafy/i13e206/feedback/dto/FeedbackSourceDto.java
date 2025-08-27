package ssafy.i13e206.feedback.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FeedbackSourceDto {
    @JsonProperty("sourceType")
    private final String sourceType;

    @JsonProperty("citedContent")
    private final String citedContent;
}