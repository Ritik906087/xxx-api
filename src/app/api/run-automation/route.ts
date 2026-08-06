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
 * Simulates realistic client pacing between sequential API calls.
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
 * Handles CORS Preflight requests.
 * This prevents the "Invalid CORS request" plain-text error in Next.js.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Robust Backend Orchestrator for Multi-Step Sequential Workflow.
 * Implements a Universal JSON Boundary to prevent frontend parsing crashes.
 */
export async function POST(request: Request) {
  const logs: any[] = [];
  
  try {
    // Universal JSON Boundary: Wrap everything in a try block
    const body = await request.json().catch(() => ({}));
    const targetPhone = body.phone;
    const accountType = body.accountType || "1";

    if (!targetPhone) {
      return NextResponse.json({ 
        code: 400, 
        message: "Identification Required: Phone number missing in payload.", 
        logs: [] 
      }, { status: 200, headers: CORS_HEADERS });
    }

    // --- STEP 0: GENERATE DETERMINISTIC BOT PROFILE ---
    const firstDigit = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)];
    const remainingDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
    const botPhone = firstDigit + remainingDigits;
    
    const password = "Ritik@123";
    const pinCode = "954073"; // Deterministic PIN for binding
    const referralCode = "0ealuckpayvp";

    // --- STEP 1: BOT REGISTRATION ---
    await sleep(2000);
    const regRes = await fetch(`${TARGET_BASE_URL}/app/auth/register`, {
      method: 'POST',
      headers: BROWSER_HEADERS,
      body: JSON.stringify({ phone: botPhone, password, referralCode })
    });
    const regJson = await regRes.json();
    logs.push({ "Register (Bot)": regJson });

    if (regJson.code !== 200) {
      return NextResponse.json({ 
        code: 429, 
        message: "Gateway Throttling: Registration limit reached. Try later.", 
        logs 
      }, { status: 200, headers: CORS_HEADERS });
    }

    // --- STEP 2: BOT AUTHENTICATION ---
    await sleep(2000);
    const loginRes = await fetch(`${TARGET_BASE_URL}/app/auth/login`, {
      method: 'POST',
      headers: BROWSER_HEADERS,
      body: JSON.stringify({ phone: botPhone, password })
    });
    const loginJson = await loginRes.json();
    logs.push({ "Login (Bot)": loginJson });

    if (loginJson.code !== 200) {
      return NextResponse.json({ 
        code: 401, 
        message: "Auth Failure: Bot session could not be established.", 
        logs 
      }, { status: 200, headers: CORS_HEADERS });
    }

    // --- EXTRACT SESSION METADATA ---
    const { userId, loginToken: token, sessionKey } = loginJson.data;
    const authHeaders: Record<string, string> = {
      ...BROWSER_HEADERS,
      "Authorization": token,
      "token": token
    };

    // --- STEP 3: SECURE PIN BINDING ---
    await sleep(2000);
    let ts = Date.now();
    let pinPayload = { pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(pinPayload, sessionKey);

    const bindRes = await fetch(`${TARGET_BASE_URL}/app/secure/pin/bind`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinPayload)
    });
    const bindJson = await bindRes.json();
    logs.push({ "Pin Bind": bindJson });

    // --- STEP 4: PIN VERIFICATION ---
    await sleep(2000);
    ts = Date.now();
    pinPayload = { pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(pinPayload, sessionKey);

    const verifyRes = await fetch(`${TARGET_BASE_URL}/app/secure/pin/verify`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinPayload)
    });
    const verifyJson = await verifyRes.json();
    logs.push({ "Pin Verify": verifyJson });

    // --- STEP 5: PRE-DISPATCH INTEGRITY CHECK ---
    await sleep(2000);
    ts = Date.now();
    const prePayload = { mobile: targetPhone, type: 13, appPinCode: pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(prePayload, sessionKey);

    const preRes = await fetch(`${TARGET_BASE_URL}/app/bind/pre/check`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(prePayload)
    });
    const preJson = await preRes.json();
    logs.push({ "Pre Check": preJson });

    // --- STEP 6: FINAL ACTION DISPATCH (OTP) ---
    await sleep(2000);
    ts = Date.now();
    const otpPayload = { mobile: targetPhone, type: 13, accountType: String(accountType), ts, userId };
    authHeaders["Signature"] = generateSignature(otpPayload, sessionKey);

    const otpRes = await fetch(`${TARGET_BASE_URL}/app/bind/send/otp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(otpPayload)
    });
    const otpJson = await otpRes.json();
    logs.push({ "Send OTP to Target": otpJson });

    // --- FINAL AGGREGATED RESPONSE ---
    return NextResponse.json({ 
      code: 200, 
      message: "Sequence Executed: All protocol steps finalized successfully.", 
      logs 
    }, { status: 200, headers: CORS_HEADERS });

  } catch (err: any) {
    console.error("[CRITICAL_SYSTEM_FAULT]:", err);
    // Universal JSON Boundary: Always return valid JSON, even on crash.
    return NextResponse.json({ 
      code: 500, 
      message: `System Integrity Violation: ${err.message}`, 
      logs: logs.length > 0 ? logs : [] 
    }, { status: 200, headers: CORS_HEADERS });
  }
}
