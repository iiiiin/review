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
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `question_uuid` varchar(36) NOT NULL,
  `purpose` varchar(100) NOT NULL,
  `question` tinytext NOT NULL,
  `question_number` int NOT NULL,
  `suggested_answer` tinytext NOT NULL,
  `interview_uuid` varchar(36) NOT NULL,
  `parent_uuid` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`question_uuid`),
  KEY `FKp4kjafh6yflvdc0u4bcihe7t2` (`interview_uuid`),
  KEY `FKfp6jf49p49ty611pc08b5psf3` (`parent_uuid`),
  CONSTRAINT `FKfp6jf49p49ty611pc08b5psf3` FOREIGN KEY (`parent_uuid`) REFERENCES `questions` (`question_uuid`),
  CONSTRAINT `FKp4kjafh6yflvdc0u4bcihe7t2` FOREIGN KEY (`interview_uuid`) REFERENCES `interviews` (`interview_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES ('14b4e4ee-7c0b-4cb4-b71e-af7e57e45f18','과거 경험에서의 학습과 성장 가능성을 확인하기 위함','그 과제로부터 어떤 교훈을 얻었고, 앞으로의 업무에 어떻게 적용할 계획인지 설명해 주세요.',3,'이 꼬리 질문은 지원자의 성찰 능력과 향후 발전 의지를 평가한다.','20273c1b-5508-45fc-b739-1f033cc65e79','e304012f-652a-4dc5-9909-d4a65174ccc1'),('2308898b-1e00-41b2-9ea4-96d08926ef98','지원자가 경험에서 배운 점을 통해 성장을 평가하기 위함','이 경험을 통해 얻은 교훈은 무엇인가요?',3,'실패나 어려움에서 학습한 내용을 통해 인성 및 성장을 평가할 수 있습니다.','0c134e17-5a36-4081-8e78-aa1baa073379','bdd79eaf-2f6e-42d8-86a4-eabadf96fce2'),('384a037c-b156-48b6-8038-8ff33da015ad','실제 경험을 통해 지원자의 역량을 구체화','믿음을 쌓기 위해 가장 효과적이었던 구체적인 사례를 공유해 보세요.',3,'구체적인 사례는 지원자의 실질적인 능력을 평가하는 데 도움이 됩니다.','329c193c-59df-4d8e-b742-95a6fbd403c5','46e97e48-d8ed-44d3-a506-80a4460d3364'),('46e97e48-d8ed-44d3-a506-80a4460d3364','고객 관계 구축 방법을 평가','영업직무에서 고객과의 신뢰를 쌓기 위해 어떤 노력을 해왔나요?',1,'신뢰는 영업에서 중요한 요소이므로, 지원자의 접근 방식을 이해하는 것이 필요합니다.','329c193c-59df-4d8e-b742-95a6fbd403c5',NULL),('863a8a45-ddab-45fc-858d-002773993093','갈등 해결 및 스트레스 관리 능력 평가','이 과정에서 어렵거나 힘든 점이 있었다면 어떻게 극복했는지 이야기해보세요.',2,'어려움을 극복하는 방식은 지원자의 인내심을 보여줄 수 있습니다.','329c193c-59df-4d8e-b742-95a6fbd403c5','46e97e48-d8ed-44d3-a506-80a4460d3364'),('bdd79eaf-2f6e-42d8-86a4-eabadf96fce2','지원자의 문제 해결 능력과 끈기를 평가하기 위함','기계공작/기기가공 분야에서 예상보다 힘든 프로젝트를 맡았을 때, 이를 극복하기 위해 어떤 노력을 했나요?',1,'이 질문은 지원자가 어려움을 어떻게 극복하는지를 통해 직무에 대한 적합성을 평가할 수 있습니다.','0c134e17-5a36-4081-8e78-aa1baa073379',NULL),('c5773741-80f4-4f48-931d-b0e4ab61aa70','지원자의 스트레스 관리 방식과 갈등 해결 능력 확인','그 과제를 해결하면서 가장 힘들었던 순간은 언제였고, 그때 어떻게 극복했는지 이야기해 주세요.',2,'이 꼬리 질문은 지원자가 위기 상황에서 어떻게 대응하는지에 대한 통찰을 제공한다.','20273c1b-5508-45fc-b739-1f033cc65e79','e304012f-652a-4dc5-9909-d4a65174ccc1'),('d5186166-0892-4dbf-8112-eac01cf10f91','협업 스타일을 이해하기 위함','그 과정에서 팀원들과의 소통은 어떻게 하셨나요?',2,'팀 내 소통 방식이 도움이 되었는지 확인하고자 함.','0c134e17-5a36-4081-8e78-aa1baa073379','bdd79eaf-2f6e-42d8-86a4-eabadf96fce2'),('e304012f-652a-4dc5-9909-d4a65174ccc1','지원자의 문제 해결 능력과 끈기를 평가하기 위함','프로젝트나 팀 활동 중에 어려운 과제를 해결하기 위해서 어떤 전략을 사용했는지 구체적으로 설명해 주세요.',1,'이 질문을 통해 지원자가 과제를 극복하려는 태도와 방법을 이해할 수 있다.','20273c1b-5508-45fc-b739-1f033cc65e79',NULL);
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-16 20:21:03
