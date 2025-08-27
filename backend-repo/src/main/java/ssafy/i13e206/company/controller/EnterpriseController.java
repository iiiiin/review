package ssafy.i13e206.company.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import ssafy.i13e206.company.dto.request.EnterpriseUuidRequest;
import ssafy.i13e206.company.dto.response.EnterpriseListResponseDto;
import ssafy.i13e206.company.dto.response.JobListResponseDto;
import ssafy.i13e206.company.service.CompanyService;
import ssafy.i13e206.global.dto.ApiResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/company")
public class EnterpriseController {

    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getEnterprises() {
        try {
            List<EnterpriseListResponseDto> result = companyService.getAllEnterprises();
            return ResponseEntity.ok(ApiResponse.success("성공적으로 기업 목록을 조회했습니다.", result));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(403, "접근 권한이 없습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }

    @GetMapping("/job/{enterpriseUuid}")
    public ResponseEntity<ApiResponse<?>> getJobsByEnterprise(@PathVariable String enterpriseUuid) {
        try {
            if (enterpriseUuid == null || enterpriseUuid.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(400, "기업 UUID가 누락되었습니다."));
            }

            List<JobListResponseDto> result = companyService.getJobs(enterpriseUuid);
            return ResponseEntity.ok(ApiResponse.success("해당 기업의 직무 목록을 조회했습니다.", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(500, "server error!"));
        }
    }
}
