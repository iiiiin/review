package ssafy.i13e206.files.controller;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ssafy.i13e206.files.constant.FileType;
import ssafy.i13e206.files.dto.request.FileRequestDto;
import ssafy.i13e206.files.dto.response.*;
import ssafy.i13e206.files.service.FileService;
import ssafy.i13e206.global.dto.ApiResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    @Operation(summary = "파일 업로드", description = "PDF 형식의 이력서 및 포트폴리오 파일을 업로드합니다. 이력서는 필수입니다.")
    @PostMapping(value = "", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<FileResponseDto>>> uploadFiles(
            @AuthenticationPrincipal UserDetails userDetails,
            @ModelAttribute FileRequestDto req
    ) throws IOException {
        List<MultipartFile> files = req.getFile();
        List<String> fileTypes = req.getFileType();

        boolean hasResume = false;
        List<FileResponseDto> uploadedFiles = new ArrayList<>();

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            String typeStr = fileTypes.get(i);

            if (file.getContentType() == null || !file.getContentType().equals("application/pdf")) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(400, "지원하지 않는 파일 형식입니다. PDF 파일만 업로드 가능합니다."));
            }

            FileType fileType = FileType.valueOf(typeStr.toUpperCase());
            FileResponseDto uploaded = fileService.uploadAndSaveFile(file, req, fileType, userDetails);
            uploadedFiles.add(uploaded);
        }
        return ResponseEntity.ok(ApiResponse.success("파일이 성공적으로 업로드되었습니다.", uploadedFiles));
    }


    @GetMapping("")
    public ResponseEntity<ApiResponse<List<FileListResponseDto>>> getFiles(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<FileListResponseDto> fileList = fileService.getFiles(userDetails);
        if (fileList.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(404, "등록된 파일이 없습니다."));
        }

        return ResponseEntity
                .ok(ApiResponse.success("파일 목록 조회가 완료되었습니다.", fileList));
    }

    @DeleteMapping("/{fileUuid}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String fileUuid
    ) {
        fileService.deleteFile(userDetails, fileUuid);
        return ResponseEntity.ok(ApiResponse.success("파일이 성공적으로 삭제되었습니다.", null));
    }

    @GetMapping("/resume/{resumeUuid}")
    public ResponseEntity<ApiResponse<ResumeUrlResponseDto>> getResumeUrl(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String resumeUuid
    ) {
        ResumeUrlResponseDto responseDto = fileService.getResumeUrl(userDetails, resumeUuid);
        return ResponseEntity.ok(ApiResponse.success("미리보기 URL이 생성되었습니다.", responseDto));
    }

    @GetMapping("/portfolio/{portfolioUuid}")
    public ResponseEntity<ApiResponse<PortfolioUrlResponseDto>> getPortfolioUrl(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String portfolioUuid
    ) {
        PortfolioUrlResponseDto responseDto = fileService.getPortfolioUrl(userDetails, portfolioUuid);
        return ResponseEntity.ok(ApiResponse.success("미리보기 URL이 생성되었습니다.", responseDto));
    }

    @GetMapping("/script/{scriptUuid}")
    public ResponseEntity<ApiResponse<ScriptUrlResponseDto>> getScriptUrl(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String scriptUuid
    ) {
        ScriptUrlResponseDto responseDto = fileService.getScriptUrl(userDetails, scriptUuid);
        return ResponseEntity.ok(ApiResponse.success("미리보기 URL이 생성되었습니다.", responseDto));
    }
}