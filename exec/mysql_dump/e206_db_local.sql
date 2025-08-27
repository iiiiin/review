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
-- Table structure for table `local`
--

DROP TABLE IF EXISTS `local`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `local` (
  `id` varchar(20) NOT NULL,
  `local_uuid` varchar(36) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`local_uuid`),
  CONSTRAINT `FK9lu90hbdswgjxd5fvemxe6amg` FOREIGN KEY (`local_uuid`) REFERENCES `users` (`user_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `local`
--

LOCK TABLES `local` WRITE;
/*!40000 ALTER TABLE `local` DISABLE KEYS */;
INSERT INTO `local` VALUES ('aespa001','031cda91-60d3-4e33-bdf7-0a9f303f943a','$2a$10$1.VrbsUA.1oCeQaUdDus3uehTJF8a59dNa5jENZX4SZP1WJcNM/yu'),('heesan6615','2eeb2cee-f000-400d-b59e-49babae5453f','$2a$10$Gwq6HawpWAS3TQt9Yfu7lOSbunQaF2m.QXD0LCY2J/ONZBZw3LxK2'),('cms8955','462e59c3-28c7-4535-8f11-b17a7d538cdc','$2a$10$VhqBqR9jik3yIM4LB6WJ..vWLK5BU6yltLDh.ezwRqvPGY2n0N4IS'),('NewJeans','61b2cd47-43d9-4ea2-8371-cae468e6b7eb','$2a$10$XMGPhvR0PZmrlObyIzlRiu6m3tm.DXo.HHZvTrNyPCGeRhJyiWgFO'),('lah930','666ba03a-a580-4e2b-9b1f-ab7d8f2b60d8','$2a$10$pMO1c.sniM.0GmxyTM5xgOTcYVt1O4F9QDgot7JfYicyZ0h2jqmVq'),('test12345','6cb8638b-76d8-458d-8ff9-163acca92f9f','$2a$10$TvJ7B.zAG.IArja9nMi1/uH4m9Gxm74dqWakLTeTWdAgjnI38EMke'),('ddoriboy','7316ad40-eb7a-46a1-bbac-f9d73f9984fd','$2a$10$/wXFrjQxCkO27mqU3UXiE.dFd9tV7nf/Er.Hpr4XNKqMnS4/5hRpq'),('lah0930','86703b7c-ae49-4798-ae7b-fcbd0253b7ad','$2a$10$ykpseSEGKaisRYc0RbZ84O6Q84Xfn5JVAfP32Q4pRzCN.L019VVHm'),('qwer1234','93b96c4e-817d-4b45-9a8b-25d19eb75da3','$2a$10$NwLRxi7eRgeC/lIYiW2s9.QwAdS5f8j3GczCjmm/P57ygWIxfk066'),('test001','a11bf578-4d31-453f-aefa-72a3caa43cb8','$2a$10$2bLdjG8aB7NjGASSETcCY.jkHbfpmJE4XUDejJWON1mTDrwxI9qi6'),('twice001','aaa80048-d93d-4f21-b05d-1d1c3e10433b','$2a$10$LlYKJwRW8PlomzWg/e.el.M32OVS7yUQ0Ed0BbFTl9rI/GtSLsFzG'),('test1234','eea16372-67c8-4451-96d6-66fba0feb36d','$2a$10$1/kQ7RDSyZdFkwP.jXhnDeQBF5dG3KuPHF54jdb7JHbsmCAumH4Yu');
/*!40000 ALTER TABLE `local` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-16 20:21:09
