'use server';

import crypto from 'crypto';

/**
 * @fileOverview Senior Automation Engine for Vantage Suite.
 * Handles cryptographic signing, multi-step REST orchestration, and anti-bot mitigation.
 */

const TARGET_BASE_URL = "https://api.rswallet-api.com";

/**
 * Cryptographic Signature Engine
 * Generates an MD5 signature based on alphabetical sorting of keys.
 */
function generateSignature(data: Record<string, any>, sessionKey: string = "") {
  const sortedKeys = Object.keys(data).sort();
  let rawStr = "";
  for (const key of sortedKeys) {
    rawStr += `${key}${data[key]}`;
  }
  rawStr += sessionKey;
  return crypto.createHash('md5').update(rawStr).digest('hex');
}

/**
 * Async Pacing Helper (Throttling)
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * STEALTH HEADERS: Impersonating the official client to bypass Target Server CORS checks.
 */
const STEALTH_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "Content-Type": "application/json;charset=UTF-8",
  "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Origin": "https://api.rswallet-api.com",
  "Referer": "https://api.rswallet-api.com/"
};

/**
 * Multi-Step Sequential Orchestrator
 */
export async function runAutomation(targetPhone: string, accountType: string = "1") {
  const logs: any[] = [];
  
  if (!targetPhone) {
    return { code: 400, message: "Target Identity Required", logs: [] };
  }

  // Generate Deterministic Bot Profile
  const botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + 
                   Math.floor(100000000 + Math.random() * 900000000).toString().substring(1);
  const password = "Ritik@123";
  const pinCode = "954073";
  const referralCode = "0ealuckpayvp";

  try {
    // STEP 1: BOT REGISTRATION
    await sleep(2000);
    const regResp = await fetch(`${TARGET_BASE_URL}/app/auth/register`, {
      method: 'POST',
      headers: STEALTH_HEADERS,
      body: JSON.stringify({ phone: botPhone, password: password, referralCode: referralCode })
    }).then(async r => {
      const text = await r.text();
      try { return JSON.parse(text); } catch (e) { return { code: r.status, message: "Non-JSON response", raw: text.substring(0, 100) }; }
    });
    logs.push({ "Step 1: Bot Registration": regResp });

    if (regResp.code !== 200) {
      return { code: 429, message: regResp.message || "Gateway Rate Limit or Registration Error", logs };
    }

    // STEP 2: AUTHENTICATION & TOKEN EXTRACTION
    await sleep(2000);
    const loginResp = await fetch(`${TARGET_BASE_URL}/app/auth/login`, {
      method: 'POST',
      headers: STEALTH_HEADERS,
      body: JSON.stringify({ phone: botPhone, password: password })
    }).then(r => r.json());
    logs.push({ "Step 2: Bot Login": loginResp });

    if (loginResp.code !== 200) {
      return { code: 401, message: "Authentication Failed", logs };
    }

    const { userId, loginToken: token, sessionKey } = loginResp.data;
    const authHeaders: any = { ...STEALTH_HEADERS, "Authorization": token, "token": token };

    // STEP 3: SECURE PIN BINDING
    await sleep(2000);
    let ts = Date.now();
    let pinPayload = { pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(pinPayload, sessionKey);

    const pinBindResp = await fetch(`${TARGET_BASE_URL}/app/secure/pin/bind`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinPayload)
    }).then(r => r.json());
    logs.push({ "Step 3: Secure PIN Bind": pinBindResp });

    // STEP 4: PIN VERIFICATION
    await sleep(2000);
    ts = Date.now();
    pinPayload = { pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(pinPayload, sessionKey);

    const pinVerifyResp = await fetch(`${TARGET_BASE_URL}/app/secure/pin/verify`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinPayload)
    }).then(r => r.json());
    logs.push({ "Step 4: PIN Verification": pinVerifyResp });

    // STEP 5: PRE-DISPATCH INTEGRITY CHECK
    await sleep(2000);
    ts = Date.now();
    const prePayload = { mobile: targetPhone, type: 13, appPinCode: pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(prePayload, sessionKey);

    const preResp = await fetch(`${TARGET_BASE_URL}/app/bind/pre/check`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(prePayload)
    }).then(r => r.json());
    logs.push({ "Step 5: Pre-Check Integrity": preResp });

    // STEP 6: FINAL OTP DISPATCH
    await sleep(2000);
    ts = Date.now();
    const otpPayload = { mobile: targetPhone, type: 13, accountType: String(accountType), ts, userId };
    authHeaders["Signature"] = generateSignature(otpPayload, sessionKey);

    const otpResp = await fetch(`${TARGET_BASE_URL}/app/bind/send/otp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(otpPayload)
    }).then(r => r.json());
    logs.push({ "Step 6: OTP Action Dispatch": otpResp });

    return {
      code: 200,
      message: "Automation sequence completed successfully",
      logs: logs,
    };

  } catch (error: any) {
    return { code: 500, message: `Orchestration Fault: ${error.message}`, logs };
  }
}
