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
-- Table structure for table `interviews`
--

DROP TABLE IF EXISTS `interviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interviews` (
  `interview_uuid` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `enterprise_name` varchar(255) NOT NULL,
  `finished_at` datetime(6) DEFAULT NULL,
  `interview_count` int NOT NULL,
  `interview_type` enum('JOB','PT','TENACITY') NOT NULL,
  `position` varchar(255) NOT NULL,
  `interview_sets_uuid` varchar(36) NOT NULL,
  `user_uuid` varchar(36) NOT NULL,
  PRIMARY KEY (`interview_uuid`),
  KEY `FKk7sk1igseu4m3s9vumxyeo7vm` (`interview_sets_uuid`),
  KEY `FK4udvf0fmkvucdf61noqjk50yn` (`user_uuid`),
  CONSTRAINT `FK4udvf0fmkvucdf61noqjk50yn` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`user_uuid`),
  CONSTRAINT `FKk7sk1igseu4m3s9vumxyeo7vm` FOREIGN KEY (`interview_sets_uuid`) REFERENCES `interview_sets` (`interview_sets_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interviews`
--

LOCK TABLES `interviews` WRITE;
/*!40000 ALTER TABLE `interviews` DISABLE KEYS */;
INSERT INTO `interviews` VALUES ('0c134e17-5a36-4081-8e78-aa1baa073379','2025-08-16 20:10:47.836507','포항공과대학교','2025-08-16 20:11:21.921856',1,'TENACITY','기계공작/기기가공','9b3c2eee-a117-40c9-b1be-50b09d77b80a','93b96c4e-817d-4b45-9a8b-25d19eb75da3'),('20273c1b-5508-45fc-b739-1f033cc65e79','2025-08-16 20:15:10.720405','현대해상화재보험','2025-08-16 20:17:19.820788',1,'TENACITY','지점총무(사무직)','2cba54a0-b625-46d1-aab2-16a3fe384459','adfb0009-aecb-41a1-b1bb-11e5e669bfb3'),('329c193c-59df-4d8e-b742-95a6fbd403c5','2025-08-16 20:14:16.196375','한국미쓰비시상사','2025-08-16 20:14:52.191899',1,'TENACITY','영업직','6be73a77-0164-40a2-b199-d5cc9c28036e','93b96c4e-817d-4b45-9a8b-25d19eb75da3');
/*!40000 ALTER TABLE `interviews` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-16 20:21:05
