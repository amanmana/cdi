-- MySQL dump 10.13  Distrib 5.7.39, for osx10.12 (x86_64)
--
-- Host: 127.0.0.1    Database: frameworkmini
-- ------------------------------------------------------
-- Server version	5.7.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `approvals`
--

DROP TABLE IF EXISTS `approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `approvals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workflow_id` int(11) DEFAULT NULL,
  `step_id` int(11) DEFAULT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `from_step_id` int(11) DEFAULT NULL,
  `to_step_id` int(11) DEFAULT NULL,
  `actor_user_id` int(11) DEFAULT NULL,
  `comment` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approvals`
--

LOCK TABLES `approvals` WRITE;
/*!40000 ALTER TABLE `approvals` DISABLE KEYS */;
INSERT INTO `approvals` VALUES (5,1,1,'job_request',3,'submit',NULL,1,NULL,'Initial submission','2026-01-19 00:33:30'),(6,1,1,'job_request',4,'submit',NULL,1,NULL,'Initial submission','2026-01-19 00:40:25'),(7,1,1,'job_request',5,'submit',NULL,1,NULL,'Initial submission','2026-01-19 00:47:52'),(8,1,1,'job_request',6,'submit',NULL,1,NULL,'Initial submission','2026-01-19 00:50:12'),(9,1,1,'job_request',7,'submit',NULL,1,NULL,'Initial submission','2026-01-19 00:54:21'),(10,1,1,'job_request',8,'submit',NULL,1,NULL,'Initial submission','2026-01-19 01:06:20'),(11,1,1,'job_request',9,'submit',NULL,1,NULL,'Initial submission','2026-01-19 01:07:19'),(12,1,1,'job_request',10,'submit',NULL,1,NULL,'Initial submission','2026-01-19 01:31:18'),(13,1,1,'job_request',11,'submit',NULL,1,NULL,'Initial submission','2026-01-19 01:33:19'),(14,1,1,'job_request',12,'submit',NULL,1,NULL,'Initial submission','2026-01-19 01:34:55'),(15,1,1,'job_request',13,'submit',NULL,1,NULL,'Initial submission','2026-01-19 01:39:30'),(16,1,1,'job_request',14,'submit',NULL,1,NULL,'Initial submission','2026-01-19 01:54:45'),(18,1,1,'job_request',16,'submit',NULL,1,NULL,'Initial submission','2026-01-19 02:01:55'),(19,1,1,'job_request',17,'submit',NULL,1,NULL,'Initial submission','2026-01-19 10:07:13'),(20,1,1,'job_request',17,'reject',1,4,1,'reject','2026-01-19 10:16:53'),(21,1,1,'job_request',16,'reject',1,4,1,'Tak boleh buat','2026-01-19 02:19:51'),(24,1,1,'job_request',20,'submit',NULL,1,NULL,'Initial submission','2026-01-19 02:30:50'),(31,1,1,'job_request',13,'approve',1,2,2,'','2026-01-19 03:10:24'),(32,1,1,'job_request',11,'approve',1,2,2,'test1','2026-01-19 03:25:15'),(33,1,2,'job_request',11,'staff_complete',NULL,NULL,18,'Completed their assigned task.','2026-01-19 03:26:11'),(34,1,2,'job_request',11,'staff_complete',NULL,NULL,17,'Completed their assigned task.','2026-01-19 03:26:45'),(35,1,1,'job_request',9,'approve',1,2,2,'','2026-01-19 03:33:17'),(36,1,2,'job_request',9,'staff_complete',NULL,NULL,17,'Completed their assigned task.','2026-01-19 03:33:26'),(37,1,1,'job_request',8,'approve',1,2,2,'','2026-01-19 03:53:20'),(38,1,1,'job_request',4,'approve',1,2,2,'kerja baharu','2026-01-19 06:23:25'),(39,1,2,'job_request',4,'staff_complete',NULL,NULL,17,'Completed their assigned task.','2026-01-19 06:31:57'),(40,1,1,'job_request',3,'approve',1,2,2,'','2026-01-19 07:01:06'),(41,1,2,'job_request',3,'staff_complete',NULL,NULL,17,'Completed their assigned task.','2026-01-19 07:21:58'),(42,1,1,'job_request',22,'submit',NULL,1,NULL,'Initial submission','2026-01-19 07:51:13'),(43,1,1,'job_request',22,'approve',1,2,2,'buat','2026-01-19 07:52:04'),(44,1,2,'job_request',8,'staff_complete',NULL,NULL,18,'Completed their assigned task.','2026-01-19 08:01:49'),(45,1,2,'job_request',8,'staff_complete',NULL,NULL,17,'Completed their assigned task.','2026-01-19 08:03:14'),(46,1,1,'job_request',23,'submit',NULL,1,NULL,'Initial submission','2026-01-19 08:04:24'),(47,1,1,'job_request',24,'submit',NULL,1,NULL,'Initial submission','2026-01-19 08:04:57'),(48,1,1,'job_request',24,'approve',1,2,13,'','2026-01-19 08:06:22'),(49,1,2,'job_request',24,'staff_complete',NULL,NULL,14,'Completed their assigned task.','2026-01-19 08:07:21'),(50,1,1,'job_request',23,'approve',1,2,2,'siapkan kerja ini','2026-01-20 00:37:35'),(51,1,1,'job_request',25,'submit',NULL,1,NULL,'Initial submission','2026-01-20 00:41:42'),(52,1,1,'job_request',25,'approve',1,2,2,'text ini tidak perlu tunjuk','2026-01-20 00:42:42'),(53,1,1,'job_request',26,'submit',NULL,1,NULL,'Initial submission','2026-01-20 03:06:06'),(54,1,1,'job_request',26,'approve',1,2,2,'ok la','2026-01-20 03:08:02'),(55,1,1,'job_request',27,'submit',NULL,1,NULL,'Initial submission','2026-01-20 08:00:46'),(56,1,2,'job_request',26,'staff_complete',NULL,NULL,17,'Completed their assigned task.','2026-01-20 08:01:38'),(57,1,1,'job_request',28,'submit',NULL,1,NULL,'Initial submission','2026-01-20 08:21:48'),(58,1,1,'job_request',29,'submit',NULL,1,NULL,'Initial submission','2026-01-20 08:29:06'),(59,1,1,'job_request',30,'submit',NULL,1,NULL,'Initial submission','2026-01-20 08:31:02'),(60,1,1,'job_request',31,'submit',NULL,1,NULL,'Initial submission','2026-01-20 08:45:51'),(61,1,1,'job_request',32,'submit',NULL,1,NULL,'Initial submission','2026-01-20 08:53:57'),(62,1,1,'job_request',33,'submit',NULL,1,NULL,'Initial submission','2026-01-20 09:16:29'),(63,1,1,'job_request',34,'submit',NULL,1,NULL,'Initial submission','2026-01-20 09:16:51'),(64,1,1,'job_request',34,'approve',1,2,2,'','2026-01-20 09:20:08'),(65,1,1,'job_request',32,'approve',1,2,2,'Optional comment will be here','2026-01-20 09:20:56'),(66,1,1,'job_request',35,'submit',NULL,1,NULL,'Initial submission','2026-01-20 09:31:37'),(67,1,1,'job_request',35,'approve',1,2,2,'test hello','2026-01-20 09:32:17'),(68,1,1,'job_request',31,'approve',1,2,2,'','2026-01-20 09:42:32'),(69,1,1,'job_request',36,'submit',NULL,1,NULL,'Initial submission','2026-01-21 00:57:13'),(70,1,1,'job_request',36,'approve',1,2,2,'','2026-01-21 00:59:29'),(71,1,2,'job_request',36,'staff_complete',NULL,NULL,17,'Completed their assigned task.','2026-01-21 01:03:21'),(72,1,2,'job_request',36,'staff_complete',NULL,NULL,18,'Completed their assigned task.','2026-01-21 01:06:11'),(73,1,1,'job_request',27,'reject',1,4,2,'This is reject reason','2026-01-21 01:12:16'),(74,1,1,'job_request',28,'approve',1,2,2,'','2026-01-21 01:42:09'),(75,1,2,'job_request',28,'staff_complete',NULL,NULL,18,'Completed their assigned task.','2026-01-21 01:44:26'),(76,1,2,'job_request',28,'staff_complete',NULL,NULL,18,'Completed their assigned task.','2026-01-21 01:46:39'),(77,1,1,'job_request',29,'approve',1,2,2,'hello deadline','2026-01-21 02:02:11'),(78,1,1,'job_request',30,'approve',1,2,2,'','2026-01-21 02:05:44'),(79,1,1,'job_request',37,'submit',NULL,1,NULL,'Initial submission','2026-01-21 02:14:57'),(80,1,1,'job_request',37,'approve',1,2,2,'message kepada Joe','2026-01-21 02:15:22'),(81,1,2,'job_request',37,'invite',NULL,NULL,20,'Invited Akmal, Lan to collaborate: buat semua kerja ini','2026-01-21 02:22:02'),(82,1,2,'job_request',37,'invite',NULL,NULL,20,'Invited Lan to collaborate: ok buat','2026-01-21 02:22:52'),(83,1,2,'job_request',37,'update_team',NULL,NULL,2,'Updated team assignment to: Joe','2026-01-21 02:25:38'),(84,1,2,'job_request',37,'invite',NULL,NULL,20,'Invited Akmal to collaborate: kerja1','2026-01-21 02:26:09'),(85,1,2,'job_request',37,'update_team',NULL,NULL,2,'Updated team assignment to: Akmal, Joe, Lan','2026-01-21 02:26:27'),(86,1,2,'job_request',37,'staff_complete',NULL,NULL,20,'Completed their assigned task.','2026-01-21 02:31:50'),(87,1,2,'job_request',37,'report',NULL,NULL,18,'Added a progress report: Banyak lagi kerja','2026-01-21 03:27:36'),(88,1,2,'job_request',37,'report',NULL,NULL,18,'Added a progress report: seterusnya','2026-01-21 03:27:44'),(89,1,2,'job_request',37,'report',NULL,NULL,18,'Added a progress report: dan lagi','2026-01-21 03:27:52'),(90,1,2,'job_request',37,'staff_complete',NULL,NULL,18,'Completed their assigned task.','2026-01-21 03:29:07'),(91,1,2,'job_request',37,'report',NULL,NULL,18,'Added a progress report: habis','2026-01-21 03:29:33'),(92,1,2,'job_request',37,'report',NULL,NULL,17,'Added a progress report: Ini report Lan tulis','2026-01-21 03:51:52'),(93,1,2,'job_request',35,'staff_complete',NULL,NULL,18,'Completed their assigned task.','2026-01-21 06:49:02'),(94,1,1,'job_request',38,'submit',NULL,1,NULL,'Initial submission','2026-01-21 07:09:30'),(95,1,1,'job_request',38,'approve',1,2,2,'ok 309','2026-01-21 07:16:14'),(96,1,2,'job_request',38,'report',NULL,NULL,18,'Added a progress report: start kerja 309','2026-01-21 07:16:41'),(97,1,2,'job_request',38,'invite',NULL,NULL,18,'Invited Joe to collaborate: Joe join 309','2026-01-21 07:16:59'),(98,1,2,'job_request',38,'report',NULL,NULL,18,'Added a progress report: banyak pulak kerja','2026-01-21 07:17:25'),(99,1,2,'job_request',38,'report',NULL,NULL,18,'Added a progress report: ok','2026-01-21 07:37:13'),(100,1,2,'job_request',38,'staff_complete',NULL,NULL,18,'Completed their assigned task.','2026-01-21 07:37:18'),(101,1,1,'job_request',39,'submit',NULL,1,NULL,'Initial submission','2026-01-21 08:36:42'),(102,1,1,'job_request',39,'approve',1,2,13,'hello writer','2026-01-21 08:37:16'),(103,1,2,'job_request',39,'report',NULL,NULL,14,'Added a progress report: start kerja','2026-01-21 08:38:51'),(104,1,2,'job_request',39,'report',NULL,NULL,14,'Added a progress report: buat kerja lagi2','2026-01-21 08:39:01'),(105,1,2,'job_request',39,'report',NULL,NULL,14,'Added a progress report: buat kerja 3','2026-01-21 08:39:07'),(106,1,2,'job_request',32,'report',NULL,NULL,17,'Added a progress report: Nota penting','2026-01-21 09:25:17'),(107,1,2,'job_request',32,'report',NULL,NULL,17,'Added a progress report: lagi satu note','2026-01-21 09:26:43'),(108,1,2,'job_request',34,'update_team',NULL,NULL,2,'Updated team assignment to: Joe, Lan','2026-01-21 09:29:01'),(109,1,2,'job_request',34,'staff_complete',NULL,NULL,20,'Completed their assigned task.','2026-01-21 09:29:40'),(110,1,2,'job_request',34,'update_team',NULL,NULL,2,'Updated team assignment to: Joe','2026-01-21 09:34:37'),(111,1,2,'job_request',34,'staff_complete',NULL,NULL,20,'Completed their assigned task.','2026-01-21 09:38:28'),(112,1,2,'job_request',38,'update_team',NULL,NULL,2,'Updated team assignment to: Akmal, Joe','2026-01-21 09:40:06'),(113,1,2,'job_request',38,'staff_complete',NULL,NULL,20,'Completed their assigned task.','2026-01-21 09:43:15'),(114,1,2,'job_request',38,'update_team',NULL,NULL,2,'Updated team assignment to: Joe','2026-01-21 09:43:27'),(115,1,1,'job_request',40,'submit',NULL,1,NULL,'Initial submission','2026-01-22 00:59:07'),(116,1,1,'job_request',41,'submit',NULL,1,NULL,'Initial submission','2026-01-22 01:05:07'),(117,1,1,'job_request',40,'approve',1,2,2,'selesaikan kerja ini','2026-01-22 01:11:11'),(118,1,2,'job_request',40,'update_team',NULL,NULL,2,'Updated team assignment to: Akmal, pari, Roslan','2026-01-22 01:12:29'),(119,1,2,'job_request',40,'update_team',NULL,NULL,2,'Updated team assignment to: Akmal, Roslan','2026-01-22 01:12:48'),(120,1,2,'job_request',40,'update_team',NULL,NULL,2,'Updated team assignment to: Akmal, Joe, Roslan','2026-01-22 01:12:54'),(121,1,2,'job_request',40,'staff_complete',NULL,NULL,18,'Completed their assigned task.','2026-01-22 01:13:03'),(122,1,2,'job_request',40,'staff_complete',NULL,NULL,17,'Completed their assigned task.','2026-01-22 01:13:42'),(123,1,2,'job_request',40,'update_team',NULL,NULL,2,'Updated team assignment to: Akmal, Roslan','2026-01-22 01:14:17'),(124,1,1,'job_request',41,'approve',1,2,2,'','2026-01-22 04:58:37'),(125,1,2,'job_request',41,'staff_complete',NULL,NULL,24,'Completed their assigned task.','2026-01-22 04:59:19'),(126,1,1,'job_request',42,'submit',NULL,1,NULL,'Initial submission','2026-01-22 05:07:40'),(127,1,1,'job_request',42,'approve',1,2,2,'','2026-01-22 05:10:31'),(128,1,2,'job_request',42,'staff_complete',NULL,NULL,25,'Completed their assigned task.','2026-01-22 05:10:57'),(129,1,1,'job_request',43,'submit',NULL,1,NULL,'Initial submission','2026-01-22 05:13:25'),(130,1,1,'job_request',43,'approve',1,2,2,'','2026-01-22 05:18:47'),(131,1,2,'job_request',43,'staff_complete',NULL,NULL,27,'Completed their assigned task.','2026-01-22 05:19:11'),(132,1,1,'job_request',44,'submit',NULL,1,NULL,'Initial submission','2026-01-22 05:21:26'),(133,1,1,'job_request',44,'approve',1,2,2,'','2026-01-22 05:22:59'),(134,1,2,'job_request',44,'staff_complete',NULL,NULL,28,'Completed their assigned task.','2026-01-22 05:23:23'),(135,NULL,NULL,'system',0,'ARCHIVED_STAFF',NULL,NULL,2,'Archived staff member: baru','2026-01-22 05:23:48'),(136,1,1,'job_request',45,'submit',NULL,1,NULL,'Initial submission','2026-01-22 06:08:27'),(137,1,1,'job_request',45,'approve',1,2,21,'test from acting manager','2026-01-22 06:32:17'),(138,1,2,'job_request',45,'staff_complete',NULL,NULL,18,'Completed their assigned task.','2026-01-22 06:33:40'),(139,1,2,'job_request',45,'report',NULL,NULL,21,'Added a progress report: test add report','2026-01-22 06:34:12'),(140,1,2,'job_request',45,'report',NULL,NULL,21,'Added a progress report: test 2','2026-01-22 06:34:17'),(141,1,2,'job_request',45,'staff_complete',NULL,NULL,21,'Completed their assigned task.','2026-01-22 06:34:27'),(142,1,2,'job_request',45,'approve',2,3,21,'Workflow closed today','2026-01-22 06:35:14');
/*!40000 ALTER TABLE `approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delegations`
--

DROP TABLE IF EXISTS `delegations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `delegations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `manager_id` int(11) NOT NULL,
  `delegate_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delegations`
--

LOCK TABLES `delegations` WRITE;
/*!40000 ALTER TABLE `delegations` DISABLE KEYS */;
INSERT INTO `delegations` VALUES (1,2,21,'2026-01-22','2026-01-24','inactive','2026-01-22 06:05:14'),(2,2,21,'2026-01-21','2026-01-23','inactive','2026-01-22 06:09:25');
/*!40000 ALTER TABLE `delegations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_request_staff`
--

DROP TABLE IF EXISTS `job_request_staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_request_staff` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_request_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `job_request_id` (`job_request_id`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `job_request_staff_ibfk_1` FOREIGN KEY (`job_request_id`) REFERENCES `job_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `job_request_staff_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_request_staff`
--

LOCK TABLES `job_request_staff` WRITE;
/*!40000 ALTER TABLE `job_request_staff` DISABLE KEYS */;
INSERT INTO `job_request_staff` VALUES (1,13,18,'2026-01-19 11:19:27','2026-01-19 11:10:24'),(2,13,17,'2026-01-19 11:18:15','2026-01-19 11:10:24'),(3,11,18,'2026-01-19 11:26:11','2026-01-19 11:25:15'),(4,11,17,'2026-01-19 11:26:45','2026-01-19 11:25:15'),(5,9,17,'2026-01-19 11:33:26','2026-01-19 11:33:17'),(10,3,17,'2026-01-19 15:21:58','2026-01-19 15:01:06'),(11,3,18,NULL,'2026-01-19 15:01:06'),(15,8,17,'2026-01-19 16:03:14','2026-01-19 15:37:42'),(16,8,18,'2026-01-19 16:01:49','2026-01-19 15:37:42'),(19,24,14,'2026-01-19 16:07:21','2026-01-19 16:06:22'),(20,4,18,NULL,'2026-01-19 17:24:14'),(21,22,18,NULL,'2026-01-19 17:31:13'),(22,4,17,NULL,'2026-01-20 08:31:09'),(23,22,17,NULL,'2026-01-20 08:32:29'),(24,23,17,NULL,'2026-01-20 08:37:34'),(25,25,17,NULL,'2026-01-20 08:42:42'),(26,26,18,NULL,'2026-01-20 11:08:02'),(27,26,17,'2026-01-20 16:01:38','2026-01-20 16:01:24'),(32,32,17,NULL,'2026-01-20 17:21:09'),(33,35,18,'2026-01-21 14:49:02','2026-01-20 17:32:17'),(34,35,17,NULL,'2026-01-20 17:32:17'),(39,36,18,'2026-01-21 09:06:11','2026-01-21 08:59:29'),(40,36,17,'2026-01-21 09:03:21','2026-01-21 08:59:29'),(46,28,18,NULL,'2026-01-21 09:49:55'),(49,31,18,NULL,'2026-01-21 09:59:01'),(50,31,17,NULL,'2026-01-21 09:59:01'),(51,31,20,NULL,'2026-01-21 09:59:15'),(52,29,20,NULL,'2026-01-21 10:02:11'),(53,30,18,NULL,'2026-01-21 10:05:44'),(54,35,20,NULL,'2026-01-21 10:09:19'),(55,29,18,NULL,'2026-01-21 10:13:44'),(56,29,17,NULL,'2026-01-21 10:13:44'),(67,37,18,'2026-01-21 11:29:07','2026-01-21 10:26:27'),(68,37,20,'2026-01-21 10:31:50','2026-01-21 10:26:27'),(69,37,17,NULL,'2026-01-21 10:26:27'),(73,39,14,NULL,'2026-01-21 16:37:16'),(76,34,20,'2026-01-21 17:38:28','2026-01-21 17:34:37'),(78,38,20,'2026-01-21 17:43:15','2026-01-21 17:40:06'),(79,40,18,'2026-01-22 09:13:03','2026-01-22 09:11:11'),(81,40,17,'2026-01-22 09:13:42','2026-01-22 09:12:29'),(84,42,25,'2026-01-22 13:10:57','2026-01-22 13:10:31'),(85,43,27,'2026-01-22 13:19:11','2026-01-22 13:18:47'),(86,44,28,'2026-01-22 13:23:23','2026-01-22 13:22:59'),(87,45,18,'2026-01-22 14:33:39','2026-01-22 14:32:17'),(88,45,21,'2026-01-22 14:34:27','2026-01-22 14:32:17');
/*!40000 ALTER TABLE `job_request_staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_requests`
--

DROP TABLE IF EXISTS `job_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_no` varchar(20) DEFAULT NULL,
  `client_name` varchar(255) NOT NULL,
  `client_email` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `additional_data` longtext,
  `start_date` date DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `workflow_id` int(11) DEFAULT NULL,
  `current_step_id` int(11) DEFAULT NULL,
  `assigned_staff_id` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_no` (`ticket_no`),
  KEY `fk_assigned_staff` (`assigned_staff_id`),
  CONSTRAINT `fk_assigned_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_requests`
--

LOCK TABLES `job_requests` WRITE;
/*!40000 ALTER TABLE `job_requests` DISABLE KEYS */;
INSERT INTO `job_requests` VALUES (3,'UT403762','test','test@mail.com','Test project','tell about test',NULL,'2026-01-19','2026-01-22','Graphic',1,2,NULL,'staff_processing','2026-01-19 00:33:30','2026-01-19 07:01:06'),(4,'VX835742','test2','test@mail.com','test2 title','tell about test2',NULL,'2026-01-19','2026-01-21','Graphic',1,2,NULL,'staff_processing','2026-01-19 00:40:25','2026-01-19 06:23:25'),(5,'XT750813','test3','test@mail.com','test3 title','test 3 desc',NULL,NULL,NULL,'Socmed',1,1,NULL,'manager_approval','2026-01-19 00:47:52','2026-01-22 06:48:13'),(6,'OK864519','test4','test@mail.com','test 4 title','test 4 desc',NULL,NULL,NULL,'Events2',1,1,NULL,'manager_approval','2026-01-19 00:50:12','2026-01-22 06:47:03'),(7,'QC542096','sadasd','aa@asa.com','sdsds','sdsds ssadsad',NULL,NULL,NULL,'Events2',1,1,NULL,'manager_approval','2026-01-19 00:54:21','2026-01-22 06:47:03'),(8,'ZL183095','test client','test@mail.com','wwewew','This is description',NULL,'2026-01-19','2026-01-23','Graphic',1,2,NULL,'staff_processing','2026-01-19 01:06:20','2026-01-19 07:37:57'),(9,'RD710438','dfdfdsf','dfds@maial.com','sdsdsdsd','sdsdsdsd dssdsfdfd',NULL,NULL,NULL,'Graphic',1,2,NULL,'staff_processing','2026-01-19 01:07:19','2026-01-19 03:33:17'),(10,'KY092641','testa','testta@test.com','project','test cjjsh mmsss',NULL,NULL,NULL,'Writer',1,1,NULL,'manager_approval','2026-01-19 01:31:18','2026-01-19 02:17:56'),(11,'RB104765','dsfsd','dsfdsf@test.com','sdsdsd','sdsdsds sddsd',NULL,NULL,NULL,'Graphic',1,2,NULL,'staff_processing','2026-01-19 01:33:19','2026-01-19 03:25:15'),(12,'JK204675','sdasds','asdasd@asasa.com','sdsdsd',' sdsdf dsfdf dsdwfdw',NULL,NULL,NULL,'Socmed',1,1,NULL,'manager_approval','2026-01-19 01:34:55','2026-01-22 06:48:13'),(13,'SG590743','test','test@mimos.my','test user','ssdsds ssdsd ddfdfd',NULL,NULL,NULL,'Graphic',1,2,NULL,'staff_processing','2026-01-19 01:39:30','2026-01-19 03:10:24'),(14,'AC234157','sadsd','asdasd@asasas.com','sdsdsdsd','sdsdsdsds dsfdf sdfsf',NULL,NULL,NULL,'Socmed',1,1,NULL,'manager_approval','2026-01-19 01:54:45','2026-01-22 06:48:13'),(16,'EU345798','gsfdggd','test@mimos.my','asdasd sdfdefds sdfdfsd','sdfdsfds sdfsdf sdfdf',NULL,NULL,NULL,'Writer',1,4,NULL,'rejected','2026-01-19 02:01:55','2026-01-19 02:19:51'),(17,'PQ129805','test','test@mimos.my','asdasasa asasasa 1111','asasas qasasass asasss',NULL,NULL,NULL,'Events2',1,4,NULL,'rejected','2026-01-19 10:07:13','2026-01-22 06:47:03'),(20,'XG517026','aSasa','test1@mimos.my','asdsadsd sadsadsad','asdsadsad sadasdad',NULL,NULL,NULL,'Socmed',1,1,NULL,'manager_approval','2026-01-19 02:30:50','2026-01-22 06:48:13'),(22,'HX830642','kes1','kes@mimos.my','kes title','test kes 1masasasa ',NULL,'2026-01-21','2026-01-28','Graphic',1,2,NULL,'staff_processing','2026-01-19 07:51:13','2026-01-19 07:52:04'),(23,'TX973208','sara','sara@mimos.my','mimos technology website','buat graphic',NULL,'2026-01-30','2026-01-31','Graphic',1,2,NULL,'staff_processing','2026-01-19 08:04:24','2026-01-20 00:37:35'),(24,'MP635048','sara','sara@mimos.my','mimos technology website','Tulis content',NULL,'2026-01-19','2026-01-20','Writer',1,2,NULL,'staff_processing','2026-01-19 08:04:57','2026-01-19 08:06:22'),(25,'QB493158','soli','soli@mimos.my','soli title','solar works poster',NULL,'2026-02-11','2026-02-12','Graphic',1,2,NULL,'staff_processing','2026-01-20 00:41:42','2026-01-20 00:42:42'),(26,'FO574213','Hello','hello@mimos.my','teste title','check test content',NULL,'2026-01-22','2026-01-24','Graphic123',1,2,NULL,'staff_processing','2026-01-20 03:06:06','2026-01-20 03:08:02'),(27,'LE249087','Salman client','client@mimos.my','1111','ffyf gff cycyfcy',NULL,NULL,NULL,'Graphic',1,4,NULL,'rejected','2026-01-20 08:00:46','2026-01-21 01:12:16'),(28,'NO586174','Salman client','client@mimos.my','test form','test detail desc','{\"text-1768897120250-0\":\"test field 1\",\"textarea-1768897128516-0\":\"test text area\"}','2026-01-21','2026-01-23','Graphic',1,2,NULL,'staff_processing','2026-01-20 08:21:48','2026-01-21 01:42:09'),(29,'CB461397','Salman client','client@mimos.my','New Project','Maklumat lengkap disini','{\"text-1768897120250-0\":\"Mamat\",\"textarea-1768897128516-0\":\"sedikit makluman disini\"}','2026-01-21','2026-01-29','Graphic',1,2,NULL,'staff_processing','2026-01-20 08:29:06','2026-01-21 02:05:15'),(30,'ZR892413','Salman client','client@mimos.my','New Name form','Detail info disini','{\"Staff-Name\":\"Abu\",\"Information\":\"Info yang perlu\"}','2026-01-22','2026-01-27','Graphic',1,2,NULL,'staff_processing','2026-01-20 08:31:02','2026-01-21 02:07:45'),(31,'QT208359','Salman client','client@mimos.my','test line','detail desc','{\"Staff-Name\":\"style name\",\"Information\":\"info name\"}','2026-01-20','2026-01-21','Graphic',1,2,NULL,'staff_processing','2026-01-20 08:45:51','2026-01-20 09:42:32'),(32,'WK429086','Salman client','client@mimos.my','453',NULL,'{\"Staff-Name\":\"hello staff\",\"Information\":\"Information text\",\"IC-number\":\"121421422526\",\"Detailed-Description\":\"Detail Description here Detail Description here Detail Description here Detail Description here Detail Description here\"}','2026-01-20','2026-01-21','Graphic',1,2,NULL,'staff_processing','2026-01-20 08:53:57','2026-01-20 09:20:56'),(33,'JQ641703','johan','johan@mimos.my',NULL,NULL,NULL,NULL,NULL,'Events2',1,1,NULL,'manager_approval','2026-01-20 09:16:29','2026-01-22 06:47:03'),(34,'SY035719','xx','xx@mimos.my',NULL,NULL,'{\"Staff-Name\":\"\",\"Information\":\"\",\"IC-number\":\"\",\"Detailed-Description\":\"\"}','2026-01-21','2026-01-22','Graphic',1,2,NULL,'staff_processing','2026-01-20 09:16:51','2026-01-20 09:20:08'),(35,'RT248790','Mantoya','mantoya@mimos.my',NULL,NULL,'{\"Staff-Name\":\"helloname\",\"Information\":\"\",\"IC-number\":\"\",\"Detailed-Description\":\"\"}','2026-01-20','2026-01-24','Graphic',1,2,NULL,'staff_processing','2026-01-20 09:31:37','2026-01-20 09:32:17'),(36,'FC672185','titlename','title@mimos.my','test title',NULL,'{\"Staff-Name\":\"staff name\",\"Information\":\"\",\"IC-number\":\"\",\"Detailed-Description\":\"\",\"text-1768954901020-0\":\"\",\"number-1768954906955-0\":\"\",\"select-1768954908822-0\":\"option-1\",\"checkbox-group-1768954910322-0\":[\"option-1\"],\"date-1768954912489-0\":\"2026-01-23\",\"hidden-1768954914940-0\":\"\"}','2026-01-21','2026-01-22','Graphic',1,2,NULL,'staff_processing','2026-01-21 00:57:13','2026-01-21 00:59:29'),(37,'RZ748526','testx','testx@mimos.my','testxtitle',NULL,'{\"sample-field\":\"test1\",\"Detailed-Description\":\"test2\"}','2026-01-12','2026-01-20','Graphic',1,2,NULL,'staff_processing','2026-01-21 02:14:57','2026-01-21 06:57:32'),(38,'SL156938','309','tt@mimos.my','309 title',NULL,'{\"sample-field\":\"1\",\"Detailed-Description\":\"2\"}','2026-01-24','2026-01-25','Graphic',1,2,NULL,'staff_processing','2026-01-21 07:09:30','2026-01-21 07:16:14'),(39,'JE307219','hellowriter','hello@mimos.my','hello title writer',NULL,'{\"text-1768984433300-0\":\"textfield writer\",\"textarea-1768984434249-0\":\"text area writer\",\"select-1768984539333-0\":\"option-3\"}','2026-01-30','2026-01-31','Writer',1,2,NULL,'staff_processing','2026-01-21 08:36:42','2026-01-21 08:37:16'),(40,'BE382901','Mr. Email','mail@mimos.my','Hello Email',NULL,'{\"sample-field\":\"sample text\",\"Detailed-Description\":\"sample description\"}','2026-01-22','2026-01-23','Graphic',1,2,NULL,'staff_processing','2026-01-22 00:59:07','2026-01-22 01:11:11'),(41,'LN063247','mr email2','mail2@mimos.my','mail2 title',NULL,'{\"sample-field\":\"test2\",\"Detailed-Description\":\"test22\"}','2026-01-22','2026-01-23','Graphic',1,2,NULL,'staff_processing','2026-01-22 01:05:07','2026-01-22 04:58:37'),(42,'XL154786','staffsementara','sementaraform@mimos.my','sementara job',NULL,'{\"sample-field\":\"1\",\"Detailed-Description\":\"2\"}','2026-01-22','2026-01-23','Graphic',1,2,NULL,'staff_processing','2026-01-22 05:07:40','2026-01-22 05:10:31'),(43,'MR705621','temp2','temp2@mimos.my','temp2t',NULL,'{\"sample-field\":\"1\",\"Detailed-Description\":\"2\"}','2026-01-22','2026-01-24','Graphic',1,2,NULL,'staff_processing','2026-01-22 05:13:25','2026-01-22 05:18:47'),(44,'HV340659','arc','arc@mimos.my','archive',NULL,'{\"sample-field\":\"1\",\"Detailed-Description\":\"2\"}','2026-01-22','2026-01-25','Graphic',1,2,NULL,'staff_processing','2026-01-22 05:21:26','2026-01-22 05:22:59'),(45,'KC457608','test approval','testapprov@mimos.my','test approv',NULL,'{\"sample-field\":\"\",\"Detailed-Description\":\"\"}','2026-01-22','2026-01-24','Graphic',1,3,NULL,'completed','2026-01-22 06:08:27','2026-01-22 06:35:14');
/*!40000 ALTER TABLE `job_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_staff_reports`
--

DROP TABLE IF EXISTS `job_staff_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_staff_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_request_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `report_text` text NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `job_request_id` (`job_request_id`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `job_staff_reports_ibfk_1` FOREIGN KEY (`job_request_id`) REFERENCES `job_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `job_staff_reports_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_staff_reports`
--

LOCK TABLES `job_staff_reports` WRITE;
/*!40000 ALTER TABLE `job_staff_reports` DISABLE KEYS */;
INSERT INTO `job_staff_reports` VALUES (1,37,18,'buat header pada hari ini juga','2026-01-21 10:49:08','2026-01-21 10:49:18'),(4,30,18,'sekarang kerja New Name form','2026-01-19 00:00:00','2026-01-21 16:45:17'),(5,37,18,'Banyak lagi kerja','2026-01-20 11:27:36','2026-01-21 16:45:11'),(6,37,18,'seterusnya','2026-01-21 11:27:44','2026-01-21 11:27:44'),(7,37,18,'dan lagi','2026-01-13 00:00:00','2026-01-21 14:42:19'),(9,37,17,'Ini report Lan tulis','2026-01-21 11:51:52','2026-01-21 11:51:52'),(10,38,18,'start kerja 309','2026-01-21 15:16:41','2026-01-21 15:16:41'),(11,38,18,'banyak pulak kerja','2026-01-21 15:17:25','2026-01-21 15:17:25'),(12,38,18,'ok','2026-02-10 15:37:13','2026-01-21 17:21:07'),(13,39,14,'start kerja','2026-01-21 16:38:51','2026-01-21 16:38:51'),(14,39,14,'buat kerja lagi2','2026-01-21 16:39:01','2026-01-21 16:39:01'),(15,39,14,'buat kerja 3','2026-01-21 16:39:07','2026-01-21 16:39:07'),(16,32,17,'Nota penting','2026-01-21 17:25:17','2026-01-21 17:25:17'),(17,32,17,'lagi satu note','2026-01-21 17:26:43','2026-01-21 17:26:43'),(18,45,21,'test add report','2026-01-22 14:34:12','2026-01-22 14:34:12'),(19,45,21,'test 2','2026-01-22 14:34:17','2026-01-22 14:34:17');
/*!40000 ALTER TABLE `job_staff_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES ('akhmal@mimos.my','47cdd41a58a04574a9372dd1eda8c062b514084b65bec8032b57eadbd6967aec','2026-01-22 01:34:59'),('amanmana@gmail.com','793c581bd3ab5026b4daaf17e737dc3d3fe6a1a33c3b5a95c0f2cf833185e386','2026-01-22 01:45:13');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `key` varchar(50) NOT NULL,
  `value` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('allow_manager_delete','0','2026-01-19 03:44:45','2026-01-19 03:48:37'),('app_name','Corporate Communication & Identity','2026-01-21 01:26:38','2026-01-21 01:26:38'),('footer_text','CCI','2026-01-21 01:26:38','2026-01-21 01:26:38');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_invitations`
--

DROP TABLE IF EXISTS `task_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `task_invitations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_request_id` int(11) NOT NULL,
  `inviter_id` int(11) NOT NULL COMMENT 'Staff who sent the invitation',
  `invitee_id` int(11) NOT NULL COMMENT 'Staff who was invited',
  `task_description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description of what the invitee should do',
  `status` enum('pending','accepted','declined') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_invitation` (`job_request_id`,`invitee_id`),
  KEY `inviter_id` (`inviter_id`),
  KEY `invitee_id` (`invitee_id`),
  CONSTRAINT `task_invitations_ibfk_1` FOREIGN KEY (`job_request_id`) REFERENCES `job_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_invitations_ibfk_2` FOREIGN KEY (`inviter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_invitations_ibfk_3` FOREIGN KEY (`invitee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_invitations`
--

LOCK TABLES `task_invitations` WRITE;
/*!40000 ALTER TABLE `task_invitations` DISABLE KEYS */;
INSERT INTO `task_invitations` VALUES (1,4,18,17,'hello world','accepted','2026-01-20 00:31:09','2026-01-20 00:31:09'),(2,22,18,17,'sdsd daffs','accepted','2026-01-20 00:32:29','2026-01-20 00:32:29'),(3,26,18,17,'dsfdf dsfsfdf','accepted','2026-01-20 08:01:24','2026-01-20 08:01:24'),(4,28,18,20,'test joe','accepted','2026-01-21 01:43:47','2026-01-21 01:43:47'),(5,28,18,17,'test lan','accepted','2026-01-21 01:44:17','2026-01-21 01:44:17'),(9,31,18,20,'test one','accepted','2026-01-21 01:59:15','2026-01-21 01:59:15'),(10,35,17,20,'Message untuk Joe','accepted','2026-01-21 02:09:19','2026-01-21 02:09:19'),(11,29,20,18,'Selamt Datang Semua','accepted','2026-01-21 02:13:44','2026-01-21 02:13:44'),(12,29,20,17,'Selamt Datang Semua','accepted','2026-01-21 02:13:44','2026-01-21 02:13:44');
/*!40000 ALTER TABLE `task_invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `form_schema` longtext,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,'Graphic','[{\"type\":\"text\",\"required\":false,\"label\":\"Sample Field\",\"className\":\"form-control\",\"name\":\"sample-field\",\"access\":false,\"subtype\":\"text\"},{\"type\":\"textarea\",\"required\":false,\"label\":\"<span style=\\\"color: rgb(51, 65, 85); font-weight: 700;\\\">Detailed Description</span>\",\"className\":\"form-control\",\"name\":\"Detailed-Description\",\"access\":false,\"subtype\":\"textarea\"}]','2026-01-20 02:53:34'),(2,'Socmed',NULL,'2026-01-20 02:53:34'),(3,'Events2',NULL,'2026-01-20 02:53:34'),(5,'Writer','[{\"type\":\"text\",\"required\":false,\"label\":\"Text Field\",\"className\":\"form-control\",\"name\":\"text-1768984433300-0\",\"access\":false,\"subtype\":\"text\"},{\"type\":\"textarea\",\"required\":false,\"label\":\"Text Area\",\"className\":\"form-control\",\"name\":\"textarea-1768984434249-0\",\"access\":false,\"subtype\":\"textarea\"},{\"type\":\"select\",\"required\":false,\"label\":\"Select\",\"className\":\"form-control\",\"name\":\"select-1768984539333-0\",\"access\":false,\"multiple\":false,\"values\":[{\"label\":\"Option 1\",\"value\":\"option-1\",\"selected\":true},{\"label\":\"Option 2\",\"value\":\"option-2\",\"selected\":false},{\"label\":\"Option 3\",\"value\":\"option-3\",\"selected\":false}]}]','2026-01-20 02:55:16');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','manager','staff','client') NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `status` enum('active','archived') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','admin@example.com','$2y$10$V.G2F.g7oS6Iai3FqTqThu1GtrRrgVpK1G8ddte1.HjzQiDDHDIci','admin',NULL,'active','2026-01-16 11:52:44'),(2,'Hazmi','manager@example.com','$2y$10$V.G2F.g7oS6Iai3FqTqThu1GtrRrgVpK1G8ddte1.HjzQiDDHDIci','manager','Graphic','active','2026-01-16 11:52:44'),(3,'Staff Siti','staff@example.com','$2y$10$2MnEfJc1MhumyJY.8MWY.eTQ..PRIouFWoohedLx9BQO4Sq31uRN2','staff','Socmed','active','2026-01-16 11:52:44'),(11,'Man events','events@example.com','$2y$10$c/0HAbuG4Os6GWgLcP8bn.PnW/1mxcm7bcSPFcucDLlBCc.T4kUmi','manager','Events2','active','2026-01-16 09:23:59'),(12,'Man SocMed','socmed@example.com','$2y$10$fEB4WjHkouZaWEJTT4o/kes2wcK6CeCQk3unaUBy3jlBomAc5M1tm','manager','Socmed','active','2026-01-16 09:28:43'),(13,'Man Writer','writer@example.com','$2y$10$V.G2F.g7oS6Iai3FqTqThu1GtrRrgVpK1G8ddte1.HjzQiDDHDIci','manager','Writer','active','2026-01-16 09:29:18'),(14,'staff writer','staffwriter@example.com','$2y$10$tCVbVO3oGnD7q8GexxZFP..TdyVrryUdDThMyVeGD0LBQMwPmDDTm','staff','Writer','active','2026-01-16 09:35:02'),(15,'test','test@mimos.my','$2y$10$V.G2F.g7oS6Iai3FqTqThu1GtrRrgVpK1G8ddte1.HjzQiDDHDIci','client','misid','active','2026-01-19 01:30:22'),(16,'aSasa','test1@mimos.my','$2y$10$PgHyo9CSy2zRPWj/ZsRGH.EDsQBaViKPXkHbsWIaxZq0kHcfpgjCO','client','sdsdsdsd','active','2026-01-19 02:29:55'),(17,'Roslan','roslan@example.com','$2y$10$Gq76e6D7rDlh4wV54JLXfOel7fg6AFpVZBStqReMANFVUz6iuTI3W','staff','Graphic','active','2026-01-19 02:36:10'),(18,'Akmal','akmal@example.com','$2y$10$8JdNwoeq8ObvDsBaPDdgYusCUuY9wqXM5v0QWKQkQPjj6gLQFBTGy','staff','Graphic','active','2026-01-19 03:08:11'),(19,'Salman client','client@mimos.my','$2y$10$zNfM8G1LM863nfmgDqDbpOe2Aaqliiq8ceFVEPFry5exYQVugB6HS','client','International Ventures','active','2026-01-20 07:25:16'),(20,'Joe','joe@example.com','$2y$10$dsQBowi7av7oOWOLsQJkEunSkKDPk6rwmlbz7f7dWyfZrvgG3p286','staff','Graphic','active','2026-01-21 01:41:41'),(21,'pari','pari@mimos.my','$2y$10$HeMAVP05q27zEFsmyejzn.AltXFG0dcRi.VWWA.wNdckuy621kkSq','staff','Graphic','active','2026-01-22 00:36:36'),(22,'Azuin','azuin@gmail.com','$2y$10$NzQbKaRDuaP25y4ZYHgPuuS6w33XoZJ2GuYo2p177oo6ZDbLxYMCa','staff','Writer','active','2026-01-22 00:38:13'),(23,'Helloakhmal','amanmana@gmail.com','$2y$10$m4hQI8nWfjD1XyD4rNX/0e9z5yCIXJ6NIGzZxJmx3qgmikyIPDu9K','client','Business Unit','active','2026-01-22 01:29:02'),(25,'staff Sementara','temp@mail.com','$2y$10$qFsl55JfjfqKnr9mwlT3gOzJ0UTQQtpIGgV.2GdgUY6qdS8D17g0e','staff','Graphic','archived','2026-01-22 05:10:17'),(27,'tempo','tempo@mail.com','$2y$10$MV3A16o7PAiS.53rW/ble.h7izYpGbpUfRww/YCl/uljs5Szvcoam','staff','Graphic','archived','2026-01-22 05:18:26'),(28,'baru','baru@mail.com','$2y$10$VN6LrbxRR1CcNlODYtbptuqNxWG8pm.A0UtXgN0Y6N/h2LdEMrCX2','staff','Graphic','archived','2026-01-22 05:22:40');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow_steps`
--

DROP TABLE IF EXISTS `workflow_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `workflow_steps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workflow_id` int(11) NOT NULL,
  `step_order` int(11) NOT NULL,
  `step_key` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role_required` varchar(50) NOT NULL,
  `on_approve_next_step_id` int(11) DEFAULT NULL,
  `on_reject_step_id` int(11) DEFAULT NULL,
  `is_terminal` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `workflow_id` (`workflow_id`),
  CONSTRAINT `workflow_steps_ibfk_1` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow_steps`
--

LOCK TABLES `workflow_steps` WRITE;
/*!40000 ALTER TABLE `workflow_steps` DISABLE KEYS */;
INSERT INTO `workflow_steps` VALUES (1,1,1,'manager_approval','Manager Approval','manager',2,4,0,'2026-01-16 08:49:06','2026-01-16 08:49:06'),(2,1,2,'staff_processing','Staff Processing','staff',3,NULL,0,'2026-01-16 08:49:06','2026-01-16 08:49:06'),(3,1,3,'completed','Completed','staff',NULL,NULL,1,'2026-01-16 08:49:06','2026-01-16 08:49:06'),(4,1,4,'rejected','Rejected','manager',NULL,NULL,1,'2026-01-16 08:49:06','2026-01-16 08:49:06');
/*!40000 ALTER TABLE `workflow_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflows`
--

DROP TABLE IF EXISTS `workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `workflows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflows`
--

LOCK TABLES `workflows` WRITE;
/*!40000 ALTER TABLE `workflows` DISABLE KEYS */;
INSERT INTO `workflows` VALUES (1,'JOB_REQUEST_DEFAULT','Standard Job Request Workflow',1,'2026-01-16 08:49:06','2026-01-16 08:49:06');
/*!40000 ALTER TABLE `workflows` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-22 15:38:31
