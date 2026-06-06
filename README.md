
# Vantage Engine Backend

## API Testing (Termux / CLI)

### 1. Send OTP
```bash
curl -X POST "https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/api/auth/send-otp" \
-H "Content-Type: application/json" \
-d '{"mobileNo": "919060873927"}'
```

### 2. User Registration (MongoDB)
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

## Project Endpoints
- `GET /api/health`: System health check.
- `POST /api/auth/send-otp`: MeraOTP.in integration.
- `POST /api/auth/verify-otp`: Session authorization.
- `POST /api/auth/register`: Save user to MongoDB Atlas.
