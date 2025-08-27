package ssafy.i13e206.openvidu.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ssafy.i13e206.interview.dto.AttemptResponseDto;
import ssafy.i13e206.interview.service.AnswerAttemptService;
import ssafy.i13e206.openvidu.dto.RecordingResponse;
import ssafy.i13e206.openvidu.dto.StartRecordingRequest;
import ssafy.i13e206.openvidu.dto.StartRecordingResponseDto;
import ssafy.i13e206.openvidu.dto.StopRecordingRequest;
import ssafy.i13e206.openvidu.service.RecordingService;
import ssafy.i13e206.user.entity.User;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recordings")
public class RecordingController {

    private final RecordingService recordingService;

    /**
     * 특정 면접(질문 또는 PT)에 대한 답변 시도를 생성하고, 세션 녹화를 시작
     */
    @PostMapping("/start")
    public ResponseEntity<StartRecordingResponseDto> startRecording(
            @RequestBody StartRecordingRequest request
    ) {
        StartRecordingResponseDto response = recordingService.createAttemptAndStartRecording(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 특정 녹화를 중지
     */
    @PostMapping("/stop")
    public ResponseEntity<Void> stopRecording(@RequestBody StopRecordingRequest request
    ) {
        recordingService.stopRecording(request.getRecordingId());
        return ResponseEntity.ok().build();
    }
}
