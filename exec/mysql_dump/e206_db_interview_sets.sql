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
-- Table structure for table `interview_sets`
--

DROP TABLE IF EXISTS `interview_sets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interview_sets` (
  `interview_sets_uuid` varchar(36) NOT NULL,
  `interview_type` enum('JOB','PT','TENACITY') NOT NULL,
  `portfolio_uuid` varchar(36) DEFAULT NULL,
  `recruit_uuid` varchar(36) NOT NULL,
  `resume_uuid` varchar(36) NOT NULL,
  `script_file_uuid` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`interview_sets_uuid`),
  KEY `FK7eil0yvx9wxvgci6hg8o2qa3p` (`portfolio_uuid`),
  KEY `FKsvs08f3lnoqb4wurxg0jvepd` (`recruit_uuid`),
  KEY `FK35kqos2dlo2kqa8306djt4q2t` (`resume_uuid`),
  KEY `FKr881s7b2619oqw5w5fqf0blr0` (`script_file_uuid`),
  CONSTRAINT `FK35kqos2dlo2kqa8306djt4q2t` FOREIGN KEY (`resume_uuid`) REFERENCES `resume` (`resume_uuid`),
  CONSTRAINT `FK7eil0yvx9wxvgci6hg8o2qa3p` FOREIGN KEY (`portfolio_uuid`) REFERENCES `portfolio` (`portfolio_uuid`),
  CONSTRAINT `FKr881s7b2619oqw5w5fqf0blr0` FOREIGN KEY (`script_file_uuid`) REFERENCES `script_file` (`script_file_uuid`),
  CONSTRAINT `FKsvs08f3lnoqb4wurxg0jvepd` FOREIGN KEY (`recruit_uuid`) REFERENCES `recruit` (`recruit_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interview_sets`
--

LOCK TABLES `interview_sets` WRITE;
/*!40000 ALTER TABLE `interview_sets` DISABLE KEYS */;
INSERT INTO `interview_sets` VALUES ('2cba54a0-b625-46d1-aab2-16a3fe384459','TENACITY',NULL,'199ece46-f9d3-4401-bf12-1e42bed5d680','44c530ba-584c-46f0-8a36-c64187ad45f0',NULL),('6be73a77-0164-40a2-b199-d5cc9c28036e','TENACITY',NULL,'c977dc15-0f63-4546-92f8-6d625713b55f','93dc5c5d-8d63-432d-b7d9-d68faf0198bc',NULL),('9b3c2eee-a117-40c9-b1be-50b09d77b80a','TENACITY',NULL,'5c5342bc-4719-4ff5-aeda-863a53e15f2e','93dc5c5d-8d63-432d-b7d9-d68faf0198bc',NULL);
/*!40000 ALTER TABLE `interview_sets` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-16 20:21:08
