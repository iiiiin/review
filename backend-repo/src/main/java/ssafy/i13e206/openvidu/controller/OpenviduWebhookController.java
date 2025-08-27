package ssafy.i13e206.openvidu.controller;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ssafy.i13e206.interview.entity.AnswerAttempt;
import ssafy.i13e206.interview.entity.PTAnswerAttempt;
import ssafy.i13e206.interview.entity.enums.AttemptStatus;
import ssafy.i13e206.interview.repository.AnswerAttemptRepository;
import ssafy.i13e206.interview.repository.PTAnswerAttemptRepository;
import ssafy.i13e206.kafka.service.KafkaProducerService;
import ssafy.i13e206.openvidu.service.OpenviduWebhookService;

import java.util.Optional;

@RestController
@RequestMapping("/openvidu-webhook")
@RequiredArgsConstructor
@Slf4j
public class OpenviduWebhookController {

    private final OpenviduWebhookService openviduWebhookService;

    @PostMapping
    public ResponseEntity<Void> handleWebhook(@RequestBody JsonNode payload) {
        openviduWebhookService.processRecordingReadyEvent(payload);
        return ResponseEntity.ok().build();
    }
}
