# Product Requirement Prompt - Azure CI/CD Pipeline

> **💡 Template Usage**: This is a complete example of an infrastructure/DevOps PRP demonstrating GitHub Actions with Azure deployment for .NET 9 applications. Customize sections marked with 💡 to match your environment.

---

## Executive Summary

| Field | Value |
|-------|-------|
| **Infrastructure Name** | 💡 Azure CI/CD Pipeline for .NET 9 Application |
| **Infrastructure Type** | Continuous Integration & Deployment |
| **Complexity** | Medium |
| **Estimated Effort** | 24 hours (3 days) |
| **Technology Stack** | GitHub Actions, Azure App Service, Azure SQL, Docker, Azure Key Vault |
| **Cloud Platform** | Microsoft Azure |
| **Business Value** | Automated, reliable deployments with zero downtime |

**Infrastructure Overview**: Complete CI/CD pipeline using GitHub Actions for automated build, test, security scanning, and deployment to Azure App Service. Includes environment-specific configurations, secret management, and automated rollback capabilities.

---

## Current State Analysis

### Existing Infrastructure
💡 **Discovered via review of current deployment process**:

- **Manual Deployments**: Developers manually publish to Azure via Visual Studio
- **Azure App Service**: Existing `myapp-prod` App Service (Windows, .NET 9)
- **Azure SQL Database**: `myapp-db` database in `myapp-sql-server`
- **No Automated Testing**: Tests run locally before manual deployment
- **No Security Scanning**: Manual code review only

### Dependencies
- **GitHub Repository**: Source code hosted on GitHub
- **Azure Subscription**: Active subscription with proper permissions
- **Azure Key Vault**: For storing secrets and connection strings
- **Docker Hub**: For container image storage (optional)

### Gaps (What Needs to Be Built)
- GitHub Actions workflows (`.github/workflows/ci-cd.yml`)
- Azure infrastructure as code (Bicep or ARM templates)
- Environment-specific configuration files
- Automated test execution in pipeline
- Security scanning (CodeQL, dependency scanning)
- Deployment slots for blue-green deployment
- Automated database migration execution
- Monitoring and alerting configuration
- Rollback automation

---

## Functional Requirements

### FR-1: Automated Build Pipeline
**Priority**: Must-have

**Description**: Automated build pipeline triggered on every push to `main` and pull requests, compiling code, running tests, and generating artifacts.

**Acceptance Criteria**:
- [ ] Pipeline triggers on push to `main` branch
- [ ] Pipeline triggers on pull request creation/update
- [ ] Restores NuGet packages: `dotnet restore`
- [ ] Builds solution: `dotnet build --configuration Release --no-restore`
- [ ] Runs unit tests: `dotnet test --no-build --verbosity normal --collect:"XPlat Code Coverage"`
- [ ] Generates code coverage report (≥90% required to pass)
- [ ] Publishes build artifacts to GitHub Actions artifacts storage
- [ ] Build completes in <5 minutes
- [ ] Sends notification to Slack on failure

**Pipeline Structure**:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0.x'
      - name: Restore dependencies
        run: dotnet restore
      - name: Build
        run: dotnet build --configuration Release --no-restore
      - name: Test
        run: dotnet test --no-build --verbosity normal --collect:"XPlat Code Coverage"
      - name: Code Coverage Check
        run: |
          dotnet tool install -g dotnet-reportgenerator-globaltool
          reportgenerator -reports:**/coverage.cobertura.xml -targetdir:coverage -reporttypes:Html;TextSummary
          COVERAGE=$(grep -oP 'Line coverage: \K[0-9.]+' coverage/Summary.txt)
          if (( $(echo "$COVERAGE < 90" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 90% threshold"
            exit 1
          fi
```

### FR-2: Security Scanning
**Priority**: Must-have

**Description**: Automated security scanning for code vulnerabilities and dependency issues before deployment.

**Acceptance Criteria**:
- [ ] CodeQL analysis runs on every push to `main`
- [ ] Scans for: SQL injection, XSS, insecure deserialization, hardcoded secrets
- [ ] Dependency scanning checks NuGet packages for known vulnerabilities
- [ ] Critical vulnerabilities block deployment
- [ ] Security report uploaded to GitHub Security tab
- [ ] Trivy scans Docker images (if using containers)

### FR-3: Automated Deployment to Azure
**Priority**: Must-have

**Description**: Blue-green deployment to Azure App Service with automated database migrations and health checks.

**Acceptance Criteria**:
- [ ] Deploys to staging slot first: `myapp-staging`
- [ ] Runs database migrations on staging database: `dotnet ef database update`
- [ ] Executes smoke tests against staging environment
- [ ] Performs health check: `GET /health` returns 200 OK
- [ ] Swaps staging to production slot if all checks pass
- [ ] Keeps previous production in staging slot for instant rollback
- [ ] Deployment completes in <10 minutes
- [ ] Zero downtime during swap
- [ ] Automatically rolls back if health check fails after swap

---

## Technical Design

### GitHub Actions Workflow
**Location**: `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  AZURE_WEBAPP_NAME: myapp-prod
  DOTNET_VERSION: '9.0.x'
  AZURE_WEBAPP_PACKAGE_PATH: './publish'

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --configuration Release --no-restore

      - name: Run unit tests
        run: dotnet test --no-build --verbosity normal --collect:"XPlat Code Coverage" --logger "trx;LogFileName=test-results.trx"

      - name: Publish test results
        uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Test Results
          path: '**/test-results.trx'
          reporter: dotnet-trx

      - name: Publish application
        run: dotnet publish -c Release -o ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: webapp
          path: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}

  security-scan:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: csharp

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        if: github.event_name == 'pull_request'

  deploy-staging:
    needs: [build-and-test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://myapp-staging.azurewebsites.net
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: webapp
          path: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}

      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to staging slot
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          slot-name: staging
          package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}

      - name: Run database migrations
        run: |
          az webapp config connection-string list --name ${{ env.AZURE_WEBAPP_NAME }} --slot staging --resource-group myapp-rg
          # Run EF migrations here

      - name: Health check staging
        run: |
          for i in {1..10}; do
            STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" https://myapp-staging.azurewebsites.net/health)
            if [ $STATUS -eq 200 ]; then
              echo "Health check passed"
              exit 0
            fi
            echo "Health check failed, attempt $i/10"
            sleep 10
          done
          echo "Health check failed after 10 attempts"
          exit 1

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://myapp.azurewebsites.net
    steps:
      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Swap staging to production
        run: |
          az webapp deployment slot swap \
            --name ${{ env.AZURE_WEBAPP_NAME }} \
            --resource-group myapp-rg \
            --slot staging \
            --target-slot production

      - name: Health check production
        run: |
          sleep 30  # Wait for slot swap to complete
          STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" https://myapp.azurewebsites.net/health)
          if [ $STATUS -ne 200 ]; then
            echo "Production health check failed, rolling back"
            az webapp deployment slot swap \
              --name ${{ env.AZURE_WEBAPP_NAME }} \
              --resource-group myapp-rg \
              --slot production \
              --target-slot staging
            exit 1
          fi
          echo "Production deployment successful"

      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production: ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Non-Functional Requirements

### NFR-1: Reliability
- [ ] Pipeline success rate ≥ 95%
- [ ] Automated rollback if production health check fails
- [ ] Deployment slots ensure zero downtime
- [ ] Database migration rollback script available
- [ ] Failed builds do not deploy

### NFR-2: Security
- [ ] Secrets stored in Azure Key Vault, referenced via GitHub secrets
- [ ] No hardcoded credentials in workflows or code
- [ ] Azure RBAC: GitHub Actions service principal has minimum required permissions (Contributor on App Service)
- [ ] CodeQL scans block deployment if critical vulnerabilities found
- [ ] All connections use HTTPS/TLS 1.2+

### NFR-3: Performance
- [ ] Build + test completes in <5 minutes
- [ ] Deployment to staging completes in <5 minutes
- [ ] Slot swap completes in <2 minutes
- [ ] Total pipeline execution <15 minutes

### NFR-4: Observability
- [ ] All pipeline steps logged to GitHub Actions
- [ ] Application Insights configured for runtime monitoring
- [ ] Azure Monitor alerts on deployment failures
- [ ] Build/deployment metrics tracked: Success rate, duration, failure reasons
- [ ] Slack notifications on pipeline failures

---

## Configuration Management

### GitHub Secrets (Required)
```yaml
AZURE_CREDENTIALS: '{"clientId":"xxx","clientSecret":"xxx","subscriptionId":"xxx","tenantId":"xxx"}'
AZURE_SQL_CONNECTION_STRING: 'Server=tcp:myapp-sql-server.database.windows.net;Database=myapp-db;...'
SLACK_WEBHOOK: 'https://hooks.slack.com/services/xxx/yyy/zzz'
```

### Azure App Service Configuration
**Application Settings**:
```json
{
  "ASPNETCORE_ENVIRONMENT": "Production",
  "ApplicationInsights__InstrumentationKey": "{{FROM_KEY_VAULT}}",
  "JwtSettings__Secret": "@Microsoft.KeyVault(SecretUri=https://myapp-kv.vault.azure.net/secrets/JwtSecret)"
}
```

**Connection Strings**:
```json
{
  "DefaultConnection": {
    "value": "@Microsoft.KeyVault(SecretUri=https://myapp-kv.vault.azure.net/secrets/SqlConnectionString)",
    "type": "SQLAzure"
  }
}
```

---

## Test Requirements

### Smoke Tests
```bash
#!/bin/bash
# smoke-tests.sh

# Health check
curl -f https://myapp-staging.azurewebsites.net/health || exit 1

# API availability
curl -f https://myapp-staging.azurewebsites.net/api/products?page=1&pageSize=1 || exit 1

# Authentication endpoint
curl -X POST https://myapp-staging.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}' | grep -q "accessToken" || exit 1

echo "All smoke tests passed"
```

---

## Quality Gates

### Entry Gate ✅
- [x] GitHub repository configured
- [x] Azure subscription and resources provisioned
- [x] Secrets configured in GitHub and Azure Key Vault
- [x] Deployment slots created (staging, production)

### Implementation Gate
- [ ] Build pipeline executes successfully
- [ ] All tests pass (≥90% coverage)
- [ ] Security scans pass (no critical vulnerabilities)
- [ ] Deployment to staging succeeds
- [ ] Smoke tests pass on staging
- [ ] Slot swap completes without errors

### Exit Gate
- [ ] Production health check passes post-deployment
- [ ] Application Insights shows no errors in first 5 minutes
- [ ] Rollback tested and functional
- [ ] Documentation complete (runbook)
- [ ] Monitoring alerts configured

---

## Agent Delegation Strategy

### Phase 1: Infrastructure Design
**Agent**: `azure-architect` (Phoenix)
**Responsibility**: Design Azure infrastructure and deployment architecture
**Deliverable**: Infrastructure diagram and resource requirements

### Phase 2: Pipeline Implementation
**Agent**: `devops-engineer` (Morgan)
**Responsibility**: Implement GitHub Actions workflows
**Deliverable**: `.github/workflows/ci-cd.yml` with all stages

### Phase 3: Security Configuration
**Agent**: `security-specialist` (Alex)
**Responsibility**: Configure security scanning and secret management
**Deliverable**: CodeQL configuration and Azure Key Vault setup

### Phase 4: Testing & Validation
**Agent**: `qa-engineer` (Parker)
**Responsibility**: Create smoke tests and validate deployment process
**Deliverable**: Smoke test scripts and validation report

### Phase 5: Documentation
**Agent**: `technical-writer` (Sage)
**Responsibility**: Create deployment runbook and troubleshooting guide
**Deliverable**: Runbook documentation

---

## Disaster Recovery

### Rollback Procedure
1. **Automatic Rollback**: Pipeline automatically swaps slots back if health check fails
2. **Manual Rollback**:
   ```bash
   az webapp deployment slot swap \
     --name myapp-prod \
     --resource-group myapp-rg \
     --slot production \
     --target-slot staging
   ```
3. **Database Rollback**: Execute saved rollback migration script

### Backup Strategy
- **Application**: Previous version retained in staging slot
- **Database**: Automated backups every 6 hours, 7-day retention
- **Configuration**: GitHub repository version controlled

---

## 💡 Customization Checklist

- [ ] Replace `myapp-prod` with your Azure App Service name
- [ ] Update Azure resource group name (`myapp-rg`)
- [ ] Configure GitHub repository secrets
- [ ] Set up Azure Key Vault and add secrets
- [ ] Modify Slack webhook URL for notifications
- [ ] Adjust code coverage threshold (currently 90%)
- [ ] Update smoke test endpoints for your application
- [ ] Configure Application Insights instrumentation key
- [ ] Set up Azure Monitor alerts
- [ ] Customize deployment slots if needed

---

*This template demonstrates Azure DevOps best practices with GitHub Actions, including blue-green deployment, automated testing, security scanning, and zero-downtime deployments for .NET 9 applications.*
