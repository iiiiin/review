package ssafy.i13e206.company.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ssafy.i13e206.company.dto.response.EnterpriseListResponseDto;
import ssafy.i13e206.company.dto.response.JobListResponseDto;
import ssafy.i13e206.company.repository.EnterpriseRepository;
import ssafy.i13e206.company.repository.RecruitRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final EnterpriseRepository enterpriseRepository;
    private final RecruitRepository recruitRepository;

    public List<EnterpriseListResponseDto> getAllEnterprises() {
        return enterpriseRepository.findAll()
                .stream()
                .map(e -> new EnterpriseListResponseDto(e.getEnterpriseUuid(), e.getEnterpriseName()))
                .collect(Collectors.toList());
    }

    public List<JobListResponseDto> getJobs(String enterpriseUuid) {
        return recruitRepository.findByEnterprise_EnterpriseUuid(enterpriseUuid)
                .stream()
                .map(recruit -> new JobListResponseDto(recruit.getRecruitUuid(), recruit.getPosition()))
                .collect(Collectors.toList());
    }
}
