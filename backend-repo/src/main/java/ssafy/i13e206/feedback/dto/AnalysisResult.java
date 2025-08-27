package ssafy.i13e206.feedback.dto;

import java.util.List;

public record AnalysisResult(
        List<Segment> segments,
        List<Expression> expressions
) {}