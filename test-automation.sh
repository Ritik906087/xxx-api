#!/bin/bash

# Configuration
API_URL="http://localhost:9002/api/run-automation"
# If testing on live deployment, change to your domain:
# API_URL="https://your-domain.com/api/run-automation"

TARGET_PHONE="919060873927"
MASTER_ID="7870873927"
PLATFORM=2 # 2=MobiKwik, 4=Paytm, 3=PhonePe, 1=FreeCharge

echo "------------------------------------------------"
echo "VANTAGE ENGINE: Termux Automation Controller"
echo "------------------------------------------------"

function send_otp() {
    echo -e "\n[ACTION] Dispatching OTP to $TARGET_PHONE via Platform $PLATFORM..."
    curl -s -X POST "$API_URL" \
         -H "Content-Type: application/json" \
         -d "{
               \"action\": \"send-otp\",
               \"phone\": \"$TARGET_PHONE\",
               \"platform\": $PLATFORM,
               \"masterPhone\": \"$MASTER_ID\"
             }" | jq .
}

function verify_otp() {
    echo -n -e "\n[INPUT] Enter the 6-digit OTP received on $TARGET_PHONE: "
    read OTP_CODE
    
    echo -e "\n[ACTION] Verifying OTP: $OTP_CODE..."
    curl -s -X POST "$API_URL" \
         -H "Content-Type: application/json" \
         -d "{
               \"action\": \"verify-otp\",
               \"phone\": \"$TARGET_PHONE\",
               \"platform\": $PLATFORM,
               \"otp\": \"$OTP_CODE\",
               \"masterPhone\": \"$MASTER_ID\"
             }" | jq .
}

# Execution
send_otp
echo -e "\nWait for SMS... then proceed to verification."
verify_otp

echo -e "\n------------------------------------------------"
echo "Sequence Finished."
echo "------------------------------------------------"
