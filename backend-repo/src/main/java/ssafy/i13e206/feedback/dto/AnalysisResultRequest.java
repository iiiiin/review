package ssafy.i13e206.feedback.dto;

public record AnalysisResultRequest(
        String recordingId,
        String transcript,
        AnalysisResult analysisResult,
        String modelAnswer
) {}
