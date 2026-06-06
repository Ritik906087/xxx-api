# Vantage Engine Backend Architecture

High-performance API Gateway with Hybrid Logic:
- **Local (New Server)**: Auth (Supabase), Users/Wallet (MongoDB).
- **Proxy (Old Server)**: UPI Linking & Payment Monitoring via `https://apitez.xyz/xxapi/`.

## API Testing (Termux / CLI)

### 1. Test Proxy Connectivity (Talk to Old Server via New Server)
Run this to see if your server is successfully talking to `apitez.xyz` using Stealth Bypass:
```bash
# Test MonitorFlow (Bypass 403)
curl -X POST "https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/api/xxapi/monitorflow/check" \
-H "Content-Type: application/json" \
-d '{"action": "ping"}'

# Test Available Tools (Bypass 403)
curl -G "https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/api/xxapi/availablect" \
--data-urlencode "payment_method=1"
```

### 2. Send OTP (MeraOTP.in)
```bash
curl -X POST "https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/api/auth/send-otp" \
-H "Content-Type: application/json" \
-d '{"mobileNo": "919060873927"}'
```

### 3. Register User (Local MongoDB)
```bash
curl -X POST "https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/api/auth/register" \
-H "Content-Type: application/json" \
-d '{
  "email": "test@vantage.io",
  "mobileNo": "919060873927",
  "fullName": "Ritik Kumar",
  "password": "securepassword123"
}'
```

## Hybrid Endpoints
- `POST /api/xxapi/monitorflow/*` -> Stealth Proxy to `apitez.xyz`
- `GET /api/xxapi/userinfo` -> Local MongoDB User Info
- `POST /api/xxapi/sendsms` -> Local MeraOTP Integration
- `GET /api/xxapi/buyitoken/*` -> Stealth Proxy to `apitez.xyz`
