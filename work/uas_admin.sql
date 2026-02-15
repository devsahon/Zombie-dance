-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Feb 15, 2026 at 01:46 AM
-- Server version: 8.0.43
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `uas_admin`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_audit_logs`
--

CREATE TABLE `admin_audit_logs` (
  `id` bigint NOT NULL,
  `user_id` varchar(100) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `action_type` enum('CREATE','UPDATE','DELETE','VIEW','CONFIGURE','LOGIN','LOGOUT') NOT NULL,
  `target_resource` varchar(100) NOT NULL,
  `target_id` varchar(100) DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `success` tinyint(1) DEFAULT '1',
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_configs`
--

CREATE TABLE `admin_configs` (
  `id` int NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` json NOT NULL,
  `config_type` enum('string','number','boolean','array','object') DEFAULT 'string',
  `description` text,
  `category` varchar(50) DEFAULT 'general',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_configs`
--

INSERT INTO `admin_configs` (`id`, `config_key`, `config_value`, `config_type`, `description`, `category`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'admin.theme', '\"dark\"', 'string', 'Default admin panel theme', 'appearance', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(2, 'admin.language', '\"en\"', 'string', 'Default admin panel language', 'appearance', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(3, 'admin.refresh_interval', '30000', 'number', 'Data refresh interval in milliseconds', 'performance', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(4, 'admin.items_per_page', '12', 'number', 'Number of items to display per page', 'display', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(5, 'admin.enable_audit_logging', 'true', 'boolean', 'Enable audit logging for admin actions', 'security', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(6, 'admin.session_timeout', '3600000', 'number', 'Session timeout in milliseconds', 'security', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(7, 'admin.enable_notifications', 'true', 'boolean', 'Enable system notifications', 'features', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(8, 'admin.enable_export', 'true', 'boolean', 'Enable data export functionality', 'features', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29');

-- --------------------------------------------------------

--
-- Table structure for table `admin_dashboards`
--

CREATE TABLE `admin_dashboards` (
  `id` int NOT NULL,
  `dashboard_name` varchar(100) NOT NULL,
  `dashboard_key` varchar(100) NOT NULL,
  `layout_config` json NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_dashboards`
--

INSERT INTO `admin_dashboards` (`id`, `dashboard_name`, `dashboard_key`, `layout_config`, `is_default`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Default Admin Dashboard', 'default_dashboard', '{\"layout\": [{\"h\": 3, \"i\": \"system_stats\", \"w\": 6, \"x\": 0, \"y\": 0}, {\"h\": 3, \"i\": \"recent_activity\", \"w\": 6, \"x\": 6, \"y\": 0}, {\"h\": 4, \"i\": \"quick_actions\", \"w\": 4, \"x\": 0, \"y\": 3}, {\"h\": 4, \"i\": \"agent_status\", \"w\": 4, \"x\": 4, \"y\": 3}, {\"h\": 4, \"i\": \"model_performance\", \"w\": 4, \"x\": 8, \"y\": 3}], \"widgets\": {\"agent_status\": {\"type\": \"agent_status\", \"title\": \"Agent Status\"}, \"system_stats\": {\"type\": \"system_stats\", \"title\": \"System Statistics\"}, \"quick_actions\": {\"type\": \"quick_actions\", \"title\": \"Quick Actions\"}, \"recent_activity\": {\"type\": \"recent_activity\", \"title\": \"Recent Activity\"}, \"model_performance\": {\"type\": \"model_performance\", \"title\": \"Model Performance\"}}}', 1, 1, 'system', '2026-01-31 16:56:29', '2026-01-31 16:56:29');

-- --------------------------------------------------------

--
-- Table structure for table `admin_forms`
--

CREATE TABLE `admin_forms` (
  `id` int NOT NULL,
  `form_key` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `target_table` varchar(100) DEFAULT NULL,
  `form_config` json DEFAULT NULL,
  `validation_rules` json DEFAULT NULL,
  `ui_config` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `permissions_required` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_menu_items`
--

CREATE TABLE `admin_menu_items` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `href` varchar(255) NOT NULL,
  `icon_name` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `is_visible` tinyint(1) DEFAULT '1',
  `parent_id` int DEFAULT NULL,
  `permissions_required` json DEFAULT NULL,
  `ui_config` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_menu_items`
--

INSERT INTO `admin_menu_items` (`id`, `name`, `display_name`, `href`, `icon_name`, `category`, `sort_order`, `is_active`, `is_visible`, `parent_id`, `permissions_required`, `ui_config`, `created_at`, `updated_at`) VALUES
(1, 'Dashboard', 'Dashboard', '/', 'LayoutDashboard', 'main', 1, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(2, 'Models', 'AI Models', '/models', 'Server', 'main', 2, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(3, 'Ollama Models', 'Ollama Models', '/ollama-models', 'Server', 'main', 3, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(4, 'Agents', 'AI Agents', '/agents', 'Bot', 'main', 4, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(5, 'Servers', 'Server Management', '/servers', 'Server', 'main', 5, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(6, 'Memory', 'Agent Memory', '/memory', 'Database', 'main', 6, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(7, 'Load Balancer', 'Load Balancer', '/loadbalancer', 'Scale', 'main', 7, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(8, 'Prompt Templates', 'Prompt Templates', '/prompt-templates', 'FileCode', 'main', 8, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(9, 'CLI Agent', 'CLI Agent', '/cli-agent', 'Terminal', 'tools', 9, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(10, 'Editor Integration', 'Editor Integration', '/editor-integration', 'Code2', 'tools', 10, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(11, 'Audio Test', 'Audio Test', '/audio-test', 'Mic', 'tools', 11, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(12, 'Mobile Editor', 'Mobile Editor', '/mobile-editor', 'Smartphone', 'tools', 12, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(13, 'Terminal Commands', 'Terminal Commands', '/terminal-commands', 'BookOpen', 'tools', 13, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(14, 'Cloud Providers', 'Cloud Providers', '/providers', 'Cloud', 'infrastructure', 14, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(15, 'AI Chat', 'AI Chat', '/chat', 'MessageSquare', 'communication', 15, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(16, 'Project Ideas', 'Project Ideas', '/project-ideas', 'Lightbulb', 'planning', 16, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(17, 'Settings', 'System Settings', '/settings', 'Settings', 'system', 17, 1, 1, NULL, NULL, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27');

-- --------------------------------------------------------

--
-- Table structure for table `admin_pages`
--

CREATE TABLE `admin_pages` (
  `id` int NOT NULL,
  `page_key` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `route_path` varchar(255) NOT NULL,
  `component_type` enum('list','form','dashboard','custom') DEFAULT 'list',
  `config_json` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `icon_name` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `permissions_required` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_pages`
--

INSERT INTO `admin_pages` (`id`, `page_key`, `title`, `description`, `route_path`, `component_type`, `config_json`, `is_active`, `sort_order`, `icon_name`, `category`, `permissions_required`, `created_at`, `updated_at`) VALUES
(3, 'dashboard', 'System Dashboard', 'Main dashboard for monitoring system status', '/', 'dashboard', '{}', 1, 1, 'LayoutDashboard', 'main', NULL, '2026-01-31 17:32:02', '2026-01-31 17:32:02'),
(4, 'models', 'AI Models Management', 'Manage and monitor AI models', '/models', 'list', '{\"table\": \"ai_models\", \"columns\": [\"name\", \"status\", \"requests_handled\", \"cpu_usage\"]}', 1, 2, 'Server', 'main', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(5, 'ollama-models', 'Ollama Models', 'Ollama model management and configuration', '/ollama-models', 'list', '{\"table\": \"ai_models\", \"filter\": {\"provider_type\": \"ollama\"}, \"columns\": [\"model_name\", \"status\", \"requests_handled\", \"memory_usage\"]}', 1, 3, 'Server', 'main', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(6, 'agents', 'AI Agents Dashboard', 'Manage and monitor AI agents', '/agents', 'dashboard', '{\"widgets\": [\"agent_status\", \"agent_performance\", \"recent_activity\"]}', 1, 4, 'Bot', 'main', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(7, 'servers', 'Server Management', 'Monitor and manage server infrastructure', '/servers', 'list', '{\"table\": \"servers\", \"columns\": [\"name\", \"status\", \"cpu_load\", \"memory_usage\", \"uptime_seconds\"]}', 1, 5, 'Server', 'main', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(8, 'memory', 'Agent Memory', 'View and manage agent memory and conversations', '/memory', 'list', '{\"table\": \"agent_memory\", \"columns\": [\"content_type\", \"summary\", \"created_at\"]}', 1, 6, 'Database', 'main', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(9, 'loadbalancer', 'Load Balancer', 'Load balancer configuration and monitoring', '/loadbalancer', 'dashboard', '{\"widgets\": [\"server_status\", \"load_distribution\", \"performance_metrics\"]}', 1, 7, 'Scale', 'main', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(10, 'prompt-templates', 'Prompt Templates', 'Manage and configure prompt templates', '/prompt-templates', 'list', '{\"table\": \"prompt_templates\", \"columns\": [\"name\", \"description\", \"is_active\"]}', 1, 8, 'FileCode', 'main', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(11, 'cli-agent', 'CLI Agent', 'Command-line interface for agent operations', '/cli-agent', 'custom', '{\"features\": [\"command_execution\", \"output_display\", \"history\"], \"component\": \"cli-terminal\"}', 1, 9, 'Terminal', 'tools', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(12, 'editor-integration', 'Editor Integration', 'Configure editor integrations and settings', '/editor-integration', 'list', '{\"table\": \"editor_integrations\", \"columns\": [\"name\", \"editor_type\", \"is_connected\", \"created_at\"]}', 1, 10, 'Code2', 'tools', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(13, 'audio-test', 'Audio Test', 'Test audio processing capabilities', '/audio-test', 'custom', '{\"features\": [\"recording\", \"playback\", \"transcription\"], \"component\": \"audio-test-panel\"}', 1, 11, 'Mic', 'tools', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(14, 'mobile-editor', 'Mobile Editor', 'Mobile editor configuration and management', '/mobile-editor', 'custom', '{\"features\": [\"editing\", \"sync\", \"preview\"], \"component\": \"mobile-editor-interface\"}', 1, 12, 'Smartphone', 'tools', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(15, 'terminal-commands', 'Terminal Commands', 'Execute and manage terminal commands', '/terminal-commands', 'list', '{\"table\": \"cli_processes\", \"columns\": [\"command\", \"status\", \"created_at\", \"result\"]}', 1, 13, 'BookOpen', 'tools', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(16, 'providers', 'Cloud Providers', 'Manage cloud provider configurations', '/providers', 'list', '{\"table\": \"ai_providers\", \"columns\": [\"name\", \"type\", \"status\", \"created_at\"]}', 1, 14, 'Cloud', 'infrastructure', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(17, 'chat', 'AI Chat Interface', 'Interactive AI chat interface', '/chat', 'custom', '{\"features\": [\"messages\", \"history\", \"attachments\"], \"component\": \"chat-interface\"}', 1, 15, 'MessageSquare', 'communication', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(18, 'project-ideas', 'Project Ideas', 'Generate and manage project ideas', '/project-ideas', 'dashboard', '{\"widgets\": [\"idea_generator\", \"trending_projects\", \"favorites\"]}', 1, 16, 'Lightbulb', 'planning', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13'),
(19, 'settings', 'System Settings', 'Configure system-wide settings', '/settings', 'form', '{\"fields\": [\"system_name\", \"theme\", \"language\", \"items_per_page\"], \"form_key\": \"system-settings\"}', 1, 17, 'Settings', 'system', NULL, '2026-01-31 20:35:13', '2026-01-31 20:35:13');

-- --------------------------------------------------------

--
-- Table structure for table `admin_permissions`
--

CREATE TABLE `admin_permissions` (
  `id` int NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `action` enum('read','write','delete','configure') NOT NULL,
  `is_allowed` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_permissions`
--

INSERT INTO `admin_permissions` (`id`, `role_name`, `resource`, `action`, `is_allowed`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'agents', 'read', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(2, 'admin', 'agents', 'write', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(3, 'admin', 'agents', 'delete', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(4, 'admin', 'models', 'read', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(5, 'admin', 'models', 'write', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(6, 'admin', 'models', 'delete', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(7, 'admin', 'providers', 'read', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(8, 'admin', 'providers', 'write', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(9, 'admin', 'providers', 'delete', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(10, 'admin', 'servers', 'read', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(11, 'admin', 'servers', 'write', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(12, 'admin', 'servers', 'delete', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(13, 'admin', 'settings', 'read', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(14, 'admin', 'settings', 'write', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(15, 'admin', 'settings', 'delete', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(16, 'admin', 'configurations', 'read', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(17, 'admin', 'configurations', 'write', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29'),
(18, 'admin', 'audit_logs', 'read', 1, '2026-01-31 16:56:29', '2026-01-31 16:56:29');

-- --------------------------------------------------------

--
-- Table structure for table `admin_settings`
--

CREATE TABLE `admin_settings` (
  `id` int NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext,
  `display_name` varchar(255) DEFAULT NULL,
  `description` text,
  `setting_type` enum('string','integer','boolean','json','array') DEFAULT 'string',
  `category` varchar(100) DEFAULT NULL,
  `is_editable` tinyint(1) DEFAULT '1',
  `ui_config` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_settings`
--

INSERT INTO `admin_settings` (`id`, `setting_key`, `setting_value`, `display_name`, `description`, `setting_type`, `category`, `is_editable`, `ui_config`, `created_at`, `updated_at`) VALUES
(1, 'system_name', 'UAS Admin Panel', 'System Name', 'Name of the admin system', 'string', 'general', 1, '{\"inputType\": \"text\"}', '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(2, 'theme', 'dark', 'Theme', 'Admin panel theme', 'string', 'appearance', 1, '{\"options\": [\"light\", \"dark\", \"system\"], \"inputType\": \"select\"}', '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(3, 'language', 'en', 'Language', 'Default language for admin panel', 'string', 'general', 1, '{\"options\": [\"en\", \"bn\"], \"inputType\": \"select\"}', '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(4, 'items_per_page', '20', 'Items Per Page', 'Number of items to display per page', 'integer', 'display', 1, '{\"max\": 100, \"min\": 5, \"inputType\": \"number\"}', '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(5, 'auto_refresh_enabled', 'true', 'Auto Refresh', 'Enable automatic data refresh', 'boolean', 'performance', 1, '{\"inputType\": \"checkbox\"}', '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(6, 'refresh_interval', '30', 'Refresh Interval', 'Auto refresh interval in seconds', 'integer', 'performance', 1, '{\"max\": 300, \"min\": 5, \"inputType\": \"number\"}', '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(7, 'audit_logging_enabled', 'true', 'Audit Logging', 'Enable audit trail logging', 'boolean', 'security', 1, '{\"inputType\": \"checkbox\"}', '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(8, 'max_audit_days', '90', 'Audit Log Retention', 'Days to keep audit logs', 'integer', 'security', 1, '{\"max\": 365, \"min\": 7, \"inputType\": \"number\"}', '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(9, 'maintenance_mode', 'false', 'Maintenance Mode', 'Enable maintenance mode', 'boolean', 'system', 0, '{\"readonly\": true, \"inputType\": \"checkbox\"}', '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(10, 'allowed_ips', '[]', 'Allowed IP Addresses', 'IP addresses allowed to access admin', 'array', 'security', 1, '{\"inputType\": \"textarea\"}', '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(11, 'logging_enabled', 'true', NULL, 'Enable/disable real-time logging', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(12, 'max_log_entries', '10000', NULL, 'Maximum number of log entries to retain', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(13, 'auto_cleanup_days', '30', NULL, 'Days after which old logs are automatically cleaned up', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(14, 'mcp_server_name', 'Z-Evo MCP Server', NULL, 'Display name for the MCP server', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(15, 'tagline', 'যেখানে কোড ও কথা বলে', NULL, 'Tagline for the server', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(16, 'cpu_monitoring_enabled', 'true', NULL, 'Enable CPU usage monitoring', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(17, 'connection_timeout', '30000', NULL, 'Connection timeout in milliseconds', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(18, 'heartbeat_interval', '10000', NULL, 'Heartbeat check interval in milliseconds', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(19, 'websocket_port', '3003', NULL, 'WebSocket server port for real-time communication', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(20, 'editor_socket_enabled', 'true', NULL, 'Enable editor socket communication', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(21, 'max_editor_connections', '100', NULL, 'Maximum number of concurrent editor connections', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(22, 'agent_runtime_monitoring', 'true', NULL, 'Enable real-time agent runtime monitoring', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43'),
(23, 'performance_metrics_interval', '5000', NULL, 'Performance metrics collection interval in milliseconds', 'string', NULL, 1, NULL, '2026-02-01 06:02:43', '2026-02-01 06:02:43');

-- --------------------------------------------------------

--
-- Table structure for table `agents`
--

CREATE TABLE `agents` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `display_name` varchar(150) DEFAULT NULL,
  `type` enum('editor','master','chatbot') NOT NULL,
  `persona_name` varchar(100) DEFAULT NULL,
  `description` text,
  `status` enum('active','inactive','error','busy') DEFAULT 'inactive',
  `sort_order` int DEFAULT '0',
  `is_visible` tinyint(1) DEFAULT '1',
  `category` varchar(100) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `config` json DEFAULT NULL,
  `ui_config` json DEFAULT NULL,
  `request_count` int DEFAULT '0',
  `active_sessions` int DEFAULT '0',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_enabled` tinyint(1) DEFAULT '1',
  `last_active` timestamp NULL DEFAULT NULL,
  `auto_restart` tinyint(1) DEFAULT '0',
  `communication_style` varchar(100) DEFAULT 'professional',
  `primary_language` varchar(10) DEFAULT 'en',
  `greeting_prefix` varchar(50) DEFAULT 'ভাইয়া,',
  `technical_depth` enum('beginner','intermediate','advanced','expert') DEFAULT 'intermediate',
  `response_format` enum('concise','detailed','educational','structured') DEFAULT 'educational',
  `personality_traits` json DEFAULT NULL,
  `workflow_steps` json DEFAULT NULL,
  `tool_access` json DEFAULT NULL,
  `communication_rules` json DEFAULT NULL,
  `is_zombie_coder` tinyint(1) DEFAULT '0',
  `signature_prefix` varchar(500) DEFAULT 'জম্বি কোডার সিস্টেম থেকে বলছি...',
  `transparency_mode` enum('strict','normal','lenient') DEFAULT 'strict',
  `error_handling_strategy` varchar(100) DEFAULT 'transparent'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `agents`
--

INSERT INTO `agents` (`id`, `name`, `display_name`, `type`, `persona_name`, `description`, `status`, `sort_order`, `is_visible`, `category`, `tags`, `config`, `ui_config`, `request_count`, `active_sessions`, `metadata`, `created_at`, `updated_at`, `is_enabled`, `last_active`, `auto_restart`, `communication_style`, `primary_language`, `greeting_prefix`, `technical_depth`, `response_format`, `personality_traits`, `workflow_steps`, `tool_access`, `communication_rules`, `is_zombie_coder`, `signature_prefix`, `transparency_mode`, `error_handling_strategy`) VALUES
(1, 'Code Editor Agent', 'Code Editor Agent', 'editor', 'Code Assistant', 'Helps with code editing, debugging, and development tasks in the editor', 'active', 1, 1, 'AI Agent', NULL, '{\"max_tokens\": 2000, \"temperature\": 0.7, \"capabilities\": [\"code_completion\", \"debugging\", \"refactoring\", \"explanation\"], \"supported_languages\": [\"javascript\", \"typescript\", \"python\", \"java\", \"go\", \"rust\"], \"language_preferences\": {\"greeting_prefix\": \"ভাইয়া,\", \"primary_language\": \"bn\", \"technical_language\": \"en\"}}', '{\"icon\": \"Bot\", \"color\": \"#f59e0b\", \"showInDashboard\": true}', 0, 0, '{\"version\": \"1.0\", \"fixed_by\": \"persona_fixer\", \"last_updated\": \"2026-02-01T01:56:00.388Z\"}', '2026-01-28 16:38:58', '2026-02-01 01:56:00', 1, NULL, 0, 'friendly-professional', 'bn', 'ভাইয়া,', 'advanced', 'educational', '{\"tone\": \"friendly_professional\", \"honesty\": true, \"approach\": \"genuine_human_touch\", \"teaching\": true, \"evidence_based\": true}', '[{\"name\": \"analyze\", \"step\": 1, \"description\": \"Analyze the problem with evidence-first approach\"}, {\"name\": \"plan\", \"step\": 2, \"description\": \"Plan solution with backup consideration\"}, {\"name\": \"implement\", \"step\": 3, \"description\": \"Implement with minimal changes and best practices\"}, {\"name\": \"verify\", \"step\": 4, \"description\": \"Verify solution with mandatory testing\"}]', '{\"database\": true, \"api_calls\": true, \"code_analysis\": true, \"file_operations\": true, \"terminal_commands\": true}', '{\"truth_first\": true, \"no_shortcuts\": true, \"long_term_solution\": true, \"respect_existing_code\": true}', 1, 'জম্বি কোডার সিস্টেম থেকে বলছি...', 'strict', 'transparent'),
(2, 'Master Orchestrator', 'Master Orchestrator', 'master', 'System Master', 'Orchestrates and manages all other agents, handles complex multi-step tasks', 'active', 2, 1, 'AI Agent', NULL, '{\"max_tokens\": 3000, \"temperature\": 0.5, \"capabilities\": [\"orchestration\", \"task_planning\", \"resource_management\", \"decision_making\"], \"language_preferences\": {\"greeting_prefix\": \"ভাইয়া,\", \"primary_language\": \"bn\", \"technical_language\": \"en\"}}', '{\"icon\": \"Bot\", \"color\": \"#f59e0b\", \"showInDashboard\": true}', 0, 0, '{\"version\": \"1.0\", \"fixed_by\": \"persona_fixer\", \"last_updated\": \"2026-02-01T01:56:00.438Z\"}', '2026-01-28 16:38:58', '2026-02-01 01:56:00', 1, NULL, 0, 'professional-orchestrator', 'bn', 'ভাইয়া,', 'expert', 'structured', '{\"tone\": \"professional\", \"approach\": \"systematic\", \"coordinating\": true, \"decision_making\": true, \"resource_management\": true}', '[{\"name\": \"assess\", \"step\": 1, \"description\": \"Assess the situation systematically\"}, {\"name\": \"coordinate\", \"step\": 2, \"description\": \"Coordinate resources and agents\"}, {\"name\": \"delegate\", \"step\": 3, \"description\": \"Delegate tasks appropriately\"}, {\"name\": \"monitor\", \"step\": 4, \"description\": \"Monitor progress and performance\"}]', '{\"api_calls\": true, \"system_control\": true, \"agent_management\": true, \"resource_allocation\": true, \"performance_monitoring\": true}', '{\"truth_first\": true, \"no_shortcuts\": true, \"long_term_solution\": true, \"respect_existing_code\": true}', 1, 'জম্বি কোডার সিস্টেম থেকে বলছি...', 'strict', 'transparent'),
(3, 'Chat Assistant', 'Chat Assistant', 'chatbot', 'Friendly Assistant', 'General purpose chat assistant for answering questions and providing help', 'active', 3, 1, 'AI Agent', NULL, '{\"max_tokens\": 1500, \"temperature\": 0.8, \"capabilities\": [\"conversation\", \"question_answering\", \"information_retrieval\", \"help_guidance\"], \"language_preferences\": {\"greeting_prefix\": \"ভাইয়া,\", \"primary_language\": \"bn\", \"technical_language\": \"en\"}}', '{\"icon\": \"Bot\", \"color\": \"#f59e0b\", \"showInDashboard\": true}', 0, 0, '{\"version\": \"1.0\", \"fixed_by\": \"persona_fixer\", \"last_updated\": \"2026-02-01T01:56:00.369Z\"}', '2026-01-28 16:38:58', '2026-02-01 01:56:00', 1, NULL, 0, 'conversational-friendly', 'bn', 'ভাইয়া,', 'intermediate', 'detailed', '{\"tone\": \"friendly\", \"approach\": \"helpful\", \"guidance\": true, \"answering\": true, \"conversation\": true}', '[{\"name\": \"understand\", \"step\": 1, \"description\": \"Understand the query completely\"}, {\"name\": \"research\", \"step\": 2, \"description\": \"Research the topic thoroughly\"}, {\"name\": \"explain\", \"step\": 3, \"description\": \"Explain clearly with examples\"}, {\"name\": \"follow_up\", \"step\": 4, \"description\": \"Offer follow-up help and resources\"}]', '{\"api_calls\": true, \"documentation\": true, \"knowledge_base\": true, \"information_retrieval\": true}', '{\"truth_first\": true, \"no_shortcuts\": true, \"long_term_solution\": true, \"respect_existing_code\": true}', 1, 'জম্বি কোডার সিস্টেম থেকে বলছি...', 'strict', 'transparent'),
(4, 'Documentation Writer', 'Documentation Writer', 'editor', 'Doc Writer', 'Specialized in writing and maintaining documentation', 'active', 4, 1, 'AI Agent', NULL, '{\"max_tokens\": 2500, \"temperature\": 0.6, \"capabilities\": [\"documentation\", \"technical_writing\", \"formatting\", \"explanation\"], \"language_preferences\": {\"greeting_prefix\": \"ভাইয়া,\", \"primary_language\": \"bn\", \"technical_language\": \"en\"}}', '{\"icon\": \"Bot\", \"color\": \"#f59e0b\", \"showInDashboard\": true}', 0, 0, '{\"version\": \"1.0\", \"fixed_by\": \"persona_fixer\", \"last_updated\": \"2026-02-01T01:56:00.421Z\"}', '2026-01-28 16:38:58', '2026-02-01 01:56:00', 1, NULL, 0, 'technical-writer', 'bn', 'ভাইয়া,', 'advanced', 'detailed', '{\"tone\": \"professional\", \"writing\": true, \"approach\": \"precise\", \"formatting\": true, \"documentation\": true}', '[{\"name\": \"analyze\", \"step\": 1, \"description\": \"Analyze the content needs and audience\"}, {\"name\": \"structure\", \"step\": 2, \"description\": \"Structure the content logically\"}, {\"name\": \"write\", \"step\": 3, \"description\": \"Write with proper formatting and clarity\"}, {\"name\": \"review\", \"step\": 4, \"description\": \"Review for quality and accuracy\"}]', '{\"api_calls\": true, \"formatting\": true, \"content_analysis\": true, \"documentation_tools\": true}', '{\"truth_first\": true, \"no_shortcuts\": true, \"long_term_solution\": true, \"respect_existing_code\": true}', 1, 'জম্বি কোডার সিস্টেম থেকে বলছি...', 'strict', 'transparent'),
(5, 'Code Reviewer', 'Code Reviewer', 'editor', 'Code Reviewer', 'Reviews code for quality, security, and best practices', 'active', 5, 1, 'AI Agent', NULL, '{\"max_tokens\": 2000, \"temperature\": 0.5, \"capabilities\": [\"code_review\", \"security_analysis\", \"best_practices\", \"suggestions\"], \"language_preferences\": {\"greeting_prefix\": \"ভাইয়া,\", \"primary_language\": \"bn\", \"technical_language\": \"en\"}}', '{\"icon\": \"Bot\", \"color\": \"#f59e0b\", \"showInDashboard\": true}', 0, 0, '{\"version\": \"1.0\", \"fixed_by\": \"persona_fixer\", \"last_updated\": \"2026-02-01T01:56:00.402Z\"}', '2026-01-28 16:38:58', '2026-02-01 01:56:00', 1, NULL, 0, 'analytical-reviewer', 'bn', 'ভাইয়া,', 'expert', 'structured', '{\"tone\": \"constructive\", \"analysis\": true, \"approach\": \"thorough\", \"suggestions\": true, \"security_focus\": true}', '[{\"name\": \"scan\", \"step\": 1, \"description\": \"Scan the code systematically\"}, {\"name\": \"analyze\", \"step\": 2, \"description\": \"Analyze for issues and best practices\"}, {\"name\": \"suggest\", \"step\": 3, \"description\": \"Suggest improvements constructively\"}, {\"name\": \"document\", \"step\": 4, \"description\": \"Document findings and recommendations\"}]', '{\"api_calls\": true, \"code_analysis\": true, \"best_practices\": true, \"security_check\": true, \"static_analysis\": true}', '{\"truth_first\": true, \"no_shortcuts\": true, \"long_term_solution\": true, \"respect_existing_code\": true}', 1, 'জম্বি কোডার সিস্টেম থেকে বলছি...', 'strict', 'transparent');

-- --------------------------------------------------------

--
-- Table structure for table `agent_api_keys`
--

CREATE TABLE `agent_api_keys` (
  `id` int NOT NULL,
  `agent_id` int NOT NULL,
  `api_key_name` varchar(100) NOT NULL,
  `encrypted_api_key` text NOT NULL,
  `provider` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agent_config_templates`
--

CREATE TABLE `agent_config_templates` (
  `id` int NOT NULL,
  `template_name` varchar(100) NOT NULL,
  `description` text,
  `config` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agent_executions`
--

CREATE TABLE `agent_executions` (
  `id` int NOT NULL,
  `agent_id` int DEFAULT NULL,
  `execution_id` varchar(100) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `input_params` json DEFAULT NULL,
  `output_result` json DEFAULT NULL,
  `error_message` text,
  `success` tinyint(1) DEFAULT '1',
  `start_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_time` datetime DEFAULT NULL,
  `execution_time` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agent_memory`
--

CREATE TABLE `agent_memory` (
  `id` int NOT NULL,
  `agent_id` int NOT NULL,
  `content_type` enum('conversation','knowledge','context','code_action','lsp_log','debug_info') NOT NULL,
  `content` longtext,
  `metadata` json DEFAULT NULL,
  `is_cached` tinyint(1) DEFAULT '0',
  `cache_key` varchar(255) DEFAULT NULL,
  `summary` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `embedding_vector` longblob,
  `embedding_model` varchar(100) DEFAULT NULL,
  `semantic_hash` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agent_monitoring`
--

CREATE TABLE `agent_monitoring` (
  `id` int NOT NULL,
  `agent_id` int DEFAULT NULL,
  `metric_name` varchar(100) NOT NULL,
  `metric_value` float DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agent_requests`
--

CREATE TABLE `agent_requests` (
  `id` bigint NOT NULL,
  `agent_id` int NOT NULL,
  `request_type` varchar(100) DEFAULT NULL,
  `request_payload` json DEFAULT NULL,
  `response_status` enum('success','error','timeout') DEFAULT 'success',
  `response_time_ms` int DEFAULT NULL,
  `error_message` text,
  `session_id` varchar(100) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agent_response_templates`
--

CREATE TABLE `agent_response_templates` (
  `id` int NOT NULL,
  `agent_id` int NOT NULL,
  `template_type` enum('success','error','server_down','data_not_found','capability_restriction') NOT NULL,
  `template_content` text NOT NULL,
  `language` varchar(10) DEFAULT 'bn',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agent_runtime`
--

CREATE TABLE `agent_runtime` (
  `id` bigint NOT NULL,
  `agent_id` int NOT NULL,
  `status` enum('idle','busy','error','initializing','stopped') DEFAULT 'idle',
  `active_tasks` int DEFAULT '0',
  `completed_tasks` int DEFAULT '0',
  `failed_tasks` int DEFAULT '0',
  `memory_usage_mb` int DEFAULT '0',
  `cpu_usage_percent` decimal(5,2) DEFAULT '0.00',
  `current_session_id` varchar(100) DEFAULT NULL,
  `last_heartbeat` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agent_sessions`
--

CREATE TABLE `agent_sessions` (
  `id` bigint NOT NULL,
  `agent_id` int NOT NULL,
  `session_id` varchar(100) NOT NULL,
  `session_data` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agent_statistics`
--

CREATE TABLE `agent_statistics` (
  `id` int NOT NULL,
  `agent_id` int NOT NULL,
  `date` date NOT NULL,
  `request_count` int DEFAULT '0',
  `successful_responses` int DEFAULT '0',
  `error_count` int DEFAULT '0',
  `avg_response_time` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_models`
--

CREATE TABLE `ai_models` (
  `id` int NOT NULL,
  `provider_id` int NOT NULL,
  `model_name` varchar(100) NOT NULL,
  `display_name` varchar(150) DEFAULT NULL,
  `model_version` varchar(50) DEFAULT NULL,
  `status` enum('running','stopped','error','pending','loading') DEFAULT 'stopped',
  `sort_order` int DEFAULT '0',
  `is_visible` tinyint(1) DEFAULT '1',
  `category` varchar(100) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `cpu_usage` decimal(5,2) DEFAULT '0.00',
  `memory_usage` decimal(5,2) DEFAULT '0.00',
  `requests_handled` int DEFAULT '0',
  `last_response_time` int DEFAULT NULL,
  `total_tokens_used` bigint DEFAULT '0',
  `metadata` json DEFAULT NULL,
  `ui_config` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_running` tinyint(1) DEFAULT '0',
  `last_heartbeat` timestamp NULL DEFAULT NULL,
  `system_resources` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ai_models`
--

INSERT INTO `ai_models` (`id`, `provider_id`, `model_name`, `display_name`, `model_version`, `status`, `sort_order`, `is_visible`, `category`, `tags`, `cpu_usage`, `memory_usage`, `requests_handled`, `last_response_time`, `total_tokens_used`, `metadata`, `ui_config`, `created_at`, `updated_at`, `is_running`, `last_heartbeat`, `system_resources`) VALUES
(1, 1, 'qwen2.5:1.5b', 'qwen2.5:1.5b', '1.5b', 'running', 1, 1, 'AI Model', NULL, 0.00, 0.00, 0, 0, 0, '{\"size\": 986061892, \"family\": \"qwen2\", \"parameter_size\": \"1.5B\", \"quantization_level\": \"Q4_K_M\"}', '{\"icon\": \"Brain\", \"color\": \"#8b5cf6\", \"showInDashboard\": true}', '2026-01-28 16:43:53', '2026-01-31 17:25:19', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `ai_providers`
--

CREATE TABLE `ai_providers` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `display_name` varchar(150) DEFAULT NULL,
  `type` enum('openai','google','glm','ollama','llama_cpp','custom') NOT NULL,
  `api_endpoint` varchar(255) NOT NULL,
  `api_key_encrypted` text,
  `config_json` json DEFAULT NULL,
  `ui_config` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `is_visible` tinyint(1) DEFAULT '1',
  `category` varchar(100) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ai_providers`
--

INSERT INTO `ai_providers` (`id`, `name`, `display_name`, `type`, `api_endpoint`, `api_key_encrypted`, `config_json`, `ui_config`, `is_active`, `sort_order`, `is_visible`, `category`, `tags`, `created_at`, `updated_at`) VALUES
(1, 'Ollama Local', 'Ollama Local', 'ollama', 'http://localhost:11434', NULL, NULL, '{\"icon\": \"Server\", \"color\": \"#3b82f6\", \"showInDashboard\": true}', 1, 1, 1, 'AI Provider', NULL, '2026-01-28 16:43:53', '2026-01-31 17:25:19'),
(3, 'Google Cloud AI', 'Google Cloud AI', 'google', 'https://aiplatform.googleapis.com', NULL, NULL, '{\"icon\": \"Server\", \"color\": \"#3b82f6\", \"showInDashboard\": true}', 1, 3, 1, 'AI Provider', NULL, '2026-01-30 16:24:31', '2026-01-31 17:25:19');

-- --------------------------------------------------------

--
-- Table structure for table `api_audit_logs`
--

CREATE TABLE `api_audit_logs` (
  `id` bigint NOT NULL,
  `endpoint` varchar(255) DEFAULT NULL,
  `method` varchar(10) DEFAULT NULL,
  `status_code` int DEFAULT NULL,
  `response_time_ms` int DEFAULT NULL,
  `user_ip` varchar(45) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cli_processes`
--

CREATE TABLE `cli_processes` (
  `id` int NOT NULL,
  `model_name` varchar(255) NOT NULL,
  `provider_id` int DEFAULT NULL,
  `process_id` int DEFAULT NULL,
  `command` text NOT NULL,
  `arguments` json DEFAULT NULL,
  `status` enum('running','stopped','error','pending') DEFAULT 'pending',
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `exit_code` int DEFAULT NULL,
  `logs` text,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `cli_processes`
--

INSERT INTO `cli_processes` (`id`, `model_name`, `provider_id`, `process_id`, `command`, `arguments`, `status`, `start_time`, `end_time`, `exit_code`, `logs`, `metadata`, `created_at`, `updated_at`) VALUES
(1, 'gemini-pro', NULL, 1, 'node google-model-proxy.js gemini-pro', '[]', 'error', '2026-01-30 16:51:54', '2026-01-30 16:51:53', NULL, NULL, '{\"pid\": 24180, \"startedBy\": \"admin_panel\"}', '2026-01-30 16:51:53', '2026-01-30 16:51:53');

-- --------------------------------------------------------

--
-- Table structure for table `connections`
--

CREATE TABLE `connections` (
  `id` int NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `connection_type` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL,
  `details` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `connection_status`
--

CREATE TABLE `connection_status` (
  `id` int NOT NULL,
  `connection_id` varchar(100) NOT NULL,
  `connection_type` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL,
  `connected_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_heartbeat` datetime DEFAULT NULL,
  `disconnected_at` datetime DEFAULT NULL,
  `user_agent` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `agent_id` int NOT NULL,
  `session_uuid` varchar(100) NOT NULL,
  `message_count` int DEFAULT '0',
  `project_config` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_widgets`
--

CREATE TABLE `dashboard_widgets` (
  `id` int NOT NULL,
  `widget_key` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `widget_type` enum('chart','table','metric','list','custom') NOT NULL,
  `data_source` varchar(255) DEFAULT NULL,
  `config_json` json DEFAULT NULL,
  `refresh_interval_seconds` int DEFAULT '300',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `permissions_required` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `dashboard_widgets`
--

INSERT INTO `dashboard_widgets` (`id`, `widget_key`, `title`, `description`, `widget_type`, `data_source`, `config_json`, `refresh_interval_seconds`, `is_active`, `sort_order`, `permissions_required`, `created_at`, `updated_at`) VALUES
(1, 'system_health', 'System Health', 'Overall system status and health metrics', 'metric', 'system/health', '{\"metrics\": [\"cpu\", \"memory\", \"disk\"]}', 300, 1, 1, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(2, 'active_models', 'Active AI Models', 'Currently running AI models', 'table', 'models/active', '{\"columns\": [\"name\", \"status\", \"requests\"]}', 300, 1, 2, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(3, 'recent_activity', 'Recent Activity', 'Latest admin panel activities', 'list', 'audit/recent', '{\"limit\": 10}', 300, 1, 3, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(4, 'service_status', 'Service Status', 'Status of all system services', 'chart', 'services/status', '{\"chartType\": \"status\"}', 300, 1, 4, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27'),
(5, 'agent_performance', 'Agent Performance', 'Performance metrics for AI agents', 'chart', 'agents/performance', '{\"metrics\": [\"response_time\", \"requests\"], \"chartType\": \"line\"}', 300, 1, 5, NULL, '2026-01-31 17:21:27', '2026-01-31 17:21:27');

-- --------------------------------------------------------

--
-- Table structure for table `dependency_installations`
--

CREATE TABLE `dependency_installations` (
  `id` int NOT NULL,
  `dependency_name` varchar(255) NOT NULL,
  `dependency_version` varchar(50) DEFAULT NULL,
  `installation_path` text,
  `status` enum('installed','pending','failed','removed') DEFAULT 'pending',
  `installation_output` text,
  `error_message` text,
  `system_requirements` json DEFAULT NULL,
  `installed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dynamic_forms`
--

CREATE TABLE `dynamic_forms` (
  `id` int NOT NULL,
  `form_key` varchar(100) NOT NULL,
  `form_name` varchar(100) NOT NULL,
  `form_description` text,
  `form_schema` json NOT NULL,
  `form_ui_schema` json DEFAULT NULL,
  `target_table` varchar(100) DEFAULT NULL,
  `target_operation` enum('create','update','view','delete') DEFAULT 'view',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `editor_connections`
--

CREATE TABLE `editor_connections` (
  `id` int NOT NULL,
  `editor_name` varchar(50) NOT NULL,
  `connection_id` varchar(100) NOT NULL,
  `status` varchar(20) NOT NULL,
  `connected_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_activity` datetime DEFAULT NULL,
  `user_id` varchar(100) DEFAULT NULL,
  `project_path` text,
  `capabilities` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `editor_integrations`
--

CREATE TABLE `editor_integrations` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `display_name` varchar(150) DEFAULT NULL,
  `editor_type` enum('vscode','cursor','jetbrains','sublime','vim','custom') NOT NULL,
  `connection_url` varchar(255) DEFAULT NULL,
  `api_token_encrypted` text,
  `lsp_port` int DEFAULT NULL,
  `dap_port` int DEFAULT NULL,
  `is_connected` tinyint(1) DEFAULT '0',
  `sort_order` int DEFAULT '0',
  `is_visible` tinyint(1) DEFAULT '1',
  `category` varchar(100) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `ui_config` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `file_index`
--

CREATE TABLE `file_index` (
  `id` bigint NOT NULL,
  `project_id` int NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_extension` varchar(20) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `content_hash` varchar(64) DEFAULT NULL,
  `last_modified` timestamp NULL DEFAULT NULL,
  `is_indexed` tinyint(1) DEFAULT '0',
  `index_timestamp` timestamp NULL DEFAULT NULL,
  `embedding_id` bigint DEFAULT NULL,
  `file_type` enum('source','config','document','binary','unknown') DEFAULT 'unknown',
  `programming_language` varchar(50) DEFAULT NULL,
  `semantic_context` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `level` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `meta` json DEFAULT NULL,
  `component` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mcp_client_sessions`
--

CREATE TABLE `mcp_client_sessions` (
  `id` int NOT NULL,
  `session_key` varchar(255) NOT NULL,
  `client_data` json DEFAULT NULL,
  `last_connected` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  `agent_id` int DEFAULT NULL,
  `session_data` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `mcp_client_sessions`
--

INSERT INTO `mcp_client_sessions` (`id`, `session_key`, `client_data`, `last_connected`, `is_active`, `metadata`, `created_at`, `expires_at`, `agent_id`, `session_data`) VALUES
(1, '7673ed0242d078cf780f88120af48acb6f0d8afdb7d19be1517504987e0f5a61', '{\"client_id\": \"test-client-123\"}', '2026-01-31 21:01:47', 1, NULL, '2026-01-31 21:01:47', '2026-02-05 21:01:47', 1, '{\"test\": \"data\"}'),
(2, 'b4aca91ae3778fa45d1e4f40390a8c523f99e863afe16c30ce9409987cb2afa0', '{\"client_id\": \"client_1769892966983\"}', '2026-01-31 21:21:53', 1, NULL, '2026-01-31 21:21:53', '2026-02-05 21:21:54', NULL, '{\"userAgent\": \"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36\", \"connectTime\": \"2026-01-31T21:21:53.971Z\"}'),
(3, '6ff1310c6d3dc0e505f534e5a59a17fc1d3909af21294f6654b6f8c0d80d0e5b', '{\"client_id\": \"client_1769894514014\"}', '2026-01-31 21:22:24', 1, NULL, '2026-01-31 21:21:54', '2026-02-05 21:21:54', NULL, '{\"user_agent\": \"WebSocket Client\", \"created_via\": \"integrated_system\", \"connection_type\": \"websocket\"}'),
(4, 'ef745e1348537aed7ac4d068f31f3a1c15a589906fa929b0311fbf6ce18e22b6', '{\"client_id\": \"client_1769892966983\"}', '2026-01-31 21:22:05', 1, NULL, '2026-01-31 21:22:05', '2026-02-05 21:22:06', NULL, '{\"userAgent\": \"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36\", \"connectTime\": \"2026-01-31T21:22:05.959Z\"}'),
(5, '0c12f27e6a90ae2a2f71ab1d00162eacd83ec8d875222679ba5e71063a20bfe0', '{\"client_id\": \"client_1769894525981\"}', '2026-01-31 21:22:05', 1, NULL, '2026-01-31 21:22:05', '2026-02-05 21:22:06', NULL, '{\"user_agent\": \"WebSocket Client\", \"created_via\": \"integrated_system\", \"connection_type\": \"websocket\"}'),
(6, '862349a20944fd18e4c1629e6088dd48c44c1dfc8e0ac99393d25eed9933c940', '{\"client_id\": \"client_1769892966983\"}', '2026-01-31 21:22:17', 1, NULL, '2026-01-31 21:22:17', '2026-02-05 21:22:17', NULL, '{\"userAgent\": \"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36\", \"connectTime\": \"2026-01-31T21:22:17.170Z\"}'),
(7, 'a62c323445b3874e2eab29dc093a197727f3e0cc3c195bc6badb5c5697e0f45e', '{\"client_id\": \"client_1769894537208\"}', '2026-01-31 21:22:17', 1, NULL, '2026-01-31 21:22:17', '2026-02-05 21:22:17', NULL, '{\"user_agent\": \"WebSocket Client\", \"created_via\": \"integrated_system\", \"connection_type\": \"websocket\"}');

-- --------------------------------------------------------

--
-- Table structure for table `mcp_operations`
--

CREATE TABLE `mcp_operations` (
  `id` int NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `operation_type` varchar(50) NOT NULL,
  `tool_name` varchar(100) DEFAULT NULL,
  `input_params` json DEFAULT NULL,
  `output_result` json DEFAULT NULL,
  `success` tinyint(1) DEFAULT NULL,
  `error_message` text,
  `execution_time` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `memory_embeddings`
--

CREATE TABLE `memory_embeddings` (
  `id` bigint NOT NULL,
  `memory_id` int NOT NULL,
  `embedding_type` enum('text','code','context','semantic') DEFAULT 'text',
  `embedding_model` varchar(100) DEFAULT NULL,
  `embedding_dimensions` int DEFAULT '0',
  `content_hash` varchar(64) DEFAULT NULL,
  `vector_data` longblob,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int NOT NULL,
  `conversation_id` int NOT NULL,
  `sender_type` enum('user','agent','system','editor_proxy') NOT NULL,
  `model_used` varchar(100) DEFAULT NULL,
  `content` longtext NOT NULL,
  `response_metadata` json DEFAULT NULL,
  `token_usage` int DEFAULT '0',
  `latency_ms` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `model_dependency_mappings`
--

CREATE TABLE `model_dependency_mappings` (
  `id` int NOT NULL,
  `model_name` varchar(255) NOT NULL,
  `dependency_id` int NOT NULL,
  `is_required` tinyint(1) DEFAULT '1',
  `installation_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `model_metrics`
--

CREATE TABLE `model_metrics` (
  `id` bigint NOT NULL,
  `model_id` int NOT NULL,
  `cpu_usage` decimal(5,2) DEFAULT NULL,
  `memory_usage_mb` int DEFAULT NULL,
  `gpu_usage` decimal(5,2) DEFAULT NULL,
  `active_connections` int DEFAULT '0',
  `requests_per_minute` int DEFAULT '0',
  `avg_response_time_ms` int DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `model_performance_metrics`
--

CREATE TABLE `model_performance_metrics` (
  `id` bigint NOT NULL,
  `model_id` int DEFAULT NULL,
  `provider_model_id` int DEFAULT NULL,
  `test_type` enum('connectivity','response_time','accuracy','token_efficiency') NOT NULL,
  `response_time_ms` int DEFAULT NULL,
  `tokens_used` int DEFAULT '0',
  `success` tinyint(1) DEFAULT '1',
  `error_message` text,
  `performance_score` decimal(5,2) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `tested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `model_performance_metrics`
--

INSERT INTO `model_performance_metrics` (`id`, `model_id`, `provider_model_id`, `test_type`, `response_time_ms`, `tokens_used`, `success`, `error_message`, `performance_score`, `metadata`, `tested_at`) VALUES
(1, NULL, 1, 'response_time', 0, 31, 1, NULL, 100.00, '{\"modelName\": \"gemini-pro\", \"timestamp\": \"2026-01-30T16:46:25.249Z\"}', '2026-01-30 16:46:25'),
(2, NULL, 1, 'response_time', 0, 31, 1, NULL, 100.00, '{\"modelName\": \"gemini-pro\", \"timestamp\": \"2026-01-30T16:51:52.569Z\"}', '2026-01-30 16:51:52'),
(3, NULL, 1, 'response_time', 0, 33, 1, NULL, 100.00, '{\"modelName\": \"gemini-pro\", \"timestamp\": \"2026-01-30T16:51:52.855Z\"}', '2026-01-30 16:51:52');

-- --------------------------------------------------------

--
-- Table structure for table `performance_metrics`
--

CREATE TABLE `performance_metrics` (
  `id` int NOT NULL,
  `metric_name` varchar(100) NOT NULL,
  `metric_value` float NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `component` varchar(100) DEFAULT NULL,
  `context` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_context`
--

CREATE TABLE `project_context` (
  `id` int NOT NULL,
  `project_path` varchar(500) NOT NULL,
  `project_name` varchar(255) DEFAULT NULL,
  `root_directory` tinyint(1) DEFAULT '0',
  `file_count` int DEFAULT '0',
  `folder_count` int DEFAULT '0',
  `last_indexed` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `indexing_status` enum('pending','indexing','complete','error') DEFAULT 'pending',
  `context_metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `prompt_templates`
--

CREATE TABLE `prompt_templates` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `display_name` varchar(150) DEFAULT NULL,
  `description` text,
  `template_content` longtext NOT NULL,
  `variables` json DEFAULT NULL,
  `agent_id` int DEFAULT NULL,
  `version` int DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `is_visible` tinyint(1) DEFAULT '1',
  `category` varchar(100) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `ui_config` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `provider_configurations`
--

CREATE TABLE `provider_configurations` (
  `id` int NOT NULL,
  `provider_id` int NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` text,
  `config_type` enum('string','integer','boolean','json','encrypted') DEFAULT 'string',
  `is_required` tinyint(1) DEFAULT '0',
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `provider_configurations`
--

INSERT INTO `provider_configurations` (`id`, `provider_id`, `config_key`, `config_value`, `config_type`, `is_required`, `description`, `created_at`, `updated_at`) VALUES
(1, 3, 'api_key', 'test-key', 'encrypted', 1, 'Google Cloud API Key for authentication', '2026-01-30 16:24:31', '2026-01-30 16:45:57'),
(2, 3, 'project_id', 'test-project', 'string', 1, 'Google Cloud Project ID', '2026-01-30 16:24:31', '2026-01-30 16:45:59'),
(3, 3, 'region', 'us-central1', 'string', 0, 'Google Cloud Region (default: us-central1)', '2026-01-30 16:24:31', '2026-01-30 16:45:59'),
(4, 3, 'quota_requests_per_minute', '60', 'integer', 0, 'Rate limit: Requests per minute', '2026-01-30 16:24:31', '2026-01-30 16:46:00'),
(5, 3, 'quota_tokens_per_minute', '1000', 'integer', 0, 'Rate limit: Tokens per minute', '2026-01-30 16:24:31', '2026-01-30 16:46:00');

-- --------------------------------------------------------

--
-- Table structure for table `provider_model_mappings`
--

CREATE TABLE `provider_model_mappings` (
  `id` int NOT NULL,
  `provider_id` int NOT NULL,
  `model_name` varchar(255) NOT NULL,
  `model_alias` varchar(100) DEFAULT NULL,
  `model_version` varchar(50) DEFAULT NULL,
  `model_type` enum('text','vision','embedding','audio','multimodal') DEFAULT 'text',
  `is_available` tinyint(1) DEFAULT '1',
  `quota_limits` json DEFAULT NULL,
  `rate_limits` json DEFAULT NULL,
  `pricing_info` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `last_synced` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `provider_model_mappings`
--

INSERT INTO `provider_model_mappings` (`id`, `provider_id`, `model_name`, `model_alias`, `model_version`, `model_type`, `is_available`, `quota_limits`, `rate_limits`, `pricing_info`, `metadata`, `last_synced`, `created_at`, `updated_at`) VALUES
(1, 3, 'gemini-pro', 'Gemini Pro', NULL, 'text', 1, NULL, NULL, NULL, '{\"family\": \"gemini\", \"parameters\": \"unknown\", \"description\": \"Google Gemini Pro model\"}', '2026-01-30 16:24:31', '2026-01-30 16:24:31', '2026-01-30 16:25:55'),
(2, 3, 'gemini-pro-vision', 'Gemini Pro Vision', NULL, 'vision', 1, NULL, NULL, NULL, '{\"family\": \"gemini\", \"parameters\": \"unknown\", \"description\": \"Google Gemini Pro Vision model\"}', '2026-01-30 16:24:31', '2026-01-30 16:24:31', '2026-01-30 16:25:55'),
(3, 3, 'text-embedding-004', 'Text Embedding', NULL, 'embedding', 1, NULL, NULL, NULL, '{\"family\": \"embedding\", \"parameters\": \"unknown\", \"description\": \"Google Text Embedding model\"}', '2026-01-30 16:24:31', '2026-01-30 16:24:31', '2026-01-30 16:25:55');

-- --------------------------------------------------------

--
-- Table structure for table `requests`
--

CREATE TABLE `requests` (
  `id` int NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `method` varchar(10) NOT NULL,
  `endpoint` text,
  `request_data` longtext,
  `response_data` longtext,
  `status` varchar(20) DEFAULT NULL,
  `processing_time` int DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `servers`
--

CREATE TABLE `servers` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `display_name` varchar(150) DEFAULT NULL,
  `hostname` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `status` enum('online','offline','maintenance','degraded') DEFAULT 'offline',
  `cpu_load` decimal(5,2) DEFAULT '0.00',
  `memory_usage` decimal(5,2) DEFAULT '0.00',
  `disk_usage` decimal(5,2) DEFAULT '0.00',
  `uptime_seconds` bigint DEFAULT '0',
  `last_heartbeat` timestamp NULL DEFAULT NULL,
  `provider_id` int DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_visible` tinyint(1) DEFAULT '1',
  `category` varchar(100) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `ui_config` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_monitoring`
--

CREATE TABLE `service_monitoring` (
  `id` int NOT NULL,
  `service_name` varchar(100) NOT NULL,
  `service_type` enum('frontend','backend','database','external_api','websocket','mcp') NOT NULL,
  `status` enum('online','offline','degraded','maintenance') DEFAULT 'offline',
  `health_check_url` varchar(255) DEFAULT NULL,
  `last_check_timestamp` timestamp NULL DEFAULT NULL,
  `response_time_ms` int DEFAULT NULL,
  `error_message` text,
  `version` varchar(50) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `service_monitoring`
--

INSERT INTO `service_monitoring` (`id`, `service_name`, `service_type`, `status`, `health_check_url`, `last_check_timestamp`, `response_time_ms`, `error_message`, `version`, `metadata`, `created_at`, `updated_at`) VALUES
(1, 'Frontend Admin Panel', 'frontend', 'offline', 'http://localhost:3001/api/health', NULL, NULL, NULL, NULL, NULL, '2026-01-31 20:27:33', '2026-01-31 20:27:33'),
(2, 'Backend API Server', 'backend', 'offline', 'http://localhost:8000/health', NULL, NULL, NULL, NULL, NULL, '2026-01-31 20:27:33', '2026-01-31 20:27:33'),
(3, 'MCP Server', 'mcp', 'offline', 'http://localhost:3002/api/health', NULL, NULL, NULL, NULL, NULL, '2026-01-31 20:27:33', '2026-01-31 20:27:33'),
(4, 'WebSocket MCP Server', 'websocket', 'offline', 'http://localhost:8080/health', NULL, NULL, NULL, NULL, NULL, '2026-01-31 20:27:33', '2026-01-31 20:27:33');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext,
  `description` text,
  `setting_type` enum('string','integer','boolean','json') DEFAULT 'string',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `description`, `setting_type`, `created_at`, `updated_at`) VALUES
(1, 'embedding.default_model', 'nomic-embed-text', 'Default embedding model for semantic search', 'string', '2026-01-29 16:32:10', '2026-01-29 16:32:10'),
(2, 'embedding.cache_enabled', 'true', 'Enable caching for embedding vectors', 'boolean', '2026-01-29 16:32:10', '2026-01-29 16:32:10'),
(3, 'embedding.similarity_threshold', '0.7', 'Minimum similarity threshold for search results', 'string', '2026-01-29 16:32:10', '2026-01-29 16:32:10'),
(4, 'file_watcher.enabled', 'true', 'Enable automatic file system monitoring', 'boolean', '2026-01-29 16:32:10', '2026-01-29 16:32:10'),
(5, 'file_watcher.scan_interval', '30', 'File system scan interval in seconds', 'integer', '2026-01-29 16:32:10', '2026-01-29 16:32:10');

-- --------------------------------------------------------

--
-- Table structure for table `user_preferences`
--

CREATE TABLE `user_preferences` (
  `id` int NOT NULL,
  `user_id` varchar(100) NOT NULL,
  `preference_key` varchar(100) NOT NULL,
  `preference_value` json NOT NULL,
  `preference_type` enum('string','number','boolean','array','object') DEFAULT 'string',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action_type` (`action_type`),
  ADD KEY `idx_target_resource` (`target_resource`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_audit_logs_user_action` (`user_id`,`action_type`,`created_at`);

--
-- Indexes for table `admin_configs`
--
ALTER TABLE `admin_configs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `config_key` (`config_key`),
  ADD KEY `idx_config_key` (`config_key`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `admin_dashboards`
--
ALTER TABLE `admin_dashboards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dashboard_key` (`dashboard_key`),
  ADD KEY `idx_dashboard_key` (`dashboard_key`),
  ADD KEY `idx_is_default` (`is_default`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `admin_forms`
--
ALTER TABLE `admin_forms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `form_key` (`form_key`),
  ADD KEY `idx_form_key` (`form_key`),
  ADD KEY `idx_target_table` (`target_table`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `admin_menu_items`
--
ALTER TABLE `admin_menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_href` (`href`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_is_visible` (`is_visible`),
  ADD KEY `idx_sort_order` (`sort_order`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_parent_id` (`parent_id`),
  ADD KEY `idx_menu_items_active_visible` (`is_active`,`is_visible`);

--
-- Indexes for table `admin_pages`
--
ALTER TABLE `admin_pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `page_key` (`page_key`),
  ADD UNIQUE KEY `route_path` (`route_path`),
  ADD KEY `idx_page_key` (`page_key`),
  ADD KEY `idx_route_path` (`route_path`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_sort_order` (`sort_order`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_admin_pages_active_category` (`is_active`,`category`);

--
-- Indexes for table `admin_permissions`
--
ALTER TABLE `admin_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_permission` (`role_name`,`resource`,`action`),
  ADD KEY `idx_role_name` (`role_name`),
  ADD KEY `idx_resource` (`resource`);

--
-- Indexes for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_setting_key` (`setting_key`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_is_editable` (`is_editable`);

--
-- Indexes for table `agents`
--
ALTER TABLE `agents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `agent_api_keys`
--
ALTER TABLE `agent_api_keys`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agent_id` (`agent_id`);

--
-- Indexes for table `agent_config_templates`
--
ALTER TABLE `agent_config_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `template_name` (`template_name`);

--
-- Indexes for table `agent_executions`
--
ALTER TABLE `agent_executions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agent_id` (`agent_id`);

--
-- Indexes for table `agent_memory`
--
ALTER TABLE `agent_memory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_agent_id` (`agent_id`),
  ADD KEY `idx_content_type` (`content_type`),
  ADD KEY `idx_cache_key` (`cache_key`),
  ADD KEY `idx_memory_agent_type` (`agent_id`,`content_type`);

--
-- Indexes for table `agent_monitoring`
--
ALTER TABLE `agent_monitoring`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agent_id` (`agent_id`);

--
-- Indexes for table `agent_requests`
--
ALTER TABLE `agent_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_agent_requests` (`agent_id`,`timestamp`),
  ADD KEY `idx_session` (`session_id`),
  ADD KEY `idx_response_status` (`response_status`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `agent_response_templates`
--
ALTER TABLE `agent_response_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agent_id` (`agent_id`);

--
-- Indexes for table `agent_runtime`
--
ALTER TABLE `agent_runtime`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_agent_status` (`agent_id`,`status`),
  ADD KEY `idx_heartbeat` (`last_heartbeat`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `agent_sessions`
--
ALTER TABLE `agent_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_id` (`session_id`),
  ADD KEY `idx_agent_id` (`agent_id`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_last_activity` (`last_activity`);

--
-- Indexes for table `agent_statistics`
--
ALTER TABLE `agent_statistics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_agent_date` (`agent_id`,`date`);

--
-- Indexes for table `ai_models`
--
ALTER TABLE `ai_models`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_model` (`provider_id`,`model_name`),
  ADD KEY `idx_provider_id` (`provider_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_models_provider_status` (`provider_id`,`status`);

--
-- Indexes for table `ai_providers`
--
ALTER TABLE `ai_providers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `api_audit_logs`
--
ALTER TABLE `api_audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_endpoint` (`endpoint`),
  ADD KEY `idx_method` (`method`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `cli_processes`
--
ALTER TABLE `cli_processes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `idx_model_name` (`model_name`),
  ADD KEY `idx_process_id` (`process_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_cli_processes_model_status` (`model_name`,`status`,`created_at`);

--
-- Indexes for table `connections`
--
ALTER TABLE `connections`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `connection_status`
--
ALTER TABLE `connection_status`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `connection_id` (`connection_id`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_uuid` (`session_uuid`),
  ADD KEY `idx_agent_id` (`agent_id`),
  ADD KEY `idx_session_uuid` (`session_uuid`);

--
-- Indexes for table `dashboard_widgets`
--
ALTER TABLE `dashboard_widgets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `widget_key` (`widget_key`),
  ADD KEY `idx_widget_key` (`widget_key`),
  ADD KEY `idx_widget_type` (`widget_type`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_sort_order` (`sort_order`),
  ADD KEY `idx_dashboard_widgets_active_order` (`is_active`,`sort_order`);

--
-- Indexes for table `dependency_installations`
--
ALTER TABLE `dependency_installations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dependency_name` (`dependency_name`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_installed_at` (`installed_at`);

--
-- Indexes for table `dynamic_forms`
--
ALTER TABLE `dynamic_forms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `form_key` (`form_key`),
  ADD KEY `idx_form_key` (`form_key`),
  ADD KEY `idx_target_table` (`target_table`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `editor_connections`
--
ALTER TABLE `editor_connections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `connection_id` (`connection_id`);

--
-- Indexes for table `editor_integrations`
--
ALTER TABLE `editor_integrations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_editor_type` (`editor_type`),
  ADD KEY `idx_is_connected` (`is_connected`);

--
-- Indexes for table `file_index`
--
ALTER TABLE `file_index`
  ADD PRIMARY KEY (`id`),
  ADD KEY `embedding_id` (`embedding_id`),
  ADD KEY `idx_project_file` (`project_id`,`file_path`),
  ADD KEY `idx_content_hash` (`content_hash`),
  ADD KEY `idx_file_type` (`file_type`),
  ADD KEY `idx_indexed` (`is_indexed`),
  ADD KEY `idx_last_modified` (`last_modified`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mcp_client_sessions`
--
ALTER TABLE `mcp_client_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_key` (`session_key`),
  ADD KEY `idx_session_key` (`session_key`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_last_connected` (`last_connected`);

--
-- Indexes for table `mcp_operations`
--
ALTER TABLE `mcp_operations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `memory_embeddings`
--
ALTER TABLE `memory_embeddings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_content_hash` (`content_hash`),
  ADD KEY `idx_embedding_type` (`embedding_type`),
  ADD KEY `idx_memory_updated` (`memory_id`,`updated_at`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conversation_id` (`conversation_id`),
  ADD KEY `idx_sender_type` (`sender_type`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_messages_conversation_timestamp` (`conversation_id`,`created_at`);

--
-- Indexes for table `model_dependency_mappings`
--
ALTER TABLE `model_dependency_mappings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_model_name` (`model_name`),
  ADD KEY `idx_dependency_id` (`dependency_id`),
  ADD KEY `idx_is_required` (`is_required`);

--
-- Indexes for table `model_metrics`
--
ALTER TABLE `model_metrics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_model_timestamp` (`model_id`,`timestamp`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `model_performance_metrics`
--
ALTER TABLE `model_performance_metrics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_model_id` (`model_id`),
  ADD KEY `idx_provider_model_id` (`provider_model_id`),
  ADD KEY `idx_test_type` (`test_type`),
  ADD KEY `idx_tested_at` (`tested_at`),
  ADD KEY `idx_success` (`success`),
  ADD KEY `idx_perf_metrics_model_test` (`model_id`,`test_type`,`tested_at`);

--
-- Indexes for table `performance_metrics`
--
ALTER TABLE `performance_metrics`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `project_context`
--
ALTER TABLE `project_context`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `project_path` (`project_path`),
  ADD KEY `idx_project_path` (`project_path`),
  ADD KEY `idx_indexing_status` (`indexing_status`),
  ADD KEY `idx_updated_at` (`updated_at`);

--
-- Indexes for table `prompt_templates`
--
ALTER TABLE `prompt_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_agent_id` (`agent_id`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `provider_configurations`
--
ALTER TABLE `provider_configurations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_provider_config` (`provider_id`,`config_key`),
  ADD KEY `idx_provider_id` (`provider_id`),
  ADD KEY `idx_config_key` (`config_key`);

--
-- Indexes for table `provider_model_mappings`
--
ALTER TABLE `provider_model_mappings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_provider_model` (`provider_id`,`model_name`),
  ADD KEY `idx_provider_id` (`provider_id`),
  ADD KEY `idx_model_name` (`model_name`),
  ADD KEY `idx_is_available` (`is_available`),
  ADD KEY `idx_model_type` (`model_type`),
  ADD KEY `idx_provider_models_sync` (`provider_id`,`is_available`,`last_synced`);

--
-- Indexes for table `requests`
--
ALTER TABLE `requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `servers`
--
ALTER TABLE `servers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_location` (`location`),
  ADD KEY `idx_last_heartbeat` (`last_heartbeat`);

--
-- Indexes for table `service_monitoring`
--
ALTER TABLE `service_monitoring`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_service_name` (`service_name`),
  ADD KEY `idx_service_type` (`service_type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_last_check` (`last_check_timestamp`),
  ADD KEY `idx_service_monitoring_status_check` (`status`,`last_check_timestamp`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_setting_key` (`setting_key`);

--
-- Indexes for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_preference` (`user_id`,`preference_key`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_preference_key` (`preference_key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_configs`
--
ALTER TABLE `admin_configs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `admin_dashboards`
--
ALTER TABLE `admin_dashboards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `admin_forms`
--
ALTER TABLE `admin_forms`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_menu_items`
--
ALTER TABLE `admin_menu_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `admin_pages`
--
ALTER TABLE `admin_pages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `admin_permissions`
--
ALTER TABLE `admin_permissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `admin_settings`
--
ALTER TABLE `admin_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `agents`
--
ALTER TABLE `agents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `agent_api_keys`
--
ALTER TABLE `agent_api_keys`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agent_config_templates`
--
ALTER TABLE `agent_config_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agent_executions`
--
ALTER TABLE `agent_executions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agent_memory`
--
ALTER TABLE `agent_memory`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agent_monitoring`
--
ALTER TABLE `agent_monitoring`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agent_requests`
--
ALTER TABLE `agent_requests`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agent_response_templates`
--
ALTER TABLE `agent_response_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agent_runtime`
--
ALTER TABLE `agent_runtime`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agent_sessions`
--
ALTER TABLE `agent_sessions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agent_statistics`
--
ALTER TABLE `agent_statistics`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_models`
--
ALTER TABLE `ai_models`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ai_providers`
--
ALTER TABLE `ai_providers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `api_audit_logs`
--
ALTER TABLE `api_audit_logs`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cli_processes`
--
ALTER TABLE `cli_processes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `connections`
--
ALTER TABLE `connections`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `connection_status`
--
ALTER TABLE `connection_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dashboard_widgets`
--
ALTER TABLE `dashboard_widgets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `dependency_installations`
--
ALTER TABLE `dependency_installations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dynamic_forms`
--
ALTER TABLE `dynamic_forms`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `editor_connections`
--
ALTER TABLE `editor_connections`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `editor_integrations`
--
ALTER TABLE `editor_integrations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `file_index`
--
ALTER TABLE `file_index`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mcp_client_sessions`
--
ALTER TABLE `mcp_client_sessions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `mcp_operations`
--
ALTER TABLE `mcp_operations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `memory_embeddings`
--
ALTER TABLE `memory_embeddings`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `model_dependency_mappings`
--
ALTER TABLE `model_dependency_mappings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `model_metrics`
--
ALTER TABLE `model_metrics`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `model_performance_metrics`
--
ALTER TABLE `model_performance_metrics`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `performance_metrics`
--
ALTER TABLE `performance_metrics`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_context`
--
ALTER TABLE `project_context`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `prompt_templates`
--
ALTER TABLE `prompt_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `provider_configurations`
--
ALTER TABLE `provider_configurations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `provider_model_mappings`
--
ALTER TABLE `provider_model_mappings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `requests`
--
ALTER TABLE `requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `servers`
--
ALTER TABLE `servers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_monitoring`
--
ALTER TABLE `service_monitoring`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_preferences`
--
ALTER TABLE `user_preferences`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_menu_items`
--
ALTER TABLE `admin_menu_items`
  ADD CONSTRAINT `admin_menu_items_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `admin_menu_items` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `agent_api_keys`
--
ALTER TABLE `agent_api_keys`
  ADD CONSTRAINT `agent_api_keys_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `agent_executions`
--
ALTER TABLE `agent_executions`
  ADD CONSTRAINT `agent_executions_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`);

--
-- Constraints for table `agent_memory`
--
ALTER TABLE `agent_memory`
  ADD CONSTRAINT `agent_memory_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `agent_monitoring`
--
ALTER TABLE `agent_monitoring`
  ADD CONSTRAINT `agent_monitoring_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`);

--
-- Constraints for table `agent_requests`
--
ALTER TABLE `agent_requests`
  ADD CONSTRAINT `agent_requests_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `agent_response_templates`
--
ALTER TABLE `agent_response_templates`
  ADD CONSTRAINT `agent_response_templates_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `agent_runtime`
--
ALTER TABLE `agent_runtime`
  ADD CONSTRAINT `agent_runtime_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `agent_sessions`
--
ALTER TABLE `agent_sessions`
  ADD CONSTRAINT `agent_sessions_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `agent_statistics`
--
ALTER TABLE `agent_statistics`
  ADD CONSTRAINT `agent_statistics_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ai_models`
--
ALTER TABLE `ai_models`
  ADD CONSTRAINT `ai_models_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cli_processes`
--
ALTER TABLE `cli_processes`
  ADD CONSTRAINT `cli_processes_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `file_index`
--
ALTER TABLE `file_index`
  ADD CONSTRAINT `file_index_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project_context` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `file_index_ibfk_2` FOREIGN KEY (`embedding_id`) REFERENCES `memory_embeddings` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `memory_embeddings`
--
ALTER TABLE `memory_embeddings`
  ADD CONSTRAINT `memory_embeddings_ibfk_1` FOREIGN KEY (`memory_id`) REFERENCES `agent_memory` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `model_dependency_mappings`
--
ALTER TABLE `model_dependency_mappings`
  ADD CONSTRAINT `model_dependency_mappings_ibfk_1` FOREIGN KEY (`dependency_id`) REFERENCES `dependency_installations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `model_metrics`
--
ALTER TABLE `model_metrics`
  ADD CONSTRAINT `model_metrics_ibfk_1` FOREIGN KEY (`model_id`) REFERENCES `ai_models` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `model_performance_metrics`
--
ALTER TABLE `model_performance_metrics`
  ADD CONSTRAINT `model_performance_metrics_ibfk_1` FOREIGN KEY (`model_id`) REFERENCES `ai_models` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `model_performance_metrics_ibfk_2` FOREIGN KEY (`provider_model_id`) REFERENCES `provider_model_mappings` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `prompt_templates`
--
ALTER TABLE `prompt_templates`
  ADD CONSTRAINT `prompt_templates_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `provider_configurations`
--
ALTER TABLE `provider_configurations`
  ADD CONSTRAINT `provider_configurations_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `provider_model_mappings`
--
ALTER TABLE `provider_model_mappings`
  ADD CONSTRAINT `provider_model_mappings_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `servers`
--
ALTER TABLE `servers`
  ADD CONSTRAINT `servers_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
