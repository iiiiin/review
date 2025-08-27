package ssafy.i13e206.feedback.dto;

public record Segment(
        double start,
        double end,
        String text,
        String intent
) {}