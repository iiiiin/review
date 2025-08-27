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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_uuid` varchar(36) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`user_uuid`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('2025-08-06 10:32:24.833383','2025-08-06 10:32:24.833409','031cda91-60d3-4e33-bdf7-0a9f303f943a','카리나','kis1110@icloud.com'),('2025-08-16 18:40:45.277129','2025-08-16 18:40:45.277137','1b35665c-4461-4826-996b-3215b356a4a3','권인[부울경_2반_E206]팀원','inssafy1110@gmail.com'),('2025-08-05 14:40:13.295591','2025-08-05 14:40:13.295591','2eeb2cee-f000-400d-b59e-49babae5453f','이희산','heesan6615@naver.com'),('2025-08-05 15:19:40.776580','2025-08-05 15:19:40.776611','462e59c3-28c7-4535-8f11-b17a7d538cdc','최민석','gd10080008@gmail.com'),('2025-08-14 10:38:04.819454','2025-08-14 10:38:04.819468','50f0f830-d162-48d7-bc31-a8d42f315e95','정유진','uuujin0415@gmail.com'),('2025-08-13 14:39:30.738057','2025-08-13 14:39:30.738065','519bcbee-f322-43a4-94f1-2aa34c9252c7','이민희','minhe8564@gmail.com'),('2025-08-06 12:13:13.637117','2025-08-06 12:13:13.637140','61b2cd47-43d9-4ea2-8371-cae468e6b7eb','강해린','robinn2020@naver.com'),('2025-08-11 14:54:21.068906','2025-08-11 14:54:21.068906','666ba03a-a580-4e2b-9b1f-ab7d8f2b60d8','lah0930','lah0930@daum.net'),('2025-08-13 17:02:07.834914','2025-08-13 17:02:07.834921','6cb8638b-76d8-458d-8ff9-163acca92f9f','차은우','qkznl0519@gmail.com'),('2025-08-06 13:59:59.151034','2025-08-11 17:17:38.782355','7316ad40-eb7a-46a1-bbac-f9d73f9984fd','이가람','ddoriboy@naver.com'),('2025-08-11 14:48:49.931830','2025-08-11 14:48:49.931830','86703b7c-ae49-4798-ae7b-fcbd0253b7ad','lah0930','lah0930@naver.com'),('2025-08-05 14:54:41.162238','2025-08-05 14:54:41.162282','90b225f1-f2ee-406e-a24d-5ef53ed40419','김민석[부울경_2반_E206]팀장','kimminseok333@gmail.com'),('2025-08-05 14:53:40.474654','2025-08-05 14:53:40.474678','93b96c4e-817d-4b45-9a8b-25d19eb75da3','박희재','parkheejaeacfa@gmail.com'),('2025-08-13 16:27:43.896843','2025-08-13 16:27:43.896856','95d4828e-ea79-43fb-9976-c2a286738544','싸피','ssafy1303@gmail.com'),('2025-08-08 14:57:23.734556','2025-08-08 14:57:23.734567','a11bf578-4d31-453f-aefa-72a3caa43cb8','테스트','minseok6641@gmail.com'),('2025-08-13 17:03:46.222557','2025-08-13 17:03:46.222565','aaa80048-d93d-4f21-b05d-1d1c3e10433b','김사나','keepa0041@naver.com'),('2025-08-15 21:22:01.919767','2025-08-15 21:22:01.919777','adfb0009-aecb-41a1-b1bb-11e5e669bfb3','이아현','lah0930@gmail.com'),('2025-08-07 11:57:54.108938','2025-08-07 11:57:54.108954','afdbef09-6a78-4ab7-b581-626e803f3c91','[부산_임시1반_박희재]','phj192331@gmail.com'),('2025-08-16 11:58:31.325562','2025-08-16 11:58:31.325592','b3243cb5-d975-496f-83b1-0821a441f4c2','최민석','gd10080008@pukyong.ac.kr'),('2025-08-13 16:31:44.774441','2025-08-13 16:31:44.774450','d3f75365-1a21-41a0-8454-146af7c866e2','전원균','spotydol7@gmail.com'),('2025-08-16 19:24:38.592670','2025-08-16 19:24:38.592678','dba1052d-6a12-4240-b74d-f523663401e0','유니크','ycraah@gmail.com'),('2025-08-13 13:34:06.381498','2025-08-13 13:34:06.381512','e8f3ff06-0059-4c8f-be5f-81ad6bde25ac','원윤서','yoonsu0325@gmail.com'),('2025-08-12 11:53:13.755156','2025-08-12 11:53:50.265786','eea16372-67c8-4451-96d6-66fba0feb36d','이아현','lah930@naver.com');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-16 20:21:02
