import crypto from 'crypto';
import { NextResponse } from 'next/server';

/**
 * Standardized CORS Headers for Cross-Origin compatibility.
 * Prevents environment-level blockades and plain-text origin errors.
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, token, Signature',
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
const BROWSER_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "Content-Type": "application/json;charset=UTF-8",
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
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
 * Reads text first, then attempts to parse JSON.
 */
async function safeFetch(url: string, options: any) {
  const res = await fetch(url, options);
  const rawText = await res.text();
  
  try {
    // Check if body exists and looks like JSON
    if (rawText && (rawText.startsWith('{') || rawText.startsWith('['))) {
      return JSON.parse(rawText);
    }
    return { code: res.status, message: "Non-JSON response received", raw: rawText.substring(0, 200) };
  } catch (e) {
    return { code: 500, message: "JSON Parse Failure", raw: rawText.substring(0, 200) };
  }
}

/**
 * Robust Backend Orchestrator for Multi-Step Sequential Workflow.
 */
export async function POST(request: Request) {
  const logs: any[] = [];
  
  try {
    // Universal JSON Boundary: Use try-catch for all parsing
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
      headers: BROWSER_HEADERS,
      body: JSON.stringify({ phone: botPhone, password, referralCode })
    });
    logs.push({ "Register (Bot)": regJson });

    if (regJson.code !== 200) {
      return NextResponse.json({ code: 429, message: "Gateway Throttling", logs }, { status: 200, headers: CORS_HEADERS });
    }

    // 2. Bot Login
    await sleep(2000);
    const loginJson = await safeFetch(`${TARGET_BASE_URL}/app/auth/login`, {
      method: 'POST',
      headers: BROWSER_HEADERS,
      body: JSON.stringify({ phone: botPhone, password })
    });
    logs.push({ "Login (Bot)": loginJson });

    if (loginJson.code !== 200) {
      return NextResponse.json({ code: 401, message: "Auth Failure", logs }, { status: 200, headers: CORS_HEADERS });
    }

    const { userId, loginToken: token, sessionKey } = loginJson.data;
    const authHeaders: Record<string, string> = {
      ...BROWSER_HEADERS,
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
    logs.push({ "Pin Bind": bindJson });

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
    logs.push({ "Pin Verify": verifyJson });

    // 5. Pre Check
    await sleep(2000);
    ts = Date.now();
    const prePayload = { mobile: targetPhone, type: 13, appPinCode: pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(prePayload, sessionKey);
    const preJson = await safeFetch(`${TARGET_BASE_URL}/app/bind/pre/check`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(prePayload)
    });
    logs.push({ "Pre Check": preJson });

    // 6. OTP Dispatch
    await sleep(2000);
    ts = Date.now();
    const otpPayload = { mobile: targetPhone, type: 13, accountType: String(accountType), ts, userId };
    authHeaders["Signature"] = generateSignature(otpPayload, sessionKey);
    const otpJson = await safeFetch(`${TARGET_BASE_URL}/app/bind/send/otp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(otpPayload)
    });
    logs.push({ "Send OTP to Target": otpJson });

    return NextResponse.json({ 
      code: 200, 
      message: "Sequence Executed successfully.", 
      logs 
    }, { status: 200, headers: CORS_HEADERS });

  } catch (err: any) {
    return NextResponse.json({ 
      code: 500, 
      message: `System Integrity Violation: ${err.message}`, 
      logs: logs 
    }, { status: 200, headers: CORS_HEADERS });
  }
}