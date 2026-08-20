#!/bin/bash

# Configuration - Update to your actual domain
API_URL="http://localhost:9002/api/run-automation"

echo "================================================"
echo "    VANTAGE HYBRID ENGINE: MASTER TESTER       "
echo "================================================"

echo "Select Engine:"
echo "1) DTPay (Paytm-9, MobiKwik-2, Freecharge-3, Amazon-1)"
echo "2) Legacy (PhonePe-1, Navi-13, BharatPe-18, SuperMoney-17)"
read -p "Choice: " ENGINE_CHOICE

if [ "$ENGINE_CHOICE" == "1" ]; then
    ENGINE="dtpay"
    echo "Enter Type (9-Paytm, 2-Mobi, 3-FC, 1-Amazon):"
else
    ENGINE="legacy"
    echo "Enter Type (1-PhonePe, 13-Navi, 18-BharatPe, 17-Super):"
fi
read -p "Type: " CTYPE

read -p "Target Phone (10-digits): " PHONE

function send_otp() {
    echo -e "\n[ACTION] Triggering OTP Sequence..."
    RESPONSE=$(curl -s -X POST "$API_URL" \
         -H "Content-Type: application/json" \
         -d "{\"action\": \"send-otp\", \"phone\": \"$PHONE\", \"channelType\": $CTYPE, \"engine\": \"$ENGINE\"}")
    echo $RESPONSE | jq .
    SESSION_ID=$(echo $RESPONSE | jq -r .sessionId)
}

function verify_otp() {
    read -p "Enter OTP Code: " OTP
    echo -e "\n[ACTION] Verifying Code..."
    curl -s -X POST "$API_URL" \
         -H "Content-Type: application/json" \
         -d "{\"action\": \"verify-otp\", \"sessionId\": \"$SESSION_ID\", \"otp\": \"$OTP\"}" | jq .
}

function fetch_history() {
    echo -e "\n[ACTION] Fetching Direct History (DTPay Only)..."
    curl -s -X POST "$API_URL" \
         -H "Content-Type: application/json" \
         -d "{\"action\": \"fetch-by-phone\", \"phone\": \"$PHONE\", \"channelType\": $CTYPE}" | jq .
}

echo -e "\n1) Trigger OTP & Verify"
echo "2) Fetch History (DTPay Only)"
read -p "Action: " ACTION_CHOICE

if [ "$ACTION_CHOICE" == "1" ]; then
    send_otp
    if [ "$SESSION_ID" != "null" ] && [ "$SESSION_ID" != "" ]; then
        verify_otp
    else
        echo "Error: OTP Send failed or returned no session ID."
    fi
else
    fetch_history
fi

echo -e "\n================================================"
echo "          PROCESS SEQUENCE TERMINATED           "
echo "================================================"
