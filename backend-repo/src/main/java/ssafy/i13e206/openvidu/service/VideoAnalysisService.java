package ssafy.i13e206.openvidu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j // Lombok을 사용하여 로그 기능 활성화
public class VideoAnalysisService {

    @Value("${fastapi.url}")
    private String fastapiUrl;

    private final ObjectMapper objectMapper; // JSON 직렬화를 위해 주입 (Spring이 자동 빈으로 등록)

    /**
     * @param recordingId       OpenVidu 녹화 ID (녹화 파일명 및 폴더명 구성에 사용)
     * @param sessionId         OpenVidu 세션 ID (분석 결과와 면접 데이터를 연결하는 데 사용)
     * @param videoFilePath     분석할 MP4 비디오 파일의 서버 절대 경로 (FastAPI에 전달)
     */
    @Async
    public void requestAnalysis(String recordingId, String sessionId, String videoFilePath) {
        // 분석 요청 시작을 알리는 로그
        log.info("[{}] FastAPI 분석 요청 시작 - 녹화 ID: {}, 파일 경로: {}",
                LocalDateTime.now(), recordingId, videoFilePath);

//        try {
//            // 1. FastAPI 요청 페이로드 (JSON) 구성
//            // FastAPI는 비디오 파일의 경로를 JSON 형식으로 받도록 설계되었습니다.
//            // (예: {"video_path": "/home/ubuntu/openvidu_recordings/SessionA~5/SessionA~5.mp4"})
//            Map<String, String> payload = new HashMap<>();
//            payload.put("video_path", videoFilePath); // "video_path" 필드에 파일 경로를 담습니다.
//            String jsonPayload = objectMapper.writeValueAsString(payload); // Map을 JSON 문자열로 변환
//
//            // 2. HTTP 클라이언트 생성 및 POST 요청 설정
//            // Apache HttpClient를 사용하여 HTTP 통신을 수행합니다.
//            try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
//                // FastAPI의 비디오 분석 엔드포인트 URL을 구성합니다.
//                // application.yml의 fastapi.url 설정과 FastAPI의 엔드포인트 경로를 결합합니다.
//                // 예: http://fastapi-app:8000 + /analyze/video_expressions_by_path
//                HttpPost httpPost = new HttpPost(fastapiUrl + "/analyze/video_expressions_by_path");
//
//                // 요청 헤더 설정: JSON 형식의 데이터를 보낸다고 명시합니다.
//                httpPost.setHeader("Content-Type", "application/json");
//
//                // 요청 본문 (payload) 설정: 구성된 JSON 문자열을 UTF-8 인코딩으로 포함합니다.
//                httpPost.setEntity(new StringEntity(jsonPayload, "UTF-8"));
//
//                // 3. FastAPI 호출 및 응답 처리
//                // 설정된 HTTP POST 요청을 실행하고 FastAPI로부터 응답을 받습니다.
//                try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
//                    HttpEntity entity = response.getEntity(); // 응답 본문 (JSON)을 가져옵니다.
//                    String fastapiResponse = "";
//                    if (entity != null) {
//                        fastapiResponse = EntityUtils.toString(entity, "UTF-8"); // 응답 본문을 문자열로 변환
//                    }
//
//                    // HTTP 응답 상태 코드 확인
//                    if (response.getStatusLine().getStatusCode() == 200) {
//                        // FastAPI가 200 OK 응답을 보냈을 경우
//                        log.info("[{}] FastAPI 분석 성공 - 녹화 ID: {}: {}",
//                                LocalDateTime.now(), recordingId, fastapiResponse);
//                        // TODO: 받은 분석 결과 (fastapiResponse)를 데이터베이스에 저장하거나,
//                        //       WebSocket 등을 통해 클라이언트에게 실시간으로 전달하는 로직을 여기에 구현합니다.
//                        //       예시: analysisRepository.save(new AnalysisResult(recordingId, sessionId, fastapiResponse));
//                        //       sessionId를 사용하여 INTERVIEWS 또는 ANSWER_ATTEMPTS 테이블과 연관시킬 수 있습니다.
//                    } else {
//                        // FastAPI가 200 OK 외의 다른 상태 코드 (예: 4xx, 5xx)를 보냈을 경우
//                        log.error("[{}] FastAPI 오류 응답 - 녹화 ID: {} (상태: {}): {}",
//                                LocalDateTime.now(), recordingId, response.getStatusLine().getStatusCode(), fastapiResponse);
//                        // TODO: 오류 로깅을 강화하고, 필요시 재시도 로직을 구현하거나,
//                        //       사용자/관리자에게 분석 실패를 알리는 등의 처리를 합니다.
//                    }
//
//                    // 응답 엔티티 스트림을 반드시 소모하여 HTTP 연결이 올바르게 닫히고 재사용될 수 있도록 합니다.
//                    // 이전에 EntityUtils.toString(entity)를 호출했어도 안전을 위해 consume을 호출하는 것이 좋습니다.
//                    if (entity != null) {
//                        EntityUtils.consume(entity);
//                    }
//                }
//            }
//        } catch (IOException e) {
//            // 네트워크 연결 문제, 스트림 읽기/쓰기 오류 등 IO 관련 예외 처리
//            log.error("[{}] FastAPI 비디오 분석 요청 중 IO 오류 발생 - 녹화 ID: {}: {}",
//                    LocalDateTime.now(), recordingId, e.getMessage(), e); // 스택 트레이스 포함 로깅
//        } catch (Exception e) {
//            // 기타 예상치 못한 예외 처리 (예: JSON 직렬화/역직렬화 오류, NullPointerException 등)
//            log.error("[{}] FastAPI 비디오 분석 요청 중 예기치 않은 오류 발생 - 녹화 ID: {}: {}",
//                    LocalDateTime.now(), recordingId, e.getMessage(), e); // 스택 트레이스 포함 로깅
//        }
    }
}