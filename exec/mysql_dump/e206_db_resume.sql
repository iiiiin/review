-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: i13e206.p.ssafy.io    Database: e206_db
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `resume`
--

DROP TABLE IF EXISTS `resume`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resume` (
  `resume_uuid` varchar(36) NOT NULL,
  `enterprise_name` varchar(100) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `ocr` longtext NOT NULL,
  `position` varchar(100) NOT NULL,
  `resume_uploaded_at` datetime(6) NOT NULL,
  `resume_url` varchar(500) NOT NULL,
  `user_uuid` varchar(36) NOT NULL,
  PRIMARY KEY (`resume_uuid`),
  KEY `FKpsc335bhkpay4b8tqjv3ops1j` (`user_uuid`),
  CONSTRAINT `FKpsc335bhkpay4b8tqjv3ops1j` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`user_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resume`
--

LOCK TABLES `resume` WRITE;
/*!40000 ALTER TABLE `resume` DISABLE KEYS */;
INSERT INTO `resume` VALUES ('44c530ba-584c-46f0-8a36-c64187ad45f0','현대해상화재보험','하나펀드서비스 지원서(이아현).pdf','개인정보 수집 및 이용 동의서\n본인은 하나펀드서비스(주)에 대한 입사지원과 관련하여 아래사항과 같이 하나펀드서비스(주)가 \n본인에 대한 개인정보를 수집, 이용하는 것에 대하여 동의합니다.\n1. 개인정보의 수집 및 이용 목적\n하나펀드서비스(주)는 채용 진행을 목적으로 입사지원자의 성명, 생년월일, 학력, 경력, 연락\n처 등의 개인정보를 수집하며, 개인정보를 제3자에게 제공하거나, 채용 이외의 목적으로 사\n용하지 않습니다.\n2. 개인정보 보유 및 이용기간\n입사지원자의 개인정보는 채용이 결정된 자의 경우에 한하여 정보주체의 개인정보 파기 요청 \n시까지 보관하며, 그 외의 개인정보는 채용심사 완료 즉시 파기하여 보관, 활용하지 않습니다.\n※ 입사지원자는 ‘개인정보 수집 및 이용 동의서’의 제출을 거부할 권리가 있으며, 동의서 \n제출 거부 시 채용 절차가 진행되지 않을 수 있습니다. \n2025 년      4월      일\n성  명 :  이아현   ( )\n입사지원서\n*는 필수입력항목입니다.\n구분* ■ 신입    □ 경력 지원부문* □ IT 개발\n※ 인적사항\n이름* (한글) 이아현          (한자) 李娥炫      (영문)  LEE AHYUN\n생년월일* 2000.09.30\n보훈대상여\n부\n■ 비대상    □ 대상\n연락처* 010-3166-1303 장애여부 ■ 비대상    □ 대상\nE-mail* lah0930@gmail.com\n현주소* 부산광역시 연제구 종합운동장로 12번길 8 102동 2403호\n병역사항 비대상 (여성)\n취미 특기\n※ 학력사항\n▲ 고등학교 학력정보\n학교명* 사직여자고등학교 졸업연월* 2019.01\n소재지* 부산 \n▲ 대학교 학력정보 1\n학교명* 부경대학교 구분* 주간\n소재지*  부산 유형* 본교\n재학기간* (2020.03 ~ 2024.08)\n전공*\n국제통상학부 국제통상학전공, 컴퓨터\n인공지능공학부 컴퓨터공학전공 (복수\n전공)\n학점* (3.72 / 4.5)\n▲ 대학교 학력정보 2\n학교명 구분 (주간 / 야간)\n소재지 유형 (본교 / 분교)\n재학기간 (입학연월 ~ 졸업연월)\n전공 학점 (평점 / 만점)\n※ 어학/자격사항\n▲ 어학시험\n시험종류 1 TOEIC 점수/급 825 취득년월 2025.01\n시험종류 2 TOEIC SPEAKING 점수/급 IH 취득년월 2025.03\n▲ 자격증/면허사항 1\n자격증/면허명 정보처리기사 \n발급기관 한국산업인력공단 취득/갱신년월  2023 년  09 월\n▲ 자격증/면허사항 2\n자격증/면허명 SQLD\n발급기관 한국데이터산업진흥원 취득/갱신년월  2022 년  12 월\n※ 경력사항\n▲ 경력사항 1\n회사명 근무부서\n담당업무 최종직위\n최종연봉 만원 퇴직사유\n근무기간 □ 현재 재직 중 (YYYY.MM.DD.~)    □ 퇴직 (YYYY.MM.DD.~YYYY.MM.DD.)\n상세경력사항\n▲ 경력사항 2\n회사명 근무부서\n담당업무 최종직위\n최종연봉           만원 퇴직사유\n근무기간 □ 현재 재직 중 (YYYY.MM.DD.~)    □ 퇴직 (YYYY.MM.DD.~YYYY.MM.DD.)\n상세경력사항\n※ 자기소개서\n지원동기\n[투명한 간접투자 환경을 만드는 금융 IT 시스템에 기여하고 싶습니다]\n하나펀드서비스는 국내 최초로 제3자 사무관리 서비스를 도입하여, \n자산운용사의 펀드를 독립적으로 평가하고 회계처리를 수행함으로써 \n간접투자시장에 대한 신뢰를 구축해온 기업입니다. ‘투자자 보호’와 ‘정보의 \n투명성’을 기술 기반으로 실현해온 이 기업의 정체성은, 제가 개발자로서 \n지향하는 방향과 정확히 맞닿아 있습니다.\n단순한 기능 구현을 넘어, 사용자가 정보를 빠르고 직관적으로 인식할 수 있는 \n흐름을 고민하고, 데이터를 구조화하여 신뢰할 수 있는 방식으로 전달하는 IT \n시스템을 만들고자 합니다. 이는 금융 정보의 접근성과 해석 가능성을 높이고자 \n하는 하나펀드서비스의 방향성과도 맞닿아 있습니다.\n특히 복잡한 금융 데이터를 정제하고, 사용자 중심의 로직을 설계해 정보 탐색 \n흐름을 개선한 장학금·지원금 플랫폼 백엔드 개발 경험은, 신뢰성과 투명성이 \n핵심인 사무관리 시스템 개발에도 확장 가능한 역량이라고 생각합니다.\n앞으로 하나펀드서비스의 IT개발 직무에서 고객 중심의 정보 시스템을 설계하고, \n디지털 기반의 안정적이고 신뢰받는 투자 환경을 함께 만들어가고 싶습니다.\n성장과정\n및\n가치관\n[신뢰와 융합의 가치를 바탕으로 성장한 개발자]\n‘신뢰’를 가장 중요한 가치로 삼고 있습니다. 맡은 일에 책임을 다하고, 협업 \n과정에서 신뢰받는 사람으로 남기 위해 꾸준한 태도와 성실함을 지켜왔습니다. \n이는 복수전공과 다양한 프로젝트를 병행하는 과정 속에서도 일관되게 유지해온 \n저의 기본적인 자세이자, 개발자로서 더욱 중요한 자질이라고 생각합니다.\n국제통상학과 컴퓨터공학을 함께 전공하며 Java, SQL을 중심으로 웹 백엔드 \n개발 역량을 키웠고, 글로벌 경제 흐름을 파악하고 이를 기술적으로 구현하는 \n사고력을 길렀습니다. 전공을 병행하면서 하나의 문제를 다양한 시각에서 \n바라보는 힘이 생겼고, 이 과정을 통해 유연한 사고와 열린 마음으로 협업하는 \n법을 체득할 수 있었습니다.\n이러한 융합적 시각은 ‘스마트 해상물류 기반 P2P 금융 플랫폼’ 기획 \n프로젝트에서 발휘되었습니다. 해상물류기업의 자금 조달 어려움과 투자자의 \n정보 접근성 문제를 해결하고자, 산업 특성과 금융 구조를 함께 고려한 플랫폼을 \n기획했습니다. 이 과정에서 AI를 활용한 대안 신용평가 모델을 구상했으며, 저는 \n거래 기록의 투명성을 위해 블록체인 기반 거래내역 저장 구조 설계를 맡아 \n구현까지 진행했습니다. 해당 기획으로 한국해양진흥공사에서 주최한 아이디어 \n경진대회에서 1차 합격했고, 일부 기능은 대외활동에서 구현해보며 아이디어를 \n구체화할 수 있었습니다.\n이 경험을 통해 단순한 기능 구현을 넘어서, 금융 IT 시스템은 ‘데이터의 \n신뢰성과 사용자 접근성’을 함께 고려해야 한다는 점을 체감할 수 있었습니다. \n기획 단계에서부터 사용자 흐름과 정보 구조를 고민하고, 이를 구현까지 \n연결해본 경험은, 하나펀드서비스가 지향하는 정확하고 투명한 사무관리 시스템 \n개발에 있어 실질적인 기반이 될 수 있다고 생각합니다.\n입사 후 포부\n[하나펀드서비스의 디지털 신뢰 기반을 만들겠습니다]\n입사 후에는 변화하는 간접투자시장 환경 속에서도 사용자 중심의 정보 흐름과 \n정확한 데이터 기반의 시스템 구축을 통해 하나펀드서비스의 디지털 경쟁력을 \n강화하는 데 기여하겠습니다.\n특히 장학금·지원금 조회 플랫폼을 개발하며, 다양한 데이터를 조건별로 \n분류하고 맞춤형 정보를 제공하는 백엔드 로직을 설계했던 경험을 기반으로, \n펀드 사무관리 시스템에서도 데이터 검증 및 예외 처리가 강화된 안정적인 \n로직을 구현하겠습니다. 이를 통해 고객이 펀드 정보를 더 직관적이고 신뢰성 \n있게 확인할 수 있는 시스템 개발에 기여하고자 합니다.\n또한, 국제통상학과 컴퓨터공학을 함께 전공하며 쌓은 융합형 사고를 바탕으로, \n금융 규제나 제도 변화에 따른 요구사항을 기술적으로 빠르게 반영할 수 있는 \n유연한 개발 역량을 발휘하겠습니다. API 설계, 데이터 처리 로직 구현 등 IT \n시스템의 핵심 기능 개발에 지속적으로 역량을 쌓아온 만큼, 하나펀드서비스의 \n업무 시스템 고도화와 신규 기능 개발에 실질적으로 기여하겠습니다.\n더불어 팀 내 소통과 협업을 중시하며, 열린 자세로 변화에 대응하고 지속적으로 \n전문 역량을 키워, 하나펀드서비스의 ‘디지털 혁신’을 함께 이끌겠습니다.\n■ 업무경력기술 작성(경력만 해당)\n','지점총무(사무직)','2025-08-16 20:14:31.920254','https://interview-ai-e206.s3.ap-northeast-2.amazonaws.com/%ED%98%84%EB%8C%80%ED%95%B4%EC%83%81%ED%99%94%EC%9E%AC%EB%B3%B4%ED%97%98_%EC%A7%80%EC%A0%90%EC%B4%9D%EB%AC%B4%EC%82%AC%EB%AC%B4%EC%A7%81_RESUME_adfb0009-aecb-41a1-b1bb-11e5e669bfb3_07ac2e71.pdf','adfb0009-aecb-41a1-b1bb-11e5e669bfb3'),('93dc5c5d-8d63-432d-b7d9-d68faf0198bc','포항공과대학교','AI 면접 코칭 서비스 개발을 위한 취준생 의견 조사.pdf','✳  현재 어느 쪽으로 취업 준비 중이신가요?\n응답 29개\n✳  면접은 어떻게 준비중이신가요?\n응답 28개\n✳  현재 면접 준비에서 가장 어려움을 느끼는 부분은 무엇인가요?\n응답 29개\nAI 면접 코칭 서비스 개발을 위한 취준생 의견 조사\n응답 29개\n통계 게시하기\n복사\n대기업\n공기업\n중소기업\n해외취업\n중견이상\n13.8%\n69%\n복사\n0 10 20 30\n혼자\n스터디\n학원\n첨삭 프로그램\n25 (89.3%)\n4 (14.3%)\n0 (0%)\n2 (7.1%)\n복사\n면접 질문에 대한 답변 준비\n면접 태도 및 자세 교정\n실전 연습 기회 부족\n개인별 피드백 받기 어려움\n면접 불안감 및 긴장감 관리\n압박면접, 해외취업 면접 등 다양한\n면접 형태 대비 기능 부족\n20.7%\n17.2%\n44.8%\n25. 7. 20. 오후 3:37 AI 면접 코칭 서비스 개발을 위한 취준생 의견 조사\nhttps://docs.google.com/forms/d/1xoRd76Sgz87VuYPkJj-ZBqHLMuQXqMDav3WW1CllOGY/viewanalytics 1/4\n✳  AI 면접 코칭 서비스에서 가장 필요하다고 생각하는 기능은 무엇인가요? (해당하는\n것을 모두 선택해주세요)  \n응답 29개\n✳  기존의 면접 코칭 서비스 이용에 대한 개선점 또는 추가되었으면 하는 기능을 자유롭게 작성해주\n세요.\n응답 11개\n서비스 이용 자체에 거부감이 있습니다\n실제 면접에 많이 나오는 질문 데이터를 모아서 그중에 나의 포트폴리오에 맞는 질문이 나오면 좋을 것 같다.\n기관별 분위기가 반영될 수 있으면 좋겠습니다. 큰 분류로만 구분해도 좋습니다(사기업/공기업/해외기업 등).\n다대다 면접 기능\n자소서 기반 면접 질문을 생성해주고 답변을 피드백해주는 기능이 있으면 좋을것 같습니다.\n기업별 데이터를 모아서 기업마다 추구하는 인재상에 따른 질문/답변 추천해주기\n취업박람회때 해봤었는데, 정해져 있는 질문들과 답변이 조금 식상했다. 준비한 답변을 얘기하면서 연습할 수\n있는 것은 좋았으나, 아이컨택이나 음성, 표정이나 제스처는 한계점이 있었다. 면접은 아무래도 사람과 사람이\n하는 것이나, 이런 비언어적인 부분도 중요하다고 생각한다. 이런 비언어적인 부분을 캐치하고, 자연스럽게 표\n현하는 기능이 있었으면 좋겠다.\nai피드백의 퀄리티의 향상\n도와줘요 에이아이 면접!\n면접관 유형 추가\n이 콘텐츠는 Google이 만들거나 승인하지 않았습니다. - 양식 소유자에게 문의 - 서비스 약관 - 개인정보처리방침\n양식이 의심스러운가요? 보고서\n복사\n0 5 10 15 20\n실시간 모의면접 시뮬레이션\n답변 내용에 대한 AI 피드백\n표정/제스처 분석 및 교정\n음성 톤/속도 분석\n면접 질문 데이터베이스 제공\n개인별 맞춤 연습 계획\n면접 영상 녹화 및 복습 기능\n피드백이 납득할 수 있는 수…\n13 (44.8%)\n20 (69%)\n9 (31%)\n9 (31%)\n12 (41.4%)\n6 (20.7%)\n6 (20.7%)\n1 (3.4%)\n25. 7. 20. 오후 3:37 AI 면접 코칭 서비스 개발을 위한 취준생 의견 조사\nhttps://docs.google.com/forms/d/1xoRd76Sgz87VuYPkJj-ZBqHLMuQXqMDav3WW1CllOGY/viewanalytics 2/4\n 설문지\n25. 7. 20. 오후 3:37 AI 면접 코칭 서비스 개발을 위한 취준생 의견 조사\nhttps://docs.google.com/forms/d/1xoRd76Sgz87VuYPkJj-ZBqHLMuQXqMDav3WW1CllOGY/viewanalytics 3/4\n25. 7. 20. 오후 3:37 AI 면접 코칭 서비스 개발을 위한 취준생 의견 조사\nhttps://docs.google.com/forms/d/1xoRd76Sgz87VuYPkJj-ZBqHLMuQXqMDav3WW1CllOGY/viewanalytics 4/4\n','기계공작/기기가공','2025-08-16 20:10:45.849510','https://interview-ai-e206.s3.ap-northeast-2.amazonaws.com/%ED%8F%AC%ED%95%AD%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90_%EA%B8%B0%EA%B3%84%EA%B3%B5%EC%9E%91%EA%B8%B0%EA%B8%B0%EA%B0%80%EA%B3%B5_RESUME_93b96c4e-817d-4b45-9a8b-25d19eb75da3_8b5c0390.pdf','93b96c4e-817d-4b45-9a8b-25d19eb75da3');
/*!40000 ALTER TABLE `resume` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-16 20:21:06
