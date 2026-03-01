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
 -- AGENT TOOLS TABLE (DYNAMIC TOOL ENABLE/DISABLE + CONFIG)
 -- =====================================================
 CREATE TABLE IF NOT EXISTS agent_tools (
     id INT AUTO_INCREMENT PRIMARY KEY,
     agent_id INT NOT NULL,
     tool_name VARCHAR(100) NOT NULL,
     tool_category VARCHAR(50),
     is_active BOOLEAN DEFAULT TRUE,
     config JSON,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
     UNIQUE KEY unique_agent_tool (agent_id, tool_name),
     INDEX idx_agent_id (agent_id),
     INDEX idx_tool_name (tool_name),
     INDEX idx_is_active (is_active)
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
    INDEX idx_cache_key (cache_key),
    UNIQUE KEY unique_agent_memory_cache_key (cache_key)
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
 -- MCP SERVER MANAGEMENT
 -- =====================================================
 CREATE TABLE IF NOT EXISTS mcp_servers (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(120) NOT NULL UNIQUE,
     base_url VARCHAR(255) NOT NULL,
     status ENUM('online', 'offline', 'error', 'maintenance') DEFAULT 'offline',
     healthcheck_url VARCHAR(255),
     auth_type ENUM('none', 'api_key', 'bearer', 'basic') DEFAULT 'none',
     auth_config JSON,
     capabilities JSON,
     last_seen_at TIMESTAMP NULL,
     metadata JSON,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     INDEX idx_status (status),
     INDEX idx_last_seen_at (last_seen_at)
 );

 CREATE TABLE IF NOT EXISTS mcp_server_tools (
     id INT AUTO_INCREMENT PRIMARY KEY,
     mcp_server_id INT NOT NULL,
     tool_name VARCHAR(120) NOT NULL,
     description TEXT,
     input_schema JSON,
     output_schema JSON,
     is_active BOOLEAN DEFAULT TRUE,
     config JSON,
     metadata JSON,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     FOREIGN KEY (mcp_server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE,
     UNIQUE KEY unique_mcp_tool (mcp_server_id, tool_name),
     INDEX idx_mcp_server_id (mcp_server_id),
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

 -- =====================================================
 -- VECTOR INDEXING (METADATA) + SERVER LOCKS + MODEL LIFECYCLE LOG
 -- =====================================================
 CREATE TABLE IF NOT EXISTS vector_indexes (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(120) NOT NULL UNIQUE,
     provider ENUM('chromadb', 'faiss', 'qdrant', 'custom') DEFAULT 'chromadb',
     namespace VARCHAR(255),
     embedding_model VARCHAR(120),
     dimensions INT,
     config JSON,
     status ENUM('ready', 'building', 'error', 'disabled') DEFAULT 'building',
     last_built_at TIMESTAMP NULL,
     metadata JSON,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     INDEX idx_status (status),
     INDEX idx_last_built_at (last_built_at)
 );

 CREATE TABLE IF NOT EXISTS vector_index_documents (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     vector_index_id INT NOT NULL,
     source_type ENUM('file', 'conversation', 'memory', 'web', 'custom') NOT NULL,
     source_id VARCHAR(255),
     source_path VARCHAR(1024),
     content_hash VARCHAR(128),
     chunk_count INT DEFAULT 0,
     status ENUM('queued', 'indexed', 'error', 'deleted') DEFAULT 'queued',
     last_indexed_at TIMESTAMP NULL,
     error_message TEXT,
     metadata JSON,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     FOREIGN KEY (vector_index_id) REFERENCES vector_indexes(id) ON DELETE CASCADE,
     INDEX idx_vector_index_id (vector_index_id),
     INDEX idx_status (status),
     INDEX idx_source_type (source_type),
     INDEX idx_source_id (source_id)
 );

 CREATE TABLE IF NOT EXISTS server_locks (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     lock_key VARCHAR(150) NOT NULL,
     owner_id VARCHAR(150) NOT NULL,
     locked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     expires_at TIMESTAMP NULL,
     metadata JSON,
     UNIQUE KEY unique_lock_key (lock_key),
     INDEX idx_expires_at (expires_at)
 );
 
 CREATE TABLE IF NOT EXISTS ai_model_operations (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     provider_id INT,
     model_id INT,
     server_id INT,
     operation ENUM('pull', 'load', 'unload', 'delete', 'test', 'sync') NOT NULL,
     status ENUM('queued', 'running', 'success', 'error') DEFAULT 'queued',
     requested_by_user_id INT NULL,
     request_payload JSON,
     result_payload JSON,
     error_message TEXT,
     started_at TIMESTAMP NULL,
     completed_at TIMESTAMP NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE SET NULL,
     FOREIGN KEY (model_id) REFERENCES ai_models(id) ON DELETE SET NULL,
     FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE SET NULL,
     INDEX idx_status (status),
     INDEX idx_operation (operation),
     INDEX idx_requested_by_user_id (requested_by_user_id),
     INDEX idx_created_at (created_at)
 );

-- =====================================================
-- USER MANAGEMENT & ACCESS CONTROL (RBAC + PLANS)
-- =====================================================

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_key),
    INDEX idx_role_id (role_id),
    INDEX idx_permission_key (permission_key)
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    name VARCHAR(120),
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_role_id (role_id),
    INDEX idx_is_active (is_active)
);

CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255),
    duration_days INT NOT NULL,
    price_usd DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    features_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active)
);

CREATE TABLE IF NOT EXISTS user_plan_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('active', 'expired', 'revoked') DEFAULT 'active',
    starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP NOT NULL,
    created_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_plan_id (plan_id),
    INDEX idx_status (status),
    INDEX idx_ends_at (ends_at)
);

-- =====================================================
-- DEMO SEED DATA (IDEMPOTENT)
-- NOTE: Password hashes are placeholders for development only.
-- =====================================================

INSERT INTO roles (name, description, is_system)
VALUES
    ('admin', 'System administrator with full access', TRUE),
    ('user', 'Standard user with plan-based access', TRUE)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    is_system = VALUES(is_system);

INSERT IGNORE INTO role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM roles r
JOIN (
    SELECT 'admin.users.read' AS permission_key
    UNION ALL SELECT 'admin.users.write'
    UNION ALL SELECT 'admin.roles.read'
    UNION ALL SELECT 'admin.roles.write'
    UNION ALL SELECT 'admin.plans.read'
    UNION ALL SELECT 'admin.plans.write'
    UNION ALL SELECT 'admin.providers.read'
    UNION ALL SELECT 'admin.providers.write'
    UNION ALL SELECT 'admin.cli.execute'
    UNION ALL SELECT 'admin.tunnel.control'
) p
WHERE r.name = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM roles r
JOIN (
    SELECT 'app.chat.use' AS permission_key
    UNION ALL SELECT 'app.providers.read'
) p
WHERE r.name = 'user';

INSERT INTO plans (name, description, duration_days, price_usd, is_active, features_json)
VALUES
    ('Free', 'Free access', 7, 0.00, TRUE, JSON_OBJECT('limits', JSON_OBJECT('requests_per_day', 50))),
    ('Basic', 'Basic access', 30, 9.99, TRUE, JSON_OBJECT('limits', JSON_OBJECT('requests_per_day', 500))),
    ('Pro', 'Pro access', 30, 29.99, TRUE, JSON_OBJECT('limits', JSON_OBJECT('requests_per_day', 5000)))
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    duration_days = VALUES(duration_days),
    price_usd = VALUES(price_usd),
    is_active = VALUES(is_active),
    features_json = VALUES(features_json);

INSERT INTO users (email, name, password_hash, role_id, is_active)
SELECT
    'admin@example.com' AS email,
    'Admin' AS name,
    '$2b$10$REPLACE_ME_WITH_BCRYPT_HASH' AS password_hash,
    r.id AS role_id,
    TRUE AS is_active
FROM roles r
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    role_id = VALUES(role_id),
    is_active = VALUES(is_active);

INSERT INTO users (email, name, password_hash, role_id, is_active)
SELECT
    'user1@example.com' AS email,
    'User One' AS name,
    '$2b$10$REPLACE_ME_WITH_BCRYPT_HASH' AS password_hash,
    r.id AS role_id,
    TRUE AS is_active
FROM roles r
WHERE r.name = 'user'
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    role_id = VALUES(role_id),
    is_active = VALUES(is_active);

INSERT INTO user_plan_subscriptions (user_id, plan_id, status, starts_at, ends_at, created_by_user_id)
SELECT
    u.id AS user_id,
    pl.id AS plan_id,
    'active' AS status,
    NOW() AS starts_at,
    DATE_ADD(NOW(), INTERVAL pl.duration_days DAY) AS ends_at,
    a.id AS created_by_user_id
FROM users u
JOIN plans pl ON pl.name = 'Basic'
JOIN users a ON a.email = 'admin@example.com'
WHERE u.email = 'user1@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM user_plan_subscriptions s
    WHERE s.user_id = u.id
      AND s.plan_id = pl.id
      AND s.status = 'active'
);

-- Create additional indexes for performance
SET @sql := IF(
  (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'ai_models' AND index_name = 'idx_models_provider_status') = 0,
  'CREATE INDEX idx_models_provider_status ON ai_models(provider_id, status)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'messages' AND index_name = 'idx_messages_conversation_timestamp') = 0,
  'CREATE INDEX idx_messages_conversation_timestamp ON messages(conversation_id, created_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'agent_memory' AND index_name = 'idx_memory_agent_type') = 0,
  'CREATE INDEX idx_memory_agent_type ON agent_memory(agent_id, content_type)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
