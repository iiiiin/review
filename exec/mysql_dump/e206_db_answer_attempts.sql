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
-- Table structure for table `answer_attempts`
--

DROP TABLE IF EXISTS `answer_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `answer_attempts` (
  `answer_attempt_uuid` varchar(36) NOT NULL,
  `attempt_number` int NOT NULL,
  `elapsed_time` float DEFAULT NULL,
  `status` enum('COMPLETED','FAILED','PENDING','PROCESSING') NOT NULL,
  `video_path` varchar(255) DEFAULT NULL,
  `question_uuid` varchar(36) NOT NULL,
  PRIMARY KEY (`answer_attempt_uuid`,`attempt_number`),
  KEY `FK3vv9efhid2qd78ctl937sgk9k` (`question_uuid`),
  CONSTRAINT `FK3vv9efhid2qd78ctl937sgk9k` FOREIGN KEY (`question_uuid`) REFERENCES `questions` (`question_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answer_attempts`
--

LOCK TABLES `answer_attempts` WRITE;
/*!40000 ALTER TABLE `answer_attempts` DISABLE KEYS */;
INSERT INTO `answer_attempts` VALUES ('14b4e4ee-7c0b-4cb4-b71e-af7e57e45f18',1,NULL,'COMPLETED','https://i13e206.p.ssafy.io:8442/openvidu/recordings/14b4e4ee-7c0b-4cb4-b71e-af7e57e45f18/14b4e4ee-7c0b-4cb4-b71e-af7e57e45f18.mp4','14b4e4ee-7c0b-4cb4-b71e-af7e57e45f18'),('2308898b-1e00-41b2-9ea4-96d08926ef98',1,NULL,'COMPLETED','https://i13e206.p.ssafy.io:8442/openvidu/recordings/2308898b-1e00-41b2-9ea4-96d08926ef98/2308898b-1e00-41b2-9ea4-96d08926ef98.mp4','2308898b-1e00-41b2-9ea4-96d08926ef98'),('384a037c-b156-48b6-8038-8ff33da015ad',1,NULL,'COMPLETED','https://i13e206.p.ssafy.io:8442/openvidu/recordings/384a037c-b156-48b6-8038-8ff33da015ad/384a037c-b156-48b6-8038-8ff33da015ad.mp4','384a037c-b156-48b6-8038-8ff33da015ad'),('46e97e48-d8ed-44d3-a506-80a4460d3364',1,NULL,'COMPLETED','https://i13e206.p.ssafy.io:8442/openvidu/recordings/46e97e48-d8ed-44d3-a506-80a4460d3364/46e97e48-d8ed-44d3-a506-80a4460d3364.mp4','46e97e48-d8ed-44d3-a506-80a4460d3364'),('863a8a45-ddab-45fc-858d-002773993093',1,NULL,'COMPLETED','https://i13e206.p.ssafy.io:8442/openvidu/recordings/863a8a45-ddab-45fc-858d-002773993093/863a8a45-ddab-45fc-858d-002773993093.mp4','863a8a45-ddab-45fc-858d-002773993093'),('bdd79eaf-2f6e-42d8-86a4-eabadf96fce2',1,NULL,'COMPLETED','https://i13e206.p.ssafy.io:8442/openvidu/recordings/bdd79eaf-2f6e-42d8-86a4-eabadf96fce2/bdd79eaf-2f6e-42d8-86a4-eabadf96fce2.mp4','bdd79eaf-2f6e-42d8-86a4-eabadf96fce2'),('c5773741-80f4-4f48-931d-b0e4ab61aa70',1,NULL,'COMPLETED','https://i13e206.p.ssafy.io:8442/openvidu/recordings/c5773741-80f4-4f48-931d-b0e4ab61aa70/c5773741-80f4-4f48-931d-b0e4ab61aa70.mp4','c5773741-80f4-4f48-931d-b0e4ab61aa70'),('d5186166-0892-4dbf-8112-eac01cf10f91',1,NULL,'COMPLETED','https://i13e206.p.ssafy.io:8442/openvidu/recordings/d5186166-0892-4dbf-8112-eac01cf10f91/d5186166-0892-4dbf-8112-eac01cf10f91.mp4','d5186166-0892-4dbf-8112-eac01cf10f91'),('e304012f-652a-4dc5-9909-d4a65174ccc1',1,NULL,'COMPLETED','https://i13e206.p.ssafy.io:8442/openvidu/recordings/e304012f-652a-4dc5-9909-d4a65174ccc1/e304012f-652a-4dc5-9909-d4a65174ccc1.mp4','e304012f-652a-4dc5-9909-d4a65174ccc1');
/*!40000 ALTER TABLE `answer_attempts` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-16 20:21:01
