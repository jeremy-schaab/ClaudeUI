# API Configurations - REST Endpoints

**Add this section to `api-specification-rest.md` as Section 6**

---

## 6. API Configurations

### 6.1 List API Configurations

**`GET /api/api-configs`**

Retrieve all API configurations.

**Query Parameters:**
- `active` (boolean, optional) - Filter by active status
  - Example: `/api/api-configs?active=true`
- `provider` (string, optional) - Filter by provider
  - Values: `anthropic`, `bedrock`, `azure`, `custom`
  - Example: `/api/api-configs?provider=bedrock`

**Response: `200 OK`**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Anthropic Direct (Default)",
      "provider": "anthropic",
      "api_url": "https://api.anthropic.com",
      "api_key_source": "env",
      "api_key_status": "loaded",
      "auth_type": "bearer",
      "region": null,
      "connection_timeout": 30000,
      "max_retries": 3,
      "is_active": true,
      "is_default": true,
      "created_at": "2025-11-01T10:00:00.000Z",
      "updated_at": "2025-11-01T10:00:00.000Z",
      "_links": {
        "self": "/api/api-configs/1",
        "models": "/api/api-configs/1/models",
        "test": "/api/api-configs/1/test"
      },
      "_counts": {
        "models": 5,
        "projects_using": 3
      }
    },
    {
      "id": 2,
      "name": "AWS Bedrock Production",
      "provider": "bedrock",
      "api_url": "https://bedrock-runtime.us-east-1.amazonaws.com",
      "api_key_source": "env",
      "api_key_status": "loaded",
      "auth_type": "aws_sig_v4",
      "region": "us-east-1",
      "connection_timeout": 30000,
      "max_retries": 3,
      "is_active": true,
      "is_default": false,
      "created_at": "2025-11-05T14:00:00.000Z",
      "updated_at": "2025-11-05T14:00:00.000Z",
      "_links": {
        "self": "/api/api-configs/2",
        "models": "/api/api-configs/2/models",
        "test": "/api/api-configs/2/test"
      },
      "_counts": {
        "models": 3,
        "projects_using": 1
      }
    }
  ],
  "meta": {
    "total": 2,
    "count": 2
  }
}
```

**Note:** `api_key_value` is NEVER included in responses for security.

**Field Descriptions:**
- `api_key_status` - Computed field showing if key is accessible
  - `"loaded"` - Key successfully loaded (env var exists, file readable, or encrypted key decrypted)
  - `"missing"` - Environment variable not set or file not found
  - `"error"` - Error accessing key (decryption failed, permission denied)

---

### 6.2 Get Single API Configuration

**`GET /api/api-configs/:id`**

Retrieve a specific API configuration.

**Path Parameters:**
- `id` (integer, required) - API Config ID

**Response: `200 OK`**
```json
{
  "data": {
    "id": 1,
    "name": "Anthropic Direct (Default)",
    "provider": "anthropic",
    "api_url": "https://api.anthropic.com",
    "api_key_source": "env",
    "api_key_value_hint": "ANTHROPIC_API_KEY",
    "api_key_status": "loaded",
    "auth_type": "bearer",
    "region": null,
    "model_refresh_strategy": "manual",
    "connection_timeout": 30000,
    "max_retries": 3,
    "extra_headers": null,
    "is_active": true,
    "is_default": true,
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-01T10:00:00.000Z",
    "_links": {
      "self": "/api/api-configs/1",
      "models": "/api/api-configs/1/models",
      "test": "/api/api-configs/1/test",
      "projects": "/api/projects?api_config_id=1"
    },
    "_counts": {
      "models": 5,
      "projects_using": 3
    }
  }
}
```

**Note:** `api_key_value_hint` shows the environment variable name, file path, or masked inline key (`sk-ant-...abc123`), never the actual key.

**Error Responses:**
- `404 Not Found` - API configuration does not exist

---

### 6.3 Create API Configuration

**`POST /api/api-configs`**

Create a new API configuration.

**Request Body:**
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
  ],
  "model_refresh_strategy": "manual",
  "connection_timeout": 30000,
  "max_retries": 3,
  "extra_headers": null,
  "is_active": true,
  "is_default": false
}
```

**Required Fields:**
- `name` (string, 1-100 chars, unique) - Configuration name
- `provider` (string) - One of: `anthropic`, `bedrock`, `azure`, `custom`
- `api_url` (string) - Base URL for API
- `api_key_source` (string) - One of: `env`, `inline`, `file`
- `api_key_value` (string) - Env var name, encrypted key, or file path
- `auth_type` (string) - One of: `bearer`, `aws_sig_v4`, `azure_ad`, `custom`

**Optional Fields:**
- `region` (string) - AWS region (required for Bedrock)
- `models` (array) - Model IDs or objects
- `model_refresh_strategy` (string) - Default: `manual`
- `connection_timeout` (integer) - Default: `30000` ms
- `max_retries` (integer) - Default: `3`
- `extra_headers` (object) - Additional HTTP headers
- `is_active` (boolean) - Default: `true`
- `is_default` (boolean) - Default: `false`

**Response: `201 Created`**
```json
{
  "data": {
    "id": 2,
    "name": "AWS Bedrock Production",
    "provider": "bedrock",
    "api_url": "https://bedrock-runtime.us-east-1.amazonaws.com",
    "api_key_source": "env",
    "api_key_value_hint": "AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY",
    "api_key_status": "loaded",
    "auth_type": "aws_sig_v4",
    "region": "us-east-1",
    "model_refresh_strategy": "manual",
    "connection_timeout": 30000,
    "max_retries": 3,
    "is_active": true,
    "is_default": false,
    "created_at": "2025-11-10T16:30:00.000Z",
    "updated_at": "2025-11-10T16:30:00.000Z",
    "_links": {
      "self": "/api/api-configs/2",
      "models": "/api/api-configs/2/models",
      "test": "/api/api-configs/2/test"
    }
  }
}
```

**Headers:**
```
Location: /api/api-configs/2
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `409 Conflict` - Configuration name already exists

**Special Handling for `api_key_value`:**
- If `api_key_source = 'env'`: Store environment variable name as-is
- If `api_key_source = 'inline'`: Encrypt with AES-256 before storing
- If `api_key_source = 'file'`: Store file path as-is, validate file exists

**Validation:**
- `provider` must be valid enum value
- `auth_type` must match provider (e.g., `aws_sig_v4` requires `provider = 'bedrock'`)
- `region` required if `provider = 'bedrock'`
- `api_url` must be valid HTTPS URL
- If `is_default = true`, unset previous default

---

### 6.4 Update API Configuration

**`PATCH /api/api-configs/:id`**

Update specific fields of an API configuration.

**Path Parameters:**
- `id` (integer, required) - API Config ID

**Request Body (any subset):**
```json
{
  "name": "AWS Bedrock Production (Updated)",
  "is_active": true,
  "is_default": true,
  "connection_timeout": 45000
}
```

**Response: `200 OK`**
```json
{
  "data": {
    "id": 2,
    "name": "AWS Bedrock Production (Updated)",
    "provider": "bedrock",
    "api_url": "https://bedrock-runtime.us-east-1.amazonaws.com",
    "api_key_source": "env",
    "api_key_value_hint": "AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY",
    "api_key_status": "loaded",
    "auth_type": "aws_sig_v4",
    "region": "us-east-1",
    "connection_timeout": 45000,
    "max_retries": 3,
    "is_active": true,
    "is_default": true,
    "created_at": "2025-11-10T16:30:00.000Z",
    "updated_at": "2025-11-10T17:00:00.000Z",
    "_links": {
      "self": "/api/api-configs/2",
      "models": "/api/api-configs/2/models",
      "test": "/api/api-configs/2/test"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - API configuration does not exist
- `409 Conflict` - Name conflict if changing name

**Notes:**
- Changing `api_key_value` with `api_key_source = 'inline'` will re-encrypt
- Setting `is_default = true` will unset previous default

---

### 6.5 Delete API Configuration

**`DELETE /api/api-configs/:id`**

Delete an API configuration.

**Path Parameters:**
- `id` (integer, required) - API Config ID

**Query Parameters:**
- `force` (boolean, optional) - Force delete even if projects are using it
  - Default: `false`

**Response: `200 OK`**
```json
{
  "data": {
    "deleted": true,
    "api_config_id": 2,
    "affected": {
      "projects_updated": 1
    }
  }
}
```

**Alternative: `204 No Content`**

**Error Responses:**
- `404 Not Found` - API configuration does not exist
- `409 Conflict` - Cannot delete: projects are using it (if `force=false`)
- `400 Bad Request` - Cannot delete default configuration

**Behavior:**
- Projects using this config will have `api_config_id` set to NULL (fall back to global default)
- Cannot delete if `is_default = true` (must set another as default first)

---

### 6.6 Test API Configuration

**`POST /api/api-configs/:id/test`**

Test connectivity and authentication for an API configuration.

**Path Parameters:**
- `id` (integer, required) - API Config ID

**Request Body:**
```json
{
  "test_type": "auth"
}
```

**Request Fields:**
- `test_type` (string, optional) - Type of test
  - `"auth"` (default) - Test authentication only
  - `"list_models"` - Test auth and fetch models
  - `"simple_request"` - Send a minimal API request

**Response: `200 OK` (Success)**
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
      "api_version": "2023-06-01",
      "models_available": 5
    },
    "tested_at": "2025-11-10T17:10:00.000Z"
  }
}
```

**Response: `200 OK` (Failure)**
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
      "error_type": "invalid_api_key",
      "error_message": "x-api-key header is invalid"
    },
    "tested_at": "2025-11-10T17:10:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - API configuration does not exist
- `400 Bad Request` - Invalid test_type

**Test Types:**

1. **`auth`** - Quick authentication test
   - For Bearer: Make lightweight API call (e.g., list models)
   - For AWS SigV4: Generate signed request, verify signature
   - Returns: Success/failure, response time

2. **`list_models`** - Fetch available models
   - Calls provider's model list endpoint
   - Returns: List of models discovered
   - Updates `models` field in config if successful

3. **`simple_request`** - End-to-end test
   - Sends minimal message request
   - Returns: Full API response, latency

---

### 6.7 List Models for Configuration

**`GET /api/api-configs/:id/models`**

Get the list of models available for this configuration.

**Path Parameters:**
- `id` (integer, required) - API Config ID

**Response: `200 OK`**
```json
{
  "data": [
    {
      "id": "claude-opus-4-20250514",
      "display_name": "Claude Opus 4",
      "description": "Powerful model for complex tasks",
      "provider_model_id": "claude-opus-4-20250514",
      "context_window": 200000,
      "max_output_tokens": 4096,
      "supports_vision": true,
      "supports_streaming": true
    },
    {
      "id": "claude-sonnet-4-5-20250929",
      "display_name": "Claude Sonnet 4.5",
      "description": "Smart, efficient model for everyday use",
      "provider_model_id": "claude-sonnet-4-5-20250929",
      "context_window": 200000,
      "max_output_tokens": 8192,
      "supports_vision": true,
      "supports_streaming": true
    }
  ],
  "meta": {
    "api_config_id": 1,
    "total": 5,
    "count": 2,
    "last_refreshed": "2025-11-10T12:00:00.000Z",
    "source": "manual",
    "refresh_strategy": "manual"
  }
}
```

**Field Descriptions:**
- `id` - Internal ClaudeUI model ID (used in dropdowns)
- `provider_model_id` - Actual model ID used in API calls
- `source` - How models were obtained:
  - `"manual"` - Manually entered by user
  - `"api"` - Fetched from provider API
  - `"cache"` - Cached from previous fetch

**Error Responses:**
- `404 Not Found` - API configuration does not exist

---

### 6.8 Refresh Models

**`POST /api/api-configs/:id/models/refresh`**

Fetch the latest available models from the provider's API.

**Path Parameters:**
- `id` (integer, required) - API Config ID

**Response: `200 OK`**
```json
{
  "data": {
    "api_config_id": 1,
    "refresh_success": true,
    "models_updated": 5,
    "models_added": 1,
    "models_removed": 0,
    "models_unchanged": 4,
    "new_models": [
      {
        "id": "claude-haiku-4-20250514",
        "display_name": "Claude Haiku 4",
        "provider_model_id": "claude-haiku-4-20250514"
      }
    ],
    "removed_models": [],
    "refreshed_at": "2025-11-10T17:20:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - API configuration does not exist
- `503 Service Unavailable` - Provider API unreachable or returned error
- `422 Unprocessable Entity` - Model refresh not supported for this provider

**Behavior:**
- Only works for providers that have model list APIs
- Updates the `models` field in the configuration
- Does not delete models that disappear (marks as deprecated instead)
- Returns diff of changes

---

### 6.9 Get API Configuration for Project

**`GET /api/projects/:projectId/api-config`**

Get the effective API configuration for a project (project-specific or global default).

**Path Parameters:**
- `projectId` (integer, required) - Project ID

**Response: `200 OK`**
```json
{
  "data": {
    "id": 2,
    "name": "AWS Bedrock Production",
    "provider": "bedrock",
    "api_url": "https://bedrock-runtime.us-east-1.amazonaws.com",
    "api_key_status": "loaded",
    "auth_type": "aws_sig_v4",
    "region": "us-east-1",
    "is_active": true,
    "is_default": false,
    "_links": {
      "self": "/api/api-configs/2",
      "models": "/api/api-configs/2/models"
    },
    "_source": {
      "type": "project_override",
      "project_id": 1,
      "project_name": "ClaudeUI"
    }
  }
}
```

**Response: `200 OK` (Using Global Default)**
```json
{
  "data": {
    "id": 1,
    "name": "Anthropic Direct (Default)",
    "provider": "anthropic",
    "api_url": "https://api.anthropic.com",
    "api_key_status": "loaded",
    "auth_type": "bearer",
    "is_active": true,
    "is_default": true,
    "_links": {
      "self": "/api/api-configs/1",
      "models": "/api/api-configs/1/models"
    },
    "_source": {
      "type": "global_default",
      "reason": "Project has no api_config_id set"
    }
  }
}
```

**Field Descriptions:**
- `_source.type` - How config was resolved:
  - `"project_override"` - Project has specific `api_config_id`
  - `"global_default"` - Falling back to default config
  - `"settings_fallback"` - Using DEFAULT_API_CONFIG_ID from settings

**Error Responses:**
- `404 Not Found` - Project does not exist
- `500 Internal Server Error` - No default API config configured

**Use Case:**
This endpoint is useful for UI to show "which API config will be used" when creating conversations in a project.

---

## API Configuration Security Notes

1. **API Keys Never Exposed**:
   - `api_key_value` is NEVER included in GET responses
   - POST/PATCH requests accept keys but never echo them back
   - Only `api_key_value_hint` is returned (env var name, file path, or masked inline key)

2. **Inline Key Encryption**:
   - Uses AES-256-CBC encryption
   - Requires `API_ENCRYPTION_KEY` environment variable (32 bytes hex)
   - IV (initialization vector) is randomly generated per encryption
   - Stored format: `encrypted:AES256:{iv_hex}:{encrypted_hex}`

3. **Environment Variable Validation**:
   - On startup and on API config load, check if env vars exist
   - Return `api_key_status: "missing"` if not found
   - Never expose value, only availability status

4. **File Path Security**:
   - Validate file exists and is readable
   - Do not allow arbitrary file system access
   - Consider restricting to `/secrets/` directory

5. **AWS Credentials**:
   - For Bedrock, support both:
     - Long-term credentials (Access Key ID + Secret)
     - Temporary credentials (Access Key ID + Secret + Session Token)
     - IAM role credentials (via instance metadata)

---

**Last Updated:** 2025-11-10
