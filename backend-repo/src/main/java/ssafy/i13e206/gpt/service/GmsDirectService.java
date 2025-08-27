package ssafy.i13e206.gpt.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import reactor.core.publisher.Mono;
import ssafy.i13e206.feedback.dto.ModelAnswerResult;
import ssafy.i13e206.feedback.dto.FeedbackSourceDto;
import ssafy.i13e206.files.entity.Portfolio;
import ssafy.i13e206.files.entity.Resume;
import ssafy.i13e206.files.entity.ScriptFile;
import ssafy.i13e206.interview.dto.InterviewQuestionResponseDto;
import ssafy.i13e206.interview.dto.PTProblemDto;
import ssafy.i13e206.interview.entity.InterviewSet;
import ssafy.i13e206.interview.entity.PTInterview;
import ssafy.i13e206.interview.entity.Question;
import ssafy.i13e206.interview.entity.enums.InterviewType;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;


@Slf4j
@Service
@RequiredArgsConstructor
public class GmsDirectService {

    private final RestTemplate gmsRestTemplate;
    private final ObjectMapper objectMapper;

    @Value("${spring.ai.openai.base-url}")
    private String baseUrl;

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Value("${spring.ai.openai.chat.options.model}")
    private String chatModel;

    @Transactional(readOnly = true)
    public Mono<InterviewQuestionResponseDto> generateGeneralQuestions(InterviewSet interviewSet, List<Question> previousQuestions) {
        String ocrContext = buildOcrContext(interviewSet);
        String previousQuestionsContext = buildPreviousQuestionsContext(previousQuestions);
        String enterpriseName = interviewSet.getRecruit().getEnterprise().getEnterpriseName();
        String position = interviewSet.getRecruit().getPosition();
        String task = interviewSet.getRecruit().getTask();

        return Mono.fromSupplier(() -> {
            try {
                String prompt = createInterviewPromptWithExclusions(interviewSet, enterpriseName, position, task, ocrContext, previousQuestionsContext);
                String aiResponse = callGmsChat(prompt);
                log.info("GMS API 신규 질문 생성 성공");
                return parseAiResponse(aiResponse, interviewSet);
            } catch (Exception e) {
                log.error("신규 질문 생성 실패: interviewSetUuid={}", interviewSet.getInterviewSetsUuid(), e);
                throw new RuntimeException("신규 질문 생성에 실패했습니다.", e);
            }
        });
    }

    public String callGmsChat(String prompt) {
        String url = normalizeBaseUrl() + "/chat/completions";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json; charset=UTF-8");
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", chatModel);
            body.put("messages", List.of(
                    Map.of("role", "system", "content", "You are a helpful assistant."),
                    Map.of("role", "user", "content", prompt)
            ));

            String jsonBody = objectMapper.writeValueAsString(body);
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> resp = gmsRestTemplate.exchange(url, HttpMethod.POST, request, String.class);

            JsonNode root = objectMapper.readTree(resp.getBody());
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                return choices.get(0).path("message").path("content").asText();
            }
            throw new IllegalStateException("choices가 비어있습니다.");
        } catch (Exception ex) {
            log.error("GMS Chat API 호출 실패", ex);
            throw new RuntimeException("GMS Chat API 호출 실패", ex);
        }
    }

    @Transactional(readOnly = true)
    public Mono<PTProblemDto> generatePtProblem(InterviewSet interviewSet) {
        String enterpriseName = interviewSet.getRecruit().getEnterprise().getEnterpriseName();
        String position = interviewSet.getRecruit().getPosition();
        String task = interviewSet.getRecruit().getTask();

        return Mono.fromSupplier(() -> {
            try {
                String prompt = createPtProblemPrompt(enterpriseName, position, task);
                String aiResponse = callGmsChat(prompt);
                log.info("GMS API PT 문제 생성 성공");
                return parsePtProblemResponse(aiResponse);
            } catch (Exception e) {
                log.error("PT 문제 생성 실패: interviewSetUuid={}", interviewSet.getInterviewSetsUuid(), e);
                throw new RuntimeException("PT 문제 생성에 실패했습니다.", e);
            }
        });
    }

    @Transactional(readOnly = true)
    public Mono<InterviewQuestionResponseDto> generatePTQuestions(PTInterview ptInterview) {
        String title = ptInterview.getTitle();
        String situation = ptInterview.getSituation();
        String enterpriseName = ptInterview.getInterview().getEnterpriseName();
        String position = ptInterview.getInterview().getPosition();
        InterviewSet interviewSet = ptInterview.getInterview().getInterviewSet();

        return Mono.fromSupplier(() -> {
            try {
                String prompt = createPtQuestionPrompt(title, situation, enterpriseName, position);
                String aiResponse = callGmsChat(prompt);
                log.info("GMS API PT 질문 생성 성공");
                return parseAiResponse(aiResponse, interviewSet);
            } catch (Exception e) {
                log.error("PT 질문 생성 실패: ptUuid={}", ptInterview.getPtUuid(), e);
                throw new RuntimeException("PT 질문 생성에 실패했습니다.", e);
            }
        });
    }

    @Transactional(readOnly = true)
    public Mono<ModelAnswerResult> generateModelAnswer(
            String question,            // 면접 질문(주질문)
            String transcript,          // 전사본
            String enterpriseName,      // 회사명
            String position,            // 직무명
            InterviewSet interviewSet
    ) {
        return Mono.fromSupplier(() -> {
            try {
                String jobContext = buildJobContext(enterpriseName, position);
                String prompt = createModelAnswerPrompt(question, transcript, jobContext, buildOcrContext(interviewSet));
                String aiResponse = callGmsChat(prompt);
                log.info("GMS API 모범답안 생성 성공");

                return parseModelAnswer(aiResponse);
            } catch (Exception e) {
                log.error("모범답안 생성 실패: company={}, position={}", enterpriseName, position, e);
                throw new RuntimeException("모범답안 생성에 실패했습니다.", e);
            }
        });
    }
    @Transactional(readOnly = true)
    public Mono<ModelAnswerResult> generatePtModelAnswer(
            String ptTitle,            // PT 주제
            String ptSituation,        // PT 상황
            String transcript,          // 전사본
            String enterpriseName,      // 회사명
            String position,            // 직무명
            InterviewSet interviewSet
    ) {
        return Mono.fromSupplier(() -> {
            try {
                String jobContext = buildJobContext(enterpriseName, position);
                String prompt = createPtModelAnswerPrompt(ptTitle, ptSituation, transcript, jobContext, buildOcrContext(interviewSet));
                String aiResponse = callGmsChat(prompt);
                log.info("GMS API PT 모범답안 생성 성공");

                return parseModelAnswer(aiResponse);
            } catch (Exception e) {
                log.error("모범답안 생성 실패: company={}, position={}", enterpriseName, position, e);
                throw new RuntimeException("모범답안 생성에 실패했습니다.", e);
            }
        });
    }


    private String createInterviewPromptWithExclusions(InterviewSet interviewSet, String enterpriseName, String position, String task, String ocrContext, String previousQuestionsContext) {
        InterviewType interviewType = interviewSet.getInterviewType();
        String typeSpecificInstructions = "";
        if (interviewType == InterviewType.TENACITY) {
            typeSpecificInstructions = """
            === 면접 중점 평가 항목 (인성 면접) ===
            - 지원자의 가치관, 성격적 강점 및 약점이 회사의 인재상과 부합하는지 평가해주세요.
            - 자기소개서에 나타난 경험을 바탕으로, 협업 스타일, 갈등 해결 능력, 스트레스 관리 방식을 파고드는 질문을 해주세요.
            - 지원 동기의 진정성과 회사에 대한 이해도를 확인할 수 있는 질문을 포함해주세요.
            """;
        } else if (interviewType == InterviewType.JOB) {
            typeSpecificInstructions = """
            === 면접 중점 평가 항목 (직무 면접) ===
            - 포트폴리오와 이력서에 기재된 프로젝트 경험의 기술적 깊이를 검증해주세요.
            - 사용한 기술 스택(언어, 프레임워크, DB 등)에 대한 원리 수준의 이해도를 확인하는 질문을 해주세요.
            - 기술적 난관에 부딪혔을 때의 문제 해결 과정과, 왜 특정 기술이나 아키텍처를 선택했는지에 대한 이유를 묻는 질문을 포함해주세요.
            """;
        }

        return String.format("""
                당신은 %s의 '%s' 직무 채용을 위한 전문 면접관입니다. 이번 면접은 '%s' 유형입니다.
                아래 채용 정보, 지원자 자료, 그리고 이전에 했던 질문 목록을 모두 참고하여, 아직 다루지 않은 **새로운 주제**의 주질문 **정확히 1개**와 그에 대한 꼬리질문 **정확히 2개**를 생성해주세요.
                %s
                === 채용 정보 ===
                회사: %s
                직무: %s
                주요 업무: %s
                %s
                === 이전에 했던 질문 목록 (반드시 이 질문들과 다른 새로운 질문을 만들어주세요) ===
                %s
                === 질문 생성 지침 및 출력 형식 ===
                - 이전에 했던 질문들과 중복되지 않는, 새로운 주제나 경험에 대해 질문해주세요.
                - 주질문 1개와 그에 대한 followUps 배열로 꼬리질문 2개를 포함하여, 아래 예시와 동일한 JSON 형식으로만 출력해주세요.
                - 설명 텍스트 없이 순수 JSON 객체만 반환해야 합니다.
                
                === 출력 형식 예시 ===
                {
                  "questions": [
                    {
                      "id": "q1", "type": "technical", "question": "새로운 주질문 내용", "intent": "질문 의도", "category": "질문 분류", "difficulty": "medium", "rationale": "이 질문이 중요한 이유", "relatedSources": ["resume"],
                      "followUps": [
                        { "id": "q1_f1", "question": "첫 번째 꼬리질문 내용", "intent": "꼬리질문 의도 1", "rationale": "꼬리질문이 중요한 이유 1", "relatedSources": ["resume"] },
                        { "id": "q1_f2", "question": "두 번째 꼬리질문 내용", "intent": "꼬리질문 의도 2", "rationale": "꼬리질문이 중요한 이유 2", "relatedSources": ["portfolio"] }
                      ]
                    }
                  ]
                }
                """, enterpriseName, position, interviewType.name(), typeSpecificInstructions, enterpriseName, position, task, ocrContext, previousQuestionsContext);
    }

    private String createPtProblemPrompt(String enterpriseName, String position, String task) {
        return String.format("""
                당신은 %s의 '%s' 직무 팀장입니다.
                신입사원이 해결해야 할 현실적인 비즈니스 문제 또는 기술 과제를 PT 면접용으로 출제해주세요.
                
                === 채용 정보 ===
                회사: %s
                직무: %s
                주요 업무: %s

                === PT 문제 생성 지침 ===
                - 지원자가 자신의 문제 해결 능력과 직무 이해도를 보여줄 수 있는 구체적인 상황을 제시해주세요.
                - 아래 예시와 동일한 JSON 형식으로만 출력해주세요. 설명 텍스트는 섞지 마세요.

                === 출력 형식 예시 ===
                {
                  "title": "신규 서비스의 초기 사용자 확보를 위한 마케팅 전략 제안",
                  "situation": "최근 우리 회사는 20대 대학생을 타겟으로 하는 새로운 모바일 앱 'StudyBuddy'를 출시했습니다. 현재 앱 다운로드 수는 1,000회 미만으로 저조한 상황입니다. 당신은 이 서비스의 마케팅 담당자로서, 3개월 안에 활성 사용자 수를 5만 명으로 늘리기 위한 구체적인 실행 방안을 제시해야 합니다. 제한된 예산(1,000만 원)을 고려하여 가장 효율적인 전략을 제안해주세요."
                }
                """, enterpriseName, position, enterpriseName, position, task);
    }

    private String createPtQuestionPrompt(String title, String situation, String enterpriseName, String position) {
        return String.format("""
                당신은 %s의 '%s' 직무 채용을 위한 전문 면접관입니다.
                아래와 같은 PT(발표) 면접 문제를 지원자에게 제시한 상황입니다. 이제 지원자의 발표를 유도하고 핵심을 파악하기 위한 첫 질문을 생성해주세요.

                === 제시된 PT 문제 ===
                - 제목: %s
                - 상황: %s

                === 질문 생성 지침 ===
                - 지원자가 문제에 대한 자신의 해결 방안을 구조적으로 설명하도록 유도하는 **주질문 1개**를 만들어주세요.
    
                - 아래 예시와 동일한 JSON 형식으로만 출력해야 하며, 다른 설명은 포함하지 마세요.

                === 출력 형식 예시 ===
                {
                  "questions": [
                    {
                      "id": "pt_q1", "type": "pt", "question": "이 문제 상황에 대해 어떻게 분석하셨고, 어떤 해결 방안을 구상하셨는지 개요를 먼저 설명해주시겠어요?", "intent": "문제 분석 능력 및 해결책 개요 파악", "category": "PT", "difficulty": "medium", "rationale": "지원자의 문제 이해도와 발표의 전체적인 구조를 파악하기 위함", "relatedSources": [],
                      "followUps": [
                        { "id": "pt_q1_f1", "question": "제안하신 해결 방안을 실행할 때 가장 큰 어려움은 무엇이라고 예상하시나요?", "intent": "리스크 분석 및 대응 능력 평가", "rationale": "현실적인 제약 조건과 문제 해결의 깊이를 확인", "relatedSources": [] },
                        { "id": "pt_q1_f2", "question": "그 해결 방안의 효과를 측정하기 위한 핵심 성과 지표(KPI)는 무엇으로 설정하시겠습니까?", "intent": "성과 측정 및 데이터 기반 사고 능력 평가", "rationale": "제안의 구체성과 측정 가능성을 확인", "relatedSources": [] }
                      ]
                    }
                  ]
                }
                """, enterpriseName, position, title, situation);
    }

    private String createModelAnswerPrompt(String question, String transcript,String jobContext, String ocrContext) {
        return String.format("""
        # OUTPUT RULES (가장 중요)
        - 반드시 JSON 형식만 반환 (추가 설명·주석 금지)
        - JSON 외 다른 텍스트 절대 출력 금지
        - 모든 필드명, 타입을 정확히 지켜야 하며 누락 금지

        # ROLE
        당신은 지원자의 역량을 극대화하여 면접 답변을 재구성하는 'AI 면접 컨설턴트'입니다. 당신의 목표는 주어진 정보를 종합하여, 지원자의 경험을 가장 빛나게 할 모범 답변을 만드는 것입니다.
       
        # CONTEXT
        - **면접 질문**: 분석해야 할 면접관의 질문입니다.
        - **지원자 답변 전사본**: 지원자의 실제 답변 내용입니다. 이 답변의 강점은 유지하고, 약점이나 누락된 부분은 보완해야 합니다.
        - **지원자 제출 자료 (OCR)**: 지원자의 이력서, 포트폴리오 등 객관적인 자료입니다. 답변을 보강할 핵심 근거로 사용됩니다.
        - **직무/채용 맥락**: 지원하는 포지션과 회사에 대한 정보입니다. 이 맥락에 맞춰 답변의 방향성을 결정해야 합니다.

        # INSTRUCTIONS
        아래 단계를 순서대로 따라 모범 답안을 생성하세요.
        **Step 0: 중복 회피**
        - 직전 생성된 모범 답변과 **내용·문체가 70%% 이상 유사**하지 않도록 하세요.
        - 동일한 결론이더라도 **어휘, 문장 구조, 전개 순서(STAR 각 단계의 강조점), 예시/근거**를 바꿔 **완전히 새로운 버전**으로 작성하세요.
        - **동일 표현(연속 8단어 이상) 재사용 금지**. 핵심 메시지는 유지하되 **사례·비유·수치·리스크/대안** 등 **강조 포인트**를 변경하세요.
        - 필요 시 **청중 관점**을 변주하세요(예: 경영진 관점 ↔ 실무자 관점).
                
        **Step 1: 핵심 역량 및 경험 분석**
        - '지원자 답변 전사본'에서 지원자가 어필하는 강점과 경험(Situation, Task, Action)을 파악합니다.
        - '지원자 제출 자료(OCR)'와 '직무/채용 맥락'을 참고하여, 답변에서 누락되었지만 강조해야 할 핵심 역량, 기술, 성과(Result)를 식별합니다.

        **Step 2: 모범 답안 재구성**
        - Step 1에서 분석한 내용을 바탕으로, 지원자의 원래 답변을 **STAR 기법(Situation-Task-Action-Result)**에 따라 논리적으로 재구성합니다.
        - 지원자의 강점은 그대로 살리되, 누락된 핵심 역량과 성과를 추가하여 답변을 한 단계 발전시키세요.
        - 최종 답변은 `OUTPUT_FORMAT`의 `modelAnswer` 조건에 맞춰 작성합니다.

        **Step 3: 근거 자료 인용**
        - 작성한 모범 답안 내용의 근거가 되는 부분을 '지원자 제출 자료(OCR)' 원문에서 찾아 `feedbackSources`에 추가합니다.
        - `OUTPUT_FORMAT`의 `feedbackSources` 작성 규칙을 반드시 준수하세요.
        - sourceType 매핑:
           - 이력서 내용 → "resume"
           - 포트폴리오 내용 → "portfolio"
           - 답변 스크립트 내용 → "scriptFile"

        # INPUTS
        === 면접 질문 ===
        %s

        === 지원자 답변 전사본 ===
        %s
       
        === 지원자 제출 자료 (OCR) ===
        %s
      
        === 직무/채용 맥락 ===
        %s
        
        # OUTPUT_FORMAT
        - 다른 설명 없이, 반드시 아래 명시된 JSON 형식으로만 응답해야 합니다.
        - JSON 외 다른 텍스트를 절대 출력하지 마세요.
        
        {
            "modelAnswer": "(String)",
            "feedbackSources": [
                {
                    "sourceType": "(String: resume|portfolio|scriptFile)",
                    "citedContent": "(String)"
                }
            ]
        }
        **[modelAnswer 작성 규칙]**
        - **분량**: 공백 포함 300자 이상 500자 이하
        - **어조**: 한국어 존댓말을 사용한 자연스럽고 설득력 있는 문체
        - **구조**: STAR 기법의 흐름이 명확히 드러나는 하나의 단락
        
        
        **[feedbackSources 작성 규칙]**
        1.  `citedContent`는 **'지원자 제출 자료 (OCR)' 원문에서 가져온 정확한 부분 문자열(exact substring)**이어야 합니다. (요약, 변경, 재구성 절대 금지)
        2.  `citedContent`는 "이력서 내용:", "포트폴리오 내용:", "답변 스크립트 내용: " 등 **레이블을 제외한 순수 텍스트**에서만 추출해야 합니다.
        3.  **의미 있는 내용만 인용**: 지원자의 기술, 경험, 성과와 직접적으로 관련된 내용만 인용하세요. "내용 없음", "안녕하세요" 와 같은 무의미한 내용은 절대 인용하지 마세요.
        4.  인용할 내용이 없는 경우, `feedbackSources`는 **빈 배열 `[]`** 로 출력해야 합니다. (필드 자체를 생략하지 마세요)
        
        **[출력 예시]**
        **Case 1: 인용할 내용이 있는 경우**
            {
                "modelAnswer": "(STAR 구조에 맞춰, 지원자의 강점과 제출 자료의 핵심 역량을 결합하여 재구성한 모범 답안...)",
                "feedbackSources": [
                    {
                        "sourceType": "resume",
                        "citedContent": "SW플랫폼/모빌리티 1 지망 도메인 Backend 개발"
                    },
                    {
                        "sourceType": "portfolio",
                        "citedContent": "팀 프로젝트에서 Spring Boot 기반 API 서버를 구축하고"
                    }
                ]
            }

        **Case 2: 인용할 내용이 없는 경우 (OCR 자료가 무의미할 때)**
            {
                "modelAnswer": "(지원자의 답변을 바탕으로 논리적으로 재구성했지만, OCR 자료에서 인용할 만한 유의미한 근거를 찾지 못한 모범 답안...)",
                "feedbackSources": []
            }
        """, question, transcript, ocrContext, jobContext);
    }

    private String createPtModelAnswerPrompt(String ptTitle, String ptSituation, String transcript, String jobContext, String ocrContext) {
        // 6개의 `%s`를 5개로 줄이고, 변수 순서를 프롬프트 레이블에 맞게 수정
        return String.format("""
        # OUTPUT RULES (가장 중요)
        - 반드시 JSON 형식만 반환 (추가 설명·주석 금지)
        - JSON 외 다른 텍스트 절대 출력 금지
        - 모든 필드명, 타입을 정확히 지켜야 하며 누락 금지

        # ROLE
        당신은 지원자의 **문제 해결 능력과 발표 논리력**을 극대화하여, **하나의 완성된 PT 발표 스크립트**를 작성하는 'AI 면접 컨설턴트'입니다. 당신의 목표는 주어진 정보를 종합하여, 가장 논리적이고 설득력 있는 모범 발표문을 만드는 것입니다.

        # INSTRUCTIONS
        아래 단계를 순서대로 따라 모범 답안을 생성하세요.
        **Step 0: 중복 회피**
        - 이전에 제공된 모범 답변과 절대 동일하거나 매우 유사한 문장을 작성하지 마세요.
        - 어휘, 예시, 강조 포인트를 다르게 하여 **완전히 새로운 버전**을 만드세요.
        - 동일한 결론이더라도 접근 방식과 전개 논리를 바꾸세요.
                    
        **Step 1: 핵심 내용 분석**
        - 'PT 과제'와 '지원자 발표 내용'을 통해 지원자의 핵심 아이디어와 문제 접근 방식을 파악합니다.
        - '지원자 제출 자료(OCR)'와 '직무/채용 맥락'을 참고하여, 발표의 논리를 강화할 지원자의 구체적인 경험, 기술, 성과를 찾아냅니다.

        **Step 2: 논리적 발표 구조로 모범 답안 재구성**
        - Step 1에서 분석한 내용을 바탕으로, 지원자의 발표를 **[서론-본론-결론]** 의 논리적 흐름에 맞춰 하나의 완성된 발표 스크립트로 재구성합니다.
        - **서론**에서는 주어진 과제에 대한 이해와 핵심 문제를 명확히 제시합니다.
        - **본론**에서는 구체적인 해결 방안을 제시하고, 그 근거를 '지원자 제출 자료(OCR)'과 연결하여 설득력을 높입니다. 만약 OCR 자료에 명확한 해결 방안이 없다면, 지원자의 전반적인 기술 스택과 직무 맥락을 고려하여 가장 논리적이고 실현 가능한 해결 방안을 창의적으로 제시합니다.
        - **결론**에서는 제안의 기대 효과를 요약하고, 회사와 직무에 기여할 부분을 강조하며 마무리합니다.
        - 최종 답변은 `OUTPUT_FORMAT`의 `modelAnswer` 조건에 맞춰 작성합니다.

        **Step 3: 근거 자료 인용**
        - 작성한 모범 답안 내용의 근거가 되는 부분을 '지원자 제출 자료(OCR)' 원문에서 찾아 `feedbackSources`에 추가합니다.
        - `OUTPUT_FORMAT`의 `feedbackSources` 작성 규칙을 반드시 준수하세요.
        - sourceType 매핑:
            - 이력서 내용 → "resume"
            - 포트폴리오 내용 → "portfolio"
            - 답변 스크립트 내용 → "scriptFile"

        # INPUTS
        === PT 과제 ===
        - 주제: %s
        - 내용: %s

        === 지원자 발표 내용 (전사본) ===
        %s
   
        === 지원자 제출 자료 (OCR) ===
        %s
  
        === 직무/채용 맥락 ===
        %s
    
        # OUTPUT_FORMAT
        - 다른 설명 없이, 반드시 아래 명시된 JSON 형식으로만 응답해야 합니다.
        - JSON 외 다른 텍스트를 절대 출력하지 마세요.
    
        {
            "modelAnswer": "(String)",
            "feedbackSources": [
                {
                    "sourceType": "(String: resume|portfolio|scriptFile)",
                    "citedContent": "(String)"
                }
            ]
        }
    
        **[modelAnswer 작성 규칙]**
        - **분량**: 공백 포함 700자 이상 1000자 이하
        - **어조**: 한국어 존댓말을 사용한 전문적이고 설득력 있는 발표 문체
        - **구조**: 내용의 흐름은 [서론-본론-결론]의 논리적 구조를 따라야 합니다.
    
    
        **[feedbackSources 작성 규칙]**
        1.  `citedContent`는 **'지원자 제출 자료 (OCR)' 원문에서 가져온 정확한 부분 문자열(exact substring)**이어야 합니다. (요약, 변경, 재구성 절대 금지)
        2.  `citedContent`는 "이력서 내용:", "포트폴리오 내용:", "답변 스크립트 내용: " 등 **레이블을 제외한 순수 텍스트**에서만 추출해야 합니다.
        3.  **의미 있는 내용만 인용**: 지원자의 기술, 경험, 성과와 직접적으로 관련된 내용만 인용하세요. "내용 없음", "안녕하세요" 와 같은 무의미한 내용은 절대 인용하지 마세요.
        4.  인용할 내용이 없는 경우, `feedbackSources`는 **빈 배열 `[]`** 로 출력해야 합니다. (필드 자체를 생략하지 마세요)
    
        **[출력 예시]**
        "modelAnswer": "(서론-본론-결론 구조에 맞춰, 지원자의 아이디어와 제출 자료의 핵심 역량을 결합하여 재구성한 논리적인 발표 답변...)",
        "feedbackSources": [
            {
                "sourceType": "resume",
                "citedContent": "SW플랫폼/모빌리티 1 지망 도메인 Backend 개발"
            },
            {
                "sourceType": "portfolio",
                "citedContent": "팀 프로젝트에서 Spring Boot 기반 API 서버를 구축하고"
            }
        ]
    """, ptTitle, ptSituation, transcript, ocrContext, jobContext); // 변수 순서도 레이블에 맞게 수정
    }

    private PTProblemDto parsePtProblemResponse(String aiResponse) {
        try {
            String cleanedJson = extractJsonBlock(aiResponse);
            JsonNode root = objectMapper.readTree(cleanedJson);

            String title = root.path("title").asText("AI 제목 생성 실패");
            String situation = root.path("situation").asText("AI 상황 생성에 실패했습니다.");

            return PTProblemDto.builder()
                    .title(title)
                    .situation(situation)
                    .build();
        } catch (Exception e) {
            log.warn("AI PT 문제 응답 파싱 실패: {}", e.getMessage());
            return PTProblemDto.builder()
                    .title("기본 PT 제목")
                    .situation("AI 응답 파싱에 실패하여 기본 상황이 제공됩니다.")
                    .build();
        }
    }

    private String buildOcrContext(InterviewSet interviewSet) {
        StringBuilder sb = new StringBuilder();
        Resume resume = interviewSet.getResume();
        Portfolio portfolio = interviewSet.getPortfolio();
        ScriptFile scriptFile = interviewSet.getScriptFile();

        sb.append("=== 지원자 자료 요약 (OCR 기반) ===\n");
        if (resume != null && resume.getOcrText() != null && !resume.getOcrText().isBlank()) {
            sb.append("이력서 내용: ").append(truncate(resume.getOcrText(), 1000)).append("\n\n");
        }
        if (portfolio != null && portfolio.getOcrText() != null && !portfolio.getOcrText().isBlank()) {
            sb.append("포트폴리오 내용: ").append(truncate(portfolio.getOcrText(), 1000)).append("\n\n");
        }
        if (scriptFile != null && scriptFile.getOcrText() != null && !scriptFile.getOcrText().isBlank()) {
            sb.append("답변 스크립트 내용: ").append(truncate(scriptFile.getOcrText(), 1000)).append("\n\n");
        }
        return sb.toString();
    }

    private String truncate(String text, int maxChars) {
        if (text == null) return "";
        return text.length() > maxChars ? text.substring(0, maxChars) + "..." : text;
    }

    private String buildPreviousQuestionsContext(List<Question> questions) {
        if (questions == null || questions.isEmpty()) {
            return "이전에 했던 질문이 없습니다.\n";
        }
        return questions.stream()
                .sorted(Comparator.comparingInt(Question::getQuestionNumber))
                .map(q -> {
                    String type = (q.getParent() == null) ? "주질문" : "꼬리질문";
                    return String.format("- %s (No.%d): %s", type, q.getQuestionNumber(), q.getQuestion());
                })
                .collect(Collectors.joining("\n"));
    }

    private InterviewQuestionResponseDto parseAiResponse(String aiResponse, InterviewSet interviewSet) {
        try {
            String cleanedJson = extractJsonBlock(aiResponse);
            JsonNode root = objectMapper.readTree(cleanedJson);
            JsonNode questionsNode = root.path("questions");

            if (questionsNode.isArray() && !questionsNode.isEmpty()) {
                JsonNode qNode = questionsNode.get(0);
                InterviewQuestionResponseDto.Question question = parseQuestionNode(qNode, "q_new");

                List<InterviewQuestionResponseDto.Question.FollowUp> followUps = new ArrayList<>();
                JsonNode followUpsNode = qNode.path("followUps").isMissingNode() ? qNode.path("follow_up") : qNode.path("followUps");
                if (followUpsNode.isArray()) {
                    int fidx = 1;
                    for (JsonNode fNode : followUpsNode) {
                        followUps.add(parseFollowUpNode(fNode, question.getId() + "_f" + fidx++));
                    }
                }
                question.setFollowUps(followUps);

                return InterviewQuestionResponseDto.builder()
                        .interviewSetUuid(interviewSet.getInterviewSetsUuid())
                        .questions(List.of(question))
                        .build();
            }
        } catch (Exception e) {
            log.warn("AI 응답 JSON 파싱 실패: {}", e.getMessage());
        }
        return createDefaultQuestionResponse(interviewSet);
    }

    private InterviewQuestionResponseDto.Question parseQuestionNode(JsonNode qNode, String defaultId) {
        return InterviewQuestionResponseDto.Question.builder()
                .id(getTextOrDefault(qNode, "id", defaultId))
                .type(getTextOrDefault(qNode, "type", "general"))
                .question(getTextOrDefault(qNode, "question", ""))
                .intent(getTextOrDefault(qNode, "intent", ""))
                .category(getTextOrDefault(qNode, "category", "일반"))
                .difficulty(getTextOrDefault(qNode, "difficulty", "medium"))
                .rationale(getTextOrDefault(qNode, "rationale", ""))
                .relatedSources(extractStringArrayVariant(qNode, "relatedSources", "related_sources"))
                .build();
    }

    private InterviewQuestionResponseDto.Question.FollowUp parseFollowUpNode(JsonNode fNode, String defaultId) {
        return InterviewQuestionResponseDto.Question.FollowUp.builder()
                .id(getTextOrDefault(fNode, "id", defaultId))
                .question(getTextOrDefault(fNode, "question", ""))
                .intent(getTextOrDefault(fNode, "intent", ""))
                .rationale(getTextOrDefault(fNode, "rationale", ""))
                .relatedSources(extractStringArrayVariant(fNode, "relatedSources", "related_sources"))
                .build();
    }

    private InterviewQuestionResponseDto createDefaultQuestionResponse(InterviewSet interviewSet) {
        InterviewQuestionResponseDto.Question question = InterviewQuestionResponseDto.Question.builder()
                .id("q_default")
                .question("AI 질문 생성에 실패했습니다. 이력서에서 가장 강조하고 싶은 경험은 무엇인가요?")
                .followUps(Collections.emptyList())
                .build();
        return InterviewQuestionResponseDto.builder()
                .interviewSetUuid(interviewSet.getInterviewSetsUuid())
                .questions(List.of(question))
                .build();
    }

    private String extractJsonBlock(String raw) {
        if (raw == null) return "{}";
        Pattern fenced = Pattern.compile("```(?:json)?\\s*(\\{[\\s\\S]*?\\})\\s*```", Pattern.CASE_INSENSITIVE);
        Matcher m = fenced.matcher(raw);
        if (m.find()) return m.group(1);
        int first = raw.indexOf('{');
        int last = raw.lastIndexOf('}');
        return (first != -1 && last != -1 && last > first) ? raw.substring(first, last + 1) : "{}";
    }

    private String getTextOrDefault(JsonNode node, String field, String defaultValue) {
        return node.path(field).asText(defaultValue);
    }

    private List<String> extractStringArrayVariant(JsonNode node, String camelCase, String snakeCase) {
        JsonNode arrNode = node.path(camelCase).isMissingNode() ? node.path(snakeCase) : node.path(camelCase);
        List<String> result = new ArrayList<>();
        if (arrNode.isArray()) {
            for (JsonNode element : arrNode) {
                result.add(element.asText());
            }
        }
        return result;
    }

    private String normalizeBaseUrl() {
        return baseUrl != null && baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private String buildJobContext(String enterpriseName, String position) {
        StringBuilder sb = new StringBuilder();
        if (enterpriseName != null && !enterpriseName.isBlank()) {
            sb.append("회사: ").append(enterpriseName).append("\n");
        }
        if (position != null && !position.isBlank()) {
            sb.append("직무: ").append(position).append("\n");
        }
        return sb.toString().trim();
    }

    private ModelAnswerResult parseModelAnswer(String aiResponse) {
        try {
            String cleanedJson = extractJsonBlock(aiResponse);
            JsonNode root = objectMapper.readTree(cleanedJson);

            String answer = root.path("modelAnswer").asText("").trim();

            List<FeedbackSourceDto> sources = new ArrayList<>();
            JsonNode sourcesNode = root.path("feedbackSources");

            if (sourcesNode.isArray()) {
                for (JsonNode sourceNode : sourcesNode) {
                    String type = sourceNode.path("sourceType").asText();
                    String cited = sourceNode.path("citedContent").asText();

                    // (선택) 화이트리스트 필터링
                    if (!type.isEmpty() && !cited.isEmpty()) {
                        sources.add(new FeedbackSourceDto(type, cited));
                    }
                }
            }

            return ModelAnswerResult.builder()
                    .modelAnswer(answer)
                    .feedbackSources(sources)   // ✅ DTO 리스트
                    .build();
        } catch (Exception e) {
            log.warn("모범답안 JSON 파싱 실패: {}", e.getMessage());
            return ModelAnswerResult.builder()
                    .modelAnswer("모범 답안 생성에 실패했습니다.")
                    .feedbackSources(Collections.emptyList())
                    .build();
        }
    }
}