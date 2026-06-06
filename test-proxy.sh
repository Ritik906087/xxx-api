#!/bin/bash

# Configuration
API_BASE="https://9000-firebase-studio-1780714231649.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev/api/xxapi"

echo "-----------------------------------------------"
echo "Vantage Engine: Testing Proxy to Old Server"
echo "Target Base: $API_BASE"
echo "-----------------------------------------------"

echo -e "\n[1] Testing MonitorFlow Proxy (UPI Linking)..."
curl -s -X POST "$API_BASE/monitorflow/check" \
     -H "Content-Type: application/json" \
     -d '{"action": "ping"}' | jq . || curl -s -X POST "$API_BASE/monitorflow/check" -H "Content-Type: application/json" -d '{"action": "ping"}'

echo -e "\n\n[2] Testing Available Collection Tools Proxy..."
curl -s -G "$API_BASE/availablect" --data-urlencode "payment_method=1" | jq . || curl -s -G "$API_BASE/availablect" --data-urlencode "payment_method=1"

echo -e "\n\n[3] Testing Buy Flow (Payment) Proxy..."
curl -s "$API_BASE/buyitoken/check" | jq . || curl -s "$API_BASE/buyitoken/check"

echo -e "\n\n-----------------------------------------------"
echo "Test Complete. If you see JSON from apitez.xyz, proxy is working!"
echo "-----------------------------------------------"
