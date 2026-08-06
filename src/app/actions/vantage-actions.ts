
'use server';

import crypto from 'crypto';

/**
 * @fileOverview Core Automation Engine for Vantage Suite.
 * Handles cryptographic signing, bot lifecycle management, and secure API orchestration.
 */

const TARGET_BASE_URL = "https://api.rswallet-api.com";

/**
 * Generates an MD5 signature based on alphabetical sorting of keys.
 * Matches the exact cryptographic pattern required by the target gateway.
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
 * Throttling helper to mitigate rate-limiting and mimic human behavior.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Realistic browser headers to bypass basic anti-bot detection.
 */
const SECURE_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "Content-Type": "application/json;charset=UTF-8",
  "User-Agent": "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": "https://api.rswallet-api.com",
  "Referer": "https://api.rswallet-api.com/",
  "Connection": "keep-alive"
};

/**
 * Main Automation Workflow: Executes a multi-step sequence to trigger target OTP.
 */
export async function runAutomation(targetPhone: string, accountType: string = "1") {
  const logs: any[] = [];
  
  if (!targetPhone) {
    return { code: 400, message: "Target Identity Required", logs: [] };
  }

  // Generate Deterministic Bot Profile
  const firstDigit = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)];
  const remainingDigits = Math.floor(100000000 + Math.random() * 900000000).toString().substring(1);
  const botPhone = firstDigit + remainingDigits;
  const password = "Ritik@123";
  const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
  const referralCode = "0ealuckpayvp";

  try {
    // STEP 1: BOT REGISTRATION
    await sleep(2000 + Math.random() * 1000);
    const regResp = await fetch(`${TARGET_BASE_URL}/app/auth/register`, {
      method: 'POST',
      headers: SECURE_HEADERS,
      body: JSON.stringify({
        phone: botPhone,
        password: password,
        referralCode: referralCode,
      })
    }).then(r => r.json());
    logs.push({ "REGISTRATION_BOT": regResp });

    if (regResp.code !== 200) {
      return { code: 429, message: "Gateway Rate Limit Detected (Bot Registration)", logs };
    }

    // STEP 2: BOT AUTHORIZATION (SESSION ESTABLISHMENT)
    await sleep(2000 + Math.random() * 1000);
    const loginResp = await fetch(`${TARGET_BASE_URL}/app/auth/login`, {
      method: 'POST',
      headers: SECURE_HEADERS,
      body: JSON.stringify({ phone: botPhone, password: password })
    }).then(r => r.json());
    logs.push({ "AUTHORIZATION_BOT": loginResp });

    if (loginResp.code !== 200) {
      return { code: 401, message: "Session Establishment Failed", logs };
    }

    const loginData = loginResp.data || {};
    const userId = loginData.userId;
    const token = loginData.loginToken;
    const sessionKey = loginData.sessionKey || "";

    const authHeaders: any = { 
      ...SECURE_HEADERS,
      "Authorization": token,
      "token": token
    };

    // STEP 3: SECURE PIN BINDING
    await sleep(2000);
    let ts = Date.now();
    const pinPayload = { pinCode: pinCode, ts: ts, userId: userId };
    authHeaders["Signature"] = generate_signature(pinPayload, sessionKey);

    const pinBindResp = await fetch(`${TARGET_BASE_URL}/app/secure/pin/bind`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinPayload)
    }).then(r => r.json());
    logs.push({ "PIN_BIND_HANDSHAKE": pinBindResp });

    // STEP 4: PIN VERIFICATION
    await sleep(2000);
    ts = Date.now();
    const pinVerifyPayload = { pinCode: pinCode, ts: ts, userId: userId };
    authHeaders["Signature"] = generate_signature(pinVerifyPayload, sessionKey);

    const pinVerifyResp = await fetch(`${TARGET_BASE_URL}/app/secure/pin/verify`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinVerifyPayload)
    }).then(r => r.json());
    logs.push({ "PIN_VERIFICATION": pinVerifyResp });

    // STEP 5: PRE-BINDING INTEGRITY CHECK
    await sleep(2000);
    ts = Date.now();
    const prePayload = {
      mobile: targetPhone,
      type: 13,
      appPinCode: pinCode,
      ts: ts,
      userId: userId,
    };
    authHeaders["Signature"] = generate_signature(prePayload, sessionKey);

    const preResp = await fetch(`${TARGET_BASE_URL}/app/bind/pre/check`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(prePayload)
    }).then(r => r.json());
    logs.push({ "INTEGRITY_PRE_CHECK": preResp });

    // STEP 6: DISPATCH OTP TO TARGET
    await sleep(2000);
    ts = Date.now();
    const otpPayload = {
      mobile: targetPhone,
      type: 13,
      accountType: accountType,
      ts: ts,
      userId: userId,
    };
    authHeaders["Signature"] = generate_signature(otpPayload, sessionKey);

    const otpResp = await fetch(`${TARGET_BASE_URL}/app/bind/send/otp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(otpPayload)
    }).then(r => r.json());
    logs.push({ "OTP_DISPATCH": otpResp });

    return {
      code: 200,
      message: "Automation Sequence Completed Successfully",
      logs: logs,
    };

  } catch (error: any) {
    return { code: 500, message: `System Fault: ${error.message}`, logs };
  }
}
