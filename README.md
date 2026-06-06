# Vantage Engine Backend Architecture

High-performance API Gateway with Hybrid Logic:
- **Local (New Server)**: Auth (Supabase), Users/Wallet (MongoDB).
- **Proxy (Old Server)**: UPI Linking & Payment Monitoring via `https://apitez.xyz/xxapi/`.
- **URL Rewrites**: Standard and legacy paths (e.g., `/xxapi/login` and `/api/xxapi/login`) are both supported.

## API Testing (Termux / CLI)

### 1. Test Proxy Connectivity (Direct Root Paths)
The server now supports direct root paths via rewrites.

```bash
# Test MonitorFlow (Rewritten to /api/xxapi/monitorflow/check)
curl -X POST "https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/xxapi/monitorflow/check" \
-H "Content-Type: application/json" \
-d '{"action": "ping"}'

# Test Available Tools
curl -G "https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/xxapi/availablect" \
--data-urlencode "payment_method=1"
```

### 2. Send OTP (Root Path)
```bash
curl -X POST "https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/auth/send-otp" \
-H "Content-Type: application/json" \
-d '{"mobileNo": "919060873927"}'
```

### 3. Register User (Local MongoDB)
```bash
curl -X POST "https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/auth/register" \
-H "Content-Type: application/json" \
-d '{
  "email": "test@vantage.io",
  "mobileNo": "919060873927",
  "fullName": "Ritik Kumar",
  "password": "securepassword123"
}'
```

## Hybrid Endpoints
- `POST /xxapi/monitorflow/*` -> Stealth Proxy to `apitez.xyz`
- `GET /xxapi/userinfo` -> Local MongoDB User Info
- `POST /xxapi/sendsms` -> Local MeraOTP Integration
- `GET /xxapi/buyitoken/*` -> Stealth Proxy to `apitez.xyz`
