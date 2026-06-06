# Vantage Engine Backend

## API Testing (Termux / CLI)

Aap Termux ya kisi bhi terminal se OTP test karne ke liye ye command use karein:

```bash
curl -X POST "https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/api/auth/send-otp" \
-H "Content-Type: application/json" \
-d '{"mobileNo": "919060873927"}'
```

### Script se test karein:
1. `chmod +x test-otp.sh`
2. `./test-otp.sh`

## Project Endpoints
- `GET /api/health`: System health check.
- `POST /api/auth/send-otp`: MeraOTP.in ke zariye SMS bhejta hai.
- `POST /api/auth/verify-otp`: OTP verify karke session authorize karta hai.
