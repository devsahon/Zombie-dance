-- UAS Admin System - MySQL Database Schema
-- Version: 1.0
-- Last Updated: 2026-01-24

-- Create Database
CREATE DATABASE IF NOT EXISTS uas_admin;
USE uas_admin;

-- =====================================================
-- CORE PROVIDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('openai', 'google', 'glm', 'ollama', 'llama_cpp', 'custom') NOT NULL,
    api_endpoint VARCHAR(255) NOT NULL,
    api_key_encrypted TEXT,
    config_json JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_is_active (is_active)
);

-- =====================================================
-- SERVERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    location VARCHAR(100),
    status ENUM('online', 'offline', 'maintenance', 'degraded') DEFAULT 'offline',
    cpu_load DECIMAL(5,2) DEFAULT 0.00,
    memory_usage DECIMAL(5,2) DEFAULT 0.00,
    disk_usage DECIMAL(5,2) DEFAULT 0.00,
    uptime_seconds BIGINT DEFAULT 0,
    last_heartbeat TIMESTAMP NULL,
    provider_id INT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_location (location),
    INDEX idx_last_heartbeat (last_heartbeat)
);

-- =====================================================
-- AI MODELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    status ENUM('running', 'stopped', 'error', 'pending', 'loading') DEFAULT 'stopped',
    cpu_usage DECIMAL(5,2) DEFAULT 0.00,
    memory_usage DECIMAL(5,2) DEFAULT 0.00,
    requests_handled INT DEFAULT 0,
    last_response_time INT,
    total_tokens_used BIGINT DEFAULT 0,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE,
    INDEX idx_provider_id (provider_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_model (provider_id, model_name)
);

-- =====================================================
-- AGENTS CONFIGURATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('editor', 'master', 'chatbot') NOT NULL,
    persona_name VARCHAR(100),
    description TEXT,
    status ENUM('active', 'inactive', 'error', 'busy') DEFAULT 'inactive',
    config JSON,
    request_count INT DEFAULT 0,
    active_sessions INT DEFAULT 0,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status)
);

-- =====================================================
-- AGENT MEMORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_memory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    content_type ENUM('conversation', 'knowledge', 'context', 'code_action', 'lsp_log', 'debug_info') NOT NULL,
    content LONGTEXT,
    metadata JSON,
    is_cached BOOLEAN DEFAULT FALSE,
    cache_key VARCHAR(255),
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    INDEX idx_agent_id (agent_id),
    INDEX idx_content_type (content_type),
    INDEX idx_cache_key (cache_key)
);

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    agent_id INT NOT NULL,
    session_uuid VARCHAR(100) UNIQUE NOT NULL,
    message_count INT DEFAULT 0,
    project_config JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    INDEX idx_agent_id (agent_id),
    INDEX idx_session_uuid (session_uuid)
);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_type ENUM('user', 'agent', 'system', 'editor_proxy') NOT NULL,
    model_used VARCHAR(100),
    content LONGTEXT NOT NULL,
    response_metadata JSON,
    token_usage INT DEFAULT 0,
    latency_ms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_type (sender_type),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- PROMPT TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS prompt_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    template_content LONGTEXT NOT NULL,
    variables JSON,
    agent_id INT,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
    INDEX idx_agent_id (agent_id),
    INDEX idx_is_active (is_active)
);

-- =====================================================
-- EDITOR INTEGRATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS editor_integrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    editor_type ENUM('vscode', 'cursor', 'jetbrains', 'sublime', 'vim', 'custom') NOT NULL,
    connection_url VARCHAR(255),
    api_token_encrypted TEXT,
    lsp_port INT,
    dap_port INT,
    is_connected BOOLEAN DEFAULT FALSE,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_editor_type (editor_type),
    INDEX idx_is_connected (is_connected)
);

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value LONGTEXT,
    description TEXT,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
);

-- =====================================================
-- API AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS api_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INT,
    response_time_ms INT,
    user_ip VARCHAR(45),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_endpoint (endpoint),
    INDEX idx_method (method),
    INDEX idx_created_at (created_at)
);

-- Create additional indexes for performance
CREATE INDEX idx_models_provider_status ON ai_models(provider_id, status);
CREATE INDEX idx_messages_conversation_timestamp ON messages(conversation_id, created_at);
CREATE INDEX idx_memory_agent_type ON agent_memory(agent_id, content_type);
