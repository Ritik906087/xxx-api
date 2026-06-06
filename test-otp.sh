#!/bin/bash

# Configuration
API_URL="https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/api/auth/send-otp"
MOBILE="919060873927"

echo "-----------------------------------------------"
echo "Vantage Engine: Testing OTP Send for $MOBILE"
echo "Target URL: $API_URL"
echo "-----------------------------------------------"

curl -X POST "$API_URL" \
     -H "Content-Type: application/json" \
     -d "{\"mobileNo\": \"$MOBILE\"}"

echo -e "\n\n-----------------------------------------------"
echo "Request Sent. Check your mobile for SMS."
echo "-----------------------------------------------"
