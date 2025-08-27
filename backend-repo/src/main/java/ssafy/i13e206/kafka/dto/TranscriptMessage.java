package ssafy.i13e206.kafka.dto;

public record TranscriptMessage(
        String answerAttemptUuid,
        String transcript
) {}