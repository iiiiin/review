package ssafy.i13e206.files.service;

import java.io.InputStream;
import java.io.IOException;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ssafy.i13e206.files.constant.FileType;
import ssafy.i13e206.files.dto.request.FileRequestDto;
import ssafy.i13e206.files.dto.response.*;
import ssafy.i13e206.files.entity.Portfolio;
import ssafy.i13e206.files.entity.Resume;
import ssafy.i13e206.files.entity.ScriptFile;
import ssafy.i13e206.files.repository.PortfolioRepository;
import ssafy.i13e206.files.repository.ResumeRepository;
import ssafy.i13e206.files.repository.ScriptRepository;
import ssafy.i13e206.global.util.S3Uploader;
import ssafy.i13e206.gpt.service.GmsDirectService;
import ssafy.i13e206.user.entity.User;
import ssafy.i13e206.user.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class FileService {

    private final ScriptRepository scriptRepository;
    private final ResumeRepository resumeRepository;
    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final S3Uploader s3Uploader;
    private final GmsDirectService gmsDirectService;

    @Transactional
    public FileResponseDto uploadAndSaveFile(
            MultipartFile file,
            FileRequestDto req,
            FileType fileType,
            UserDetails userDetails
    ) throws IOException {
        URL fileUrl = s3Uploader.uploadFile(        // S3에 파일 업로드
                file,
                req.getEnterpriseName(),
                req.getPosition(),
                fileType,
                userDetails
        );

        User user = getUserFromUserDetails(userDetails);
        String fileName = file.getOriginalFilename();

        String ocrText = "";
        try {
            ocrText = parsePdf(file);
        } catch (IOException e) {
            System.err.println("PDF 파싱 실패(fileType=" + fileType + "): " + e.getMessage());
            ocrText = "";
        }
        
        String fileUuid = saveFileMetadataToRDB(
                fileUrl.toString(),
                fileName,
                req,
                fileType,
                user,
                ocrText
        );

        String uploadedAt = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        return new FileResponseDto(fileUuid, fileUrl.toString(), uploadedAt, fileType.toString());
    }

    private String parsePdf(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
             PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private User getUserFromUserDetails(UserDetails userDetails) {
        return userRepository.findById(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 사용자입니다."));
    }

    private String saveFileMetadataToRDB(
            String fileUrl,
            String fileName,
            FileRequestDto req,
            FileType fileType,
            User user,
            String ocrText
    ) {
        String savedUuid = "";
        switch (fileType) {
            case SCRIPT:
                ScriptFile scriptFile = ScriptFile.builder()
                        .enterpriseName(req.getEnterpriseName())
                        .position(req.getPosition())
                        .scriptUrl(fileUrl)
                        .ocrText(ocrText)
                        .scriptUploadedAt(LocalDateTime.now())
                        .fileName(fileName)
                        .user(user)
                        .build();
                // save() 메서드가 반환하는 엔티티에서 UUID를 추출
                ScriptFile savedScriptFile = scriptRepository.save(scriptFile);
                savedUuid = savedScriptFile.getScriptFileUuid();
                break;
            case RESUME:
                Resume resume = Resume.builder()
                        .enterpriseName(req.getEnterpriseName())
                        .position(req.getPosition())
                        .resumeUrl(fileUrl)
                        .ocrText(ocrText)
                        .fileName(fileName)
                        .resumeUploadedAt(LocalDateTime.now())
                        .user(user)
                        .build();
                Resume savedResume = resumeRepository.save(resume);
                savedUuid = savedResume.getResumeUuid();
                break;
            case PORTFOLIO:
                Portfolio portfolio = Portfolio.builder()
                        .enterpriseName(req.getEnterpriseName())
                        .position(req.getPosition())
                        .portfolioUrl(fileUrl)
                        .ocrText(ocrText)
                        .fileName(fileName)
                        .portfolioUploadedAt(LocalDateTime.now())
                        .user(user)
                        .build();
                Portfolio savedPortfolio = portfolioRepository.save(portfolio);
                savedUuid = savedPortfolio.getPortfolioUuid();
                break;
            default:
                throw new IllegalArgumentException("지원하지 않는 파일 형식입니다: " + fileType);
        }
        return savedUuid;
    }

    @Transactional
    public List<FileListResponseDto> getFiles(UserDetails userDetails) {
        User user = getUserFromUserDetails(userDetails);
        List<FileListResponseDto> fileList = new ArrayList<>();

        List<ScriptFile> scripts = scriptRepository.findByUser(user);
        fileList.addAll(scripts.stream()
                .map(script -> FileListResponseDto.builder()
                        .fileUuid(script.getScriptFileUuid())
                        .fileType(FileType.SCRIPT.name().toLowerCase())
                        .company(script.getEnterpriseName())
                        .job(script.getPosition())
                        .fileUrl(script.getScriptUrl())
                        .uploadedAt(script.getScriptUploadedAt().format(DateTimeFormatter.ISO_DATE_TIME))
                        .build())
                .collect(Collectors.toList()));

        List<Resume> resumes = resumeRepository.findByUser(user);
        fileList.addAll(resumes.stream()
                .map(resume -> FileListResponseDto.builder()
                        .fileUuid(resume.getResumeUuid())
                        .fileType(FileType.RESUME.name().toLowerCase())
                        .company(resume.getEnterpriseName())
                        .job(resume.getPosition())
                        .fileUrl(resume.getResumeUrl())
                        .uploadedAt(resume.getResumeUploadedAt().format(DateTimeFormatter.ISO_DATE_TIME))
                        .build())
                .collect(Collectors.toList()));

        List<Portfolio> portfolios = portfolioRepository.findByUser(user);
        fileList.addAll(portfolios.stream()
                .map(portfolio -> FileListResponseDto.builder()
                        .fileUuid(portfolio.getPortfolioUuid())
                        .fileType(FileType.PORTFOLIO.name().toLowerCase())
                        .company(portfolio.getEnterpriseName())
                        .job(portfolio.getPosition())
                        .fileUrl(portfolio.getPortfolioUrl())
                        .uploadedAt(portfolio.getPortfolioUploadedAt().format(DateTimeFormatter.ISO_DATE_TIME))
                        .build())
                .collect(Collectors.toList()));

        fileList.sort((f1, f2) -> {
            LocalDateTime d1 = LocalDateTime.parse(f1.getUploadedAt());
            LocalDateTime d2 = LocalDateTime.parse(f2.getUploadedAt());
            return d2.compareTo(d1);
        });

        return fileList;
    }

    @Transactional
    public void deleteFile(UserDetails userDetails, String fileUuid) {
        User user = getUserFromUserDetails(userDetails);

        Optional<ScriptFile> scriptFileOptional = scriptRepository.findByScriptFileUuid(fileUuid);
        if (scriptFileOptional.isPresent()) {
            ScriptFile scriptFile = scriptFileOptional.get();
            if (!scriptFile.getUser().getUserUuid().equals(user.getUserUuid())) {
                throw new SecurityException("파일을 삭제할 권한이 없습니다.");
            }
            s3Uploader.deleteFile(scriptFile.getScriptUrl());
            scriptRepository.delete(scriptFile);
            return;
        }

        Optional<Resume> resumeOptional = resumeRepository.findByResumeUuid(fileUuid);
        if (resumeOptional.isPresent()) {
            Resume resume = resumeOptional.get();

            if (!resume.getUser().getUserUuid().equals(user.getUserUuid())) {
                throw new SecurityException("파일을 삭제할 권한이 없습니다.");
            }
            s3Uploader.deleteFile(resume.getResumeUrl());
            resumeRepository.delete(resume);
            return;
        }

        Optional<Portfolio> portfolioOptional = portfolioRepository.findByPortfolioUuid(fileUuid);
        if (portfolioOptional.isPresent()) {
            Portfolio portfolio = portfolioOptional.get();

            if (!portfolio.getUser().getUserUuid().equals(user.getUserUuid())) {
                throw new SecurityException("파일을 삭제할 권한이 없습니다.");
            }
            s3Uploader.deleteFile(portfolio.getPortfolioUrl());
            portfolioRepository.delete(portfolio);
            return;
        }

        throw new IllegalArgumentException("요청하신 파일을 찾을 수 없습니다.");
    }

    @Transactional(readOnly = true)
    public ResumeUrlResponseDto getResumeUrl(UserDetails userDetails, String resumeUuid) {
        User user = getUserFromUserDetails(userDetails);

        Resume resume = resumeRepository.findByResumeUuid(resumeUuid)
                .orElseThrow(() -> new IllegalArgumentException("이력서를 찾을 수 없습니다."));

        if (!resume.getUser().getUserUuid().equals(user.getUserUuid())) {
            throw new SecurityException("이력서에 접근할 권한이 없습니다.");
        }

        return ResumeUrlResponseDto.builder()
                .resumeUrl(resume.getResumeUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public PortfolioUrlResponseDto getPortfolioUrl(UserDetails userDetails, String portfolioUuid) {
        User user = getUserFromUserDetails(userDetails);

        Portfolio portfolio = portfolioRepository.findByPortfolioUuid(portfolioUuid)
                .orElseThrow(() -> new IllegalArgumentException("포트폴리오를 찾을 수 없습니다."));

        if (!portfolio.getUser().getUserUuid().equals(user.getUserUuid())) {
            throw new SecurityException("포트폴리오에 접근할 권한이 없습니다.");
        }

        return PortfolioUrlResponseDto.builder()
                .portfolioUrl(portfolio.getPortfolioUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public ScriptUrlResponseDto getScriptUrl(UserDetails userDetails, String scriptUuid) {
        User user = getUserFromUserDetails(userDetails);

        ScriptFile scriptFile = scriptRepository.findByScriptFileUuid(scriptUuid)
                .orElseThrow(() -> new IllegalArgumentException("스크립트 파일을 찾을 수 없습니다."));

        if (!scriptFile.getUser().getUserUuid().equals(user.getUserUuid())) {
            throw new SecurityException("스크립트 파일에 접근할 권한이 없습니다.");
        }

        return ScriptUrlResponseDto.builder()
                .scriptUrl(scriptFile.getScriptUrl())
                .build();
    }
}
