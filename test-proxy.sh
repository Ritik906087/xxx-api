#!/bin/bash

# Configuration
API_BASE="https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/api/xxapi"

echo "-----------------------------------------------"
echo "Vantage Engine: Testing Stealth Proxy Bypass"
echo "Target Base: $API_BASE"
echo "-----------------------------------------------"

echo -e "\n[1] Testing MonitorFlow Stealth Proxy..."
curl -s -X POST "$API_BASE/monitorflow/check" \
     -H "Content-Type: application/json" \
     -d '{"action": "ping"}' | jq . || curl -s -X POST "$API_BASE/monitorflow/check" -H "Content-Type: application/json" -d '{"action": "ping"}"

echo -e "\n\n[2] Testing AvailableCT Stealth Proxy..."
curl -s -G "$API_BASE/availablect" --data-urlencode "payment_method=1" | jq . || curl -s -G "$API_BASE/availablect" --data-urlencode "payment_method=1"

echo -e "\n\n[3] Testing Buy Flow Stealth Proxy..."
curl -s "$API_BASE/buyitoken/check" | jq . || curl -s "$API_BASE/buyitoken/check"

echo -e "\n\n-----------------------------------------------"
echo "Test Complete. Response should bypass 403."
echo "-----------------------------------------------"
