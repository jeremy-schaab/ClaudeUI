# API Configuration Design - Multi-Provider Support

**Version:** 1.0.0
**Date:** 2025-11-10

---

## Overview

Add flexible API configuration management to support multiple LLM providers (Anthropic direct, AWS Bedrock, Azure OpenAI, custom endpoints) at both global and project-specific levels.

## Business Requirements

1. **Global Default Configuration** - Set API provider, URL, and key at application level
2. **Project-Specific Overrides** - Each project can use a different API configuration
3. **Multiple Provider Support**:
   - Anthropic Direct (api.anthropic.com)
   - AWS Bedrock (bedrock-runtime.{region}.amazonaws.com)
   - Azure OpenAI (*.openai.azure.com)
   - Custom endpoints (self-hosted, proxy servers)
4. **Dynamic Model Discovery** - Fetch available models from API or manual configuration
5. **Secure Credential Storage** - API keys stored securely, support for environment variables
6. **UI Configuration** - Easy-to-use interface for managing API configs

---

## Data Model

### Database Schema

```sql
-- API Configurations table
CREATE TABLE IF NOT EXISTS api_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,           -- User-friendly name: "Production", "Bedrock Dev", "Azure Test"
  provider TEXT NOT NULL,              -- "anthropic", "bedrock", "azure", "custom"
  api_url TEXT NOT NULL,               -- Base URL for API calls
  api_key_source TEXT NOT NULL,        -- "inline", "env", "file"
  api_key_value TEXT,                  -- Encrypted key if inline, env var name if env, path if file
  auth_type TEXT DEFAULT 'bearer',     -- "bearer", "aws_sig_v4", "azure_ad", "custom"
  region TEXT,                         -- AWS region for Bedrock (e.g., "us-east-1")
  models TEXT,                         -- JSON array of available models (cached)
  model_refresh_strategy TEXT DEFAULT 'manual', -- "manual", "on_start", "periodic"
  connection_timeout INTEGER DEFAULT 30000,     -- Timeout in ms
  max_retries INTEGER DEFAULT 3,
  extra_headers TEXT,                  -- JSON object of additional HTTP headers
  is_active BOOLEAN DEFAULT 1,         -- Enable/disable without deleting
  is_default BOOLEAN DEFAULT 0,        -- Default config for new projects
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick default lookup
CREATE INDEX IF NOT EXISTS idx_api_configs_default ON api_configurations(is_default) WHERE is_default = 1;

-- Link projects to API configurations
ALTER TABLE projects ADD COLUMN api_config_id INTEGER REFERENCES api_configurations(id) ON DELETE SET NULL;

-- Add index for project API config lookups
CREATE INDEX IF NOT EXISTS idx_projects_api_config ON projects(api_config_id);

-- Store global default config ID in settings
-- (Fallback when project has no api_config_id)
INSERT INTO settings (key, value) VALUES ('DEFAULT_API_CONFIG_ID', '1')
  ON CONFLICT(key) DO NOTHING;
```

### Default Data

```sql
-- Create default Anthropic Direct configuration
INSERT INTO api_configurations (
  name,
  provider,
  api_url,
  api_key_source,
  api_key_value,
  auth_type,
  models,
  is_default
) VALUES (
  'Anthropic Direct (Default)',
  'anthropic',
  'https://api.anthropic.com',
  'env',
  'ANTHROPIC_API_KEY',
  'bearer',
  '["claude-opus-4-20250514","claude-sonnet-4-5-20250929","claude-sonnet-4-20250514","claude-haiku-4-20250514","claude-3-5-haiku-20241022"]',
  1
);
```

---

## API Configuration Types

### 1. Anthropic Direct

```json
{
  "name": "Anthropic Direct",
  "provider": "anthropic",
  "api_url": "https://api.anthropic.com",
  "api_key_source": "env",
  "api_key_value": "ANTHROPIC_API_KEY",
  "auth_type": "bearer",
  "models": [
    "claude-opus-4-20250514",
    "claude-sonnet-4-5-20250929",
    "claude-haiku-4-20250514"
  ]
}
```

**Request Format:**
```http
POST https://api.anthropic.com/v1/messages
Authorization: Bearer ${API_KEY}
Content-Type: application/json
anthropic-version: 2023-06-01

{
  "model": "claude-sonnet-4-5-20250929",
  "messages": [...]
}
```

---

### 2. AWS Bedrock

```json
{
  "name": "AWS Bedrock Production",
  "provider": "bedrock",
  "api_url": "https://bedrock-runtime.us-east-1.amazonaws.com",
  "api_key_source": "env",
  "api_key_value": "AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY",
  "auth_type": "aws_sig_v4",
  "region": "us-east-1",
  "models": [
    "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "anthropic.claude-3-opus-20240229-v1:0",
    "anthropic.claude-3-haiku-20240307-v1:0"
  ]
}
```

**Request Format:**
```http
POST https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-5-sonnet-20241022-v2:0/invoke
Authorization: AWS4-HMAC-SHA256 Credential=...
Content-Type: application/json

{
  "anthropic_version": "bedrock-2023-05-31",
  "messages": [...]
}
```

**Special Requirements:**
- AWS Signature Version 4 signing
- Model IDs have different format (e.g., `anthropic.claude-3-5-sonnet-20241022-v2:0`)
- Different endpoint pattern: `/model/{model-id}/invoke`

---

### 3. Azure OpenAI (for Claude via Azure)

```json
{
  "name": "Azure OpenAI",
  "provider": "azure",
  "api_url": "https://my-resource.openai.azure.com",
  "api_key_source": "env",
  "api_key_value": "AZURE_OPENAI_API_KEY",
  "auth_type": "bearer",
  "extra_headers": {
    "api-version": "2024-02-15-preview"
  },
  "models": [
    "claude-deployment-1",
    "claude-deployment-2"
  ]
}
```

**Request Format:**
```http
POST https://my-resource.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version=2024-02-15-preview
api-key: ${API_KEY}
Content-Type: application/json

{
  "messages": [...]
}
```

---

### 4. Custom / Proxy

```json
{
  "name": "Internal Claude Proxy",
  "provider": "custom",
  "api_url": "https://internal-ai-gateway.company.com",
  "api_key_source": "inline",
  "api_key_value": "encrypted:AES256:...",
  "auth_type": "bearer",
  "extra_headers": {
    "X-Company-Team": "engineering",
    "X-Cost-Center": "12345"
  },
  "models": [
    "claude-sonnet",
    "claude-opus"
  ]
}
```

---

## API Key Storage Strategies

### 1. Environment Variable (Recommended)

```json
{
  "api_key_source": "env",
  "api_key_value": "ANTHROPIC_API_KEY"
}
```

**Behavior:**
- Read from `process.env[api_key_value]`
- Never stored in database
- Must be set before server starts
- Secure for production

**UI Display:**
- Show "Loaded from environment variable: ANTHROPIC_API_KEY ✓"
- Indicate if variable is missing: "⚠️ ANTHROPIC_API_KEY not found"

---

### 2. Inline (Encrypted in Database)

```json
{
  "api_key_source": "inline",
  "api_key_value": "encrypted:AES256:base64encodedkey"
}
```

**Behavior:**
- Encrypted with AES-256 using server secret key
- Stored in database
- Convenient but less secure
- Requires `API_ENCRYPTION_KEY` environment variable

**Encryption:**
```javascript
const crypto = require('crypto');

function encryptApiKey(plainKey) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.API_ENCRYPTION_KEY, 'hex'); // 32 bytes
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `encrypted:AES256:${iv.toString('hex')}:${encrypted}`;
}

function decryptApiKey(encryptedKey) {
  if (!encryptedKey.startsWith('encrypted:AES256:')) {
    throw new Error('Invalid encrypted key format');
  }
  const [, , ivHex, encryptedHex] = encryptedKey.split(':');
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.API_ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**UI Display:**
- Show masked key: "sk-ant-...abc123"
- Allow reveal with click (requires confirmation)
- Show "Key stored encrypted in database"

---

### 3. File Path

```json
{
  "api_key_source": "file",
  "api_key_value": "/secrets/anthropic-key.txt"
}
```

**Behavior:**
- Read from file system at runtime
- File should contain only the API key
- Useful for Docker secrets, Kubernetes secrets

**UI Display:**
- Show "Loaded from file: /secrets/anthropic-key.txt"
- Indicate if file is missing or unreadable

---

## Authentication Types

### 1. Bearer Token (Default)

```
Authorization: Bearer ${API_KEY}
```

Used by: Anthropic Direct, most custom endpoints

---

### 2. AWS Signature V4

```
Authorization: AWS4-HMAC-SHA256 Credential=...
X-Amz-Date: 20231110T153000Z
```

Used by: AWS Bedrock

Requires:
- AWS Access Key ID
- AWS Secret Access Key
- Optional: AWS Session Token (for temporary credentials)
- Region

**Implementation:**
```javascript
const aws4 = require('aws4'); // Use aws4 npm package

function signBedrockRequest(request, credentials, region) {
  const signed = aws4.sign({
    service: 'bedrock',
    region: region,
    method: request.method,
    path: request.path,
    host: `bedrock-runtime.${region}.amazonaws.com`,
    headers: request.headers,
    body: JSON.stringify(request.body)
  }, {
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    sessionToken: credentials.sessionToken // optional
  });

  return signed;
}
```

---

### 3. Azure API Key

```
api-key: ${API_KEY}
```

Used by: Azure OpenAI

Simple header-based authentication.

---

### 4. Custom

User-defined authentication mechanism. Store in `extra_headers`.

---

## Model Management

### Model Discovery Strategies

#### 1. Manual

User manually enters model IDs in the UI.

```json
{
  "model_refresh_strategy": "manual",
  "models": [
    "claude-opus-4-20250514",
    "claude-sonnet-4-5-20250929"
  ]
}
```

---

#### 2. On Start (Future)

Fetch available models when server starts.

```json
{
  "model_refresh_strategy": "on_start"
}
```

**Implementation:**
- On server startup, call provider's model list API
- Cache results in `models` field
- Fallback to cached list if API fails

---

#### 3. Periodic (Future)

Refresh model list on schedule (e.g., daily).

```json
{
  "model_refresh_strategy": "periodic",
  "model_refresh_interval_hours": 24
}
```

---

### Model Mapping

Different providers use different model IDs. We maintain a mapping:

| ClaudeUI Display Name | Anthropic Direct | AWS Bedrock | Azure (Example) |
|-----------------------|------------------|-------------|-----------------|
| Claude Opus 4 | claude-opus-4-20250514 | anthropic.claude-opus-4-20250514-v1:0 | claude-opus-deployment |
| Claude Sonnet 4.5 | claude-sonnet-4-5-20250929 | anthropic.claude-3-5-sonnet-20241022-v2:0 | claude-sonnet-deployment |
| Claude Haiku 3.5 | claude-3-5-haiku-20241022 | anthropic.claude-3-haiku-20240307-v1:0 | claude-haiku-deployment |

**Storage:**
```json
{
  "models": [
    {
      "id": "claude-opus-4-20250514",
      "display_name": "Claude Opus 4",
      "description": "Powerful model for complex tasks",
      "provider_model_id": "claude-opus-4-20250514", // or Bedrock ID
      "context_window": 200000,
      "max_output_tokens": 4096,
      "cost_per_1k_input": 0.015,
      "cost_per_1k_output": 0.075
    }
  ]
}
```

---

## Configuration Resolution Flow

When a user starts a conversation in a project:

1. **Get Project** → Check `project.api_config_id`
2. **If project has api_config_id**:
   - Load API config from `api_configurations` table
   - Use project-specific config
3. **Else**:
   - Load default config from settings: `DEFAULT_API_CONFIG_ID`
   - Fall back to global config
4. **Resolve API Key**:
   - If `api_key_source = 'env'`, read from environment
   - If `api_key_source = 'inline'`, decrypt from database
   - If `api_key_source = 'file'`, read from file
5. **Make API Request**:
   - Use `api_url` as base
   - Apply `auth_type` to construct auth headers
   - Add `extra_headers` if defined
   - Send request to provider

---

## REST API Endpoints

### 1. List API Configurations

**`GET /api/api-configs`**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Anthropic Direct (Default)",
      "provider": "anthropic",
      "api_url": "https://api.anthropic.com",
      "api_key_source": "env",
      "api_key_status": "loaded",  // "loaded", "missing", "error"
      "auth_type": "bearer",
      "region": null,
      "model_count": 5,
      "is_active": true,
      "is_default": true,
      "created_at": "2025-11-01T10:00:00.000Z",
      "updated_at": "2025-11-01T10:00:00.000Z",
      "_links": {
        "self": "/api/api-configs/1",
        "models": "/api/api-configs/1/models",
        "test": "/api/api-configs/1/test"
      }
    }
  ],
  "meta": {
    "total": 3,
    "count": 3
  }
}
```

**Note:** `api_key_value` is NEVER returned in responses.

---

### 2. Get Single API Configuration

**`GET /api/api-configs/:id`**

Returns full config details (excluding sensitive key value).

---

### 3. Create API Configuration

**`POST /api/api-configs`**

```json
{
  "name": "AWS Bedrock Production",
  "provider": "bedrock",
  "api_url": "https://bedrock-runtime.us-east-1.amazonaws.com",
  "api_key_source": "env",
  "api_key_value": "AWS_ACCESS_KEY_ID",
  "auth_type": "aws_sig_v4",
  "region": "us-east-1",
  "models": [
    {
      "id": "anthropic.claude-3-5-sonnet-20241022-v2:0",
      "display_name": "Claude Sonnet 3.5",
      "provider_model_id": "anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  ],
  "is_default": false
}
```

**Response: `201 Created`**

---

### 4. Update API Configuration

**`PATCH /api/api-configs/:id`**

Partial update of config fields.

---

### 5. Delete API Configuration

**`DELETE /api/api-configs/:id`**

Deletes config. Projects using this config will fall back to default.

---

### 6. Test API Configuration

**`POST /api/api-configs/:id/test`**

Test connectivity and authentication.

```json
{
  "test_type": "auth"  // "auth", "list_models", "simple_request"
}
```

**Response: `200 OK`**
```json
{
  "data": {
    "success": true,
    "api_config_id": 1,
    "test_type": "auth",
    "response_time_ms": 234,
    "message": "Successfully authenticated with Anthropic API",
    "details": {
      "status_code": 200,
      "models_available": 5
    }
  }
}
```

**Response: `200 OK` (Failed Test)**
```json
{
  "data": {
    "success": false,
    "api_config_id": 1,
    "test_type": "auth",
    "response_time_ms": 1200,
    "message": "Authentication failed: Invalid API key",
    "details": {
      "status_code": 401,
      "error": "invalid_api_key"
    }
  }
}
```

---

### 7. List Models for Config

**`GET /api/api-configs/:id/models`**

Returns cached or live models for this config.

```json
{
  "data": [
    {
      "id": "claude-opus-4-20250514",
      "display_name": "Claude Opus 4",
      "description": "Powerful model for complex tasks",
      "provider_model_id": "claude-opus-4-20250514",
      "context_window": 200000,
      "max_output_tokens": 4096
    }
  ],
  "meta": {
    "api_config_id": 1,
    "last_refreshed": "2025-11-10T12:00:00.000Z",
    "source": "manual"  // "manual", "api", "cache"
  }
}
```

---

### 8. Refresh Models

**`POST /api/api-configs/:id/models/refresh`**

Trigger manual model refresh from provider API.

**Response: `200 OK`**
```json
{
  "data": {
    "api_config_id": 1,
    "models_updated": 5,
    "models_added": 1,
    "models_removed": 0,
    "last_refreshed": "2025-11-10T16:30:00.000Z"
  }
}
```

---

## UI Components

### 1. API Configurations List Page

```
┌────────────────────────────────────────────────────────────┐
│ API Configurations                      [+ New Config]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ⭐ Anthropic Direct (Default)              Active  │   │
│ │ Provider: Anthropic • URL: api.anthropic.com       │   │
│ │ Auth: Bearer Token • Key: Environment Variable ✓   │   │
│ │ Models: 5 available                                │   │
│ │                                                     │   │
│ │ [Test Connection] [Edit] [Set as Default]          │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ AWS Bedrock Production                     Active  │   │
│ │ Provider: AWS Bedrock • Region: us-east-1          │   │
│ │ Auth: AWS Sig V4 • Key: Environment Variable ✓     │   │
│ │ Models: 3 available                                │   │
│ │                                                     │   │
│ │ [Test Connection] [Edit] [Delete]                  │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Internal Proxy                          Inactive   │   │
│ │ Provider: Custom • URL: internal-gateway.corp      │   │
│ │ Auth: Bearer Token • Key: Encrypted in DB          │   │
│ │ Models: 2 available                                │   │
│ │                                                     │   │
│ │ [Activate] [Edit] [Delete]                         │   │
│ └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

### 2. API Configuration Form

```
┌──────────────────────────────────────────────────────────────┐
│ Create API Configuration                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Name*                                                        │
│ [AWS Bedrock Production                                   ]  │
│                                                              │
│ Provider*                                                    │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ○ Anthropic Direct                                   │   │
│ │ ● AWS Bedrock                                        │   │
│ │ ○ Azure OpenAI                                       │   │
│ │ ○ Custom / Proxy                                     │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ API URL*                                                     │
│ [https://bedrock-runtime.us-east-1.amazonaws.com         ]  │
│                                                              │
│ Region (for AWS Bedrock)*                                   │
│ [us-east-1 ▼]                                               │
│                                                              │
│ Authentication                                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Type: [AWS Signature V4 ▼]                          │   │
│ │                                                      │   │
│ │ API Key Source: [Environment Variable ▼]            │   │
│ │                                                      │   │
│ │ Access Key ID: [AWS_ACCESS_KEY_ID              ]    │   │
│ │ Secret Key:    [AWS_SECRET_ACCESS_KEY          ]    │   │
│ │                                                      │   │
│ │ ℹ️  Keys will be read from environment variables     │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Models Configuration                                         │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ● Manual Entry                                       │   │
│ │ ○ Auto-discover on save                             │   │
│ │                                                      │   │
│ │ Model IDs (one per line):                           │   │
│ │ ┌────────────────────────────────────────────────┐  │   │
│ │ │anthropic.claude-3-5-sonnet-20241022-v2:0      │  │   │
│ │ │anthropic.claude-3-opus-20240229-v1:0          │  │   │
│ │ │anthropic.claude-3-haiku-20240307-v1:0         │  │   │
│ │ └────────────────────────────────────────────────┘  │   │
│ │                                                      │   │
│ │ [Import from JSON]                                   │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Advanced                                                     │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Connection Timeout: [30000] ms                       │   │
│ │ Max Retries: [3]                                     │   │
│ │                                                      │   │
│ │ Extra Headers (JSON):                                │   │
│ │ {                                                    │   │
│ │   "X-Custom-Header": "value"                         │   │
│ │ }                                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ☐ Set as default configuration                              │
│ ☑ Active (enable immediately)                               │
│                                                              │
│ [Cancel]  [Test Connection]  [Save Configuration]           │
└──────────────────────────────────────────────────────────────┘
```

---

### 3. Project Settings - API Config Override

In the Project Settings UI, add a section:

```
┌──────────────────────────────────────────────────────────┐
│ Project Settings                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ API Configuration                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ○ Use global default (Anthropic Direct)           │ │
│ │ ● Use project-specific configuration               │ │
│ │                                                    │ │
│ │   API Config: [AWS Bedrock Production ▼]          │ │
│ │                                                    │ │
│ │   Default Model: [Claude Sonnet 3.5 ▼]            │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ℹ️  This project will use AWS Bedrock API instead of    │
│    the global Anthropic Direct configuration.           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### 4. Test Connection Modal

```
┌───────────────────────────────────────────────┐
│ Testing API Configuration...                  │
├───────────────────────────────────────────────┤
│                                               │
│ ✓ Connection established (234ms)              │
│ ✓ Authentication successful                   │
│ ✓ Retrieved 3 available models                │
│                                               │
│ Details:                                      │
│ • Provider: AWS Bedrock                       │
│ • Region: us-east-1                           │
│ • Status: 200 OK                              │
│                                               │
│ Models Detected:                              │
│ • anthropic.claude-3-5-sonnet-20241022-v2:0  │
│ • anthropic.claude-3-opus-20240229-v1:0      │
│ • anthropic.claude-3-haiku-20240307-v1:0     │
│                                               │
│              [Close]  [Use These Models]      │
└───────────────────────────────────────────────┘
```

---

## Security Considerations

### 1. API Key Protection

- ✅ **Never log API keys** - Scrub from logs and error messages
- ✅ **Never return keys in API responses** - Only return `api_key_source` and status
- ✅ **Encrypt inline keys** - Use AES-256 with server secret
- ✅ **Use environment variables for production** - Recommended approach
- ✅ **Mask keys in UI** - Show only last 4 characters: `sk-ant-...abc123`

### 2. Access Control (Future)

- Multi-user support: Only admins can create/edit API configs
- Audit log: Track who created/modified configs
- API key rotation: Support expiring and rotating keys

### 3. Network Security

- HTTPS only for API URLs
- Validate SSL certificates (option to disable for testing)
- Support proxy servers
- IP whitelisting (for Bedrock VPC endpoints)

---

## Migration Path

### Phase 1: Database Migration

1. Create `api_configurations` table
2. Migrate existing global settings to default config:
   - Read `ANTHROPIC_API_KEY` from settings
   - Create default Anthropic Direct config
   - Set `DEFAULT_API_CONFIG_ID` in settings
3. Add `api_config_id` to projects table

### Phase 2: Backend Implementation

1. Implement API config CRUD operations
2. Implement configuration resolution logic
3. Implement authentication handlers (Bearer, AWS SigV4)
4. Implement test connection functionality
5. Update conversation creation to use project's API config

### Phase 3: UI Implementation

1. Create API Configs management page
2. Add API config selector to project settings
3. Update model selector to filter by active config's models
4. Add "Test Connection" UI flows

---

## Future Enhancements

1. **Cost Tracking** - Track API usage and costs per config/project
2. **Rate Limiting** - Enforce rate limits per config
3. **Failover** - Automatic fallback to secondary config if primary fails
4. **Load Balancing** - Distribute requests across multiple configs
5. **Model Router** - Automatically select best model based on task
6. **Caching** - Cache responses to reduce API costs
7. **Multi-region Support** - Bedrock in multiple AWS regions
8. **SSO Integration** - Use corporate SSO for API access

---

**Version:** 1.0.0
**Last Updated:** 2025-11-10
