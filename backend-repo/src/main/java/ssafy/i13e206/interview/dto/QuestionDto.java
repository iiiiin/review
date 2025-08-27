package ssafy.i13e206.interview.dto;

import java.util.List;

public record QuestionDto(
        int questionNumber,
        String question,
        List<RetryDto> feedback
) {}