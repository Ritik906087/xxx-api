#!/bin/bash

# Configuration - Update to your actual domain
API_URL="http://localhost:9002/api/run-automation"

TARGET_PHONE="919060873927"
PLATFORM=2 # 2=MobiKwik, 4=Paytm, 1=FreeCharge

echo "================================================"
echo "    VANTAGE SYSTEM: TERMUX MASTER CONTROL       "
echo "================================================"

function send_otp() {
    echo -e "\n[LOG] Triggering OTP Sequence for $TARGET_PHONE..."
    curl -s -X POST "$API_URL" \
         -H "Content-Type: application/json" \
         -d "{\"action\": \"send-otp\", \"phone\": \"$TARGET_PHONE\", \"platform\": $PLATFORM}" | jq .
}

function verify_otp() {
    echo -n -e "\n[INPUT] Enter OTP Code: "
    read OTP_CODE
    
    echo -e "\n[LOG] Verifying Packet: $OTP_CODE..."
    curl -s -X POST "$API_URL" \
         -H "Content-Type: application/json" \
         -d "{\"action\": \"verify-otp\", \"phone\": \"$TARGET_PHONE\", \"platform\": $PLATFORM, \"otp\": \"$OTP_CODE\"}" | jq .
}

# Run the flow
send_otp
echo -e "\nWaiting for SMS... (Press Enter once received)"
read
verify_otp

echo -e "\n================================================"
echo "          PROCESS SEQUENCE TERMINATED           "
echo "================================================"
