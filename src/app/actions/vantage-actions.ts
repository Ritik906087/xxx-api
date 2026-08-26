'use server';

import crypto from 'crypto';

/**
 * @fileOverview Senior Automation Engine for Vantage Suite.
 * Handles cryptographic signing, multi-step REST orchestration, and advanced stealth spoofing.
 */

const TARGET_BASE_URL = "https://api.rswallet-api.com";

/**
 * Cryptographic Signature Engine (Legacy RSWallet)
 * Matches Python implementation: key1=value1&key2=value2&sessionKey
 */
function generateSignature(data: Record<string, any>, sessionKey: string = "") {
  const sortedKeys = Object.keys(data).sort();
  const queryString = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
  const rawStr = `${queryString}&${sessionKey}`;
  return crypto.createHash('md5').update(rawStr).digest('hex');
}

/**
 * Async Pacing Helper (Throttling)
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * STEALTH HEADERS: Advanced Mobile Browser Fingerprinting.
 * Spoofs a legitimate Android Chrome client to bypass target server CORS and WAF blocks.
 */
function getStealthHeaders(token?: string) {
  const randomIP = `${Math.floor(Math.random() * 220) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  
  const headers: any = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "X-Forwarded-For": randomIP,
    "X-Real-IP": randomIP,
    "Client-IP": randomIP,
  };

  if (token) {
    const cleanToken = token.replace(/['"]+/g, '').trim();
    headers["token"] = cleanToken;
    headers["loginToken"] = cleanToken;
    // Note: Authorization header removed for legacy compatibility if causing 1002
  }

  return headers;
}

/**
 * Multi-Step Sequential Orchestrator
 */
export async function runAutomation(targetPhone: string, accountType: string = "1") {
  const logs: any[] = [];
  
  if (!targetPhone) {
    return { code: 400, message: "Target Identity Required", logs: [] };
  }

  // Generate Deterministic Bot Profile (Fresh every time)
  const botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + 
                   Math.floor(100000000 + Math.random() * 900000000).toString().substring(1);
  const password = "Ritik" + Math.random().toString(36).substring(7) + "@1";
  const pinCode = "954073";
  const referralCode = "0ealuckpayvp";

  try {
    // STEP 1: BOT REGISTRATION
    await sleep(1500);
    const regResp = await fetch(`${TARGET_BASE_URL}/app/auth/register`, {
      method: 'POST',
      headers: getStealthHeaders(),
      body: JSON.stringify({ phone: botPhone, password, referralCode })
    }).then(async r => {
      const text = await r.text();
      try { 
        return JSON.parse(text); 
      } catch (e) { 
        return { code: r.status, message: "Upstream returned non-JSON", raw: text.substring(0, 100) }; 
      }
    });
    logs.push({ "Step 1: Bot Registration": regResp });

    // STEP 2: AUTHENTICATION & TOKEN EXTRACTION
    await sleep(1500);
    const loginResp = await fetch(`${TARGET_BASE_URL}/app/auth/login`, {
      method: 'POST',
      headers: getStealthHeaders(),
      body: JSON.stringify({ phone: botPhone, password })
    }).then(r => r.json()).catch(err => ({ code: 500, message: "Login Parse Error" }));
    logs.push({ "Step 2: Bot Login": loginResp });

    if (loginResp.code !== 200) {
      return { code: 400, message: "Authentication Failed", logs };
    }

    const { userId, loginToken: token, sessionKey } = loginResp.data || {};
    if (!token) {
      return { code: 400, message: "Missing Identity Token", logs };
    }

    // STEP 3: SECURE PIN BINDING
    await sleep(1500);
    let ts = Date.now();
    let pinPayload = { pinCode, ts, userId };
    let authHeaders = getStealthHeaders(token);
    authHeaders["Signature"] = generateSignature(pinPayload, sessionKey);

    const pinBindResp = await fetch(`${TARGET_BASE_URL}/app/secure/pin/bind`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinPayload)
    }).then(r => r.json()).catch(() => ({ message: "PIN Bind Error" }));
    logs.push({ "Step 3: Secure PIN Bind": pinBindResp });

    // STEP 4: PIN VERIFICATION
    await sleep(1500);
    ts = Date.now();
    let verifyPayload = { pinCode, ts, userId };
    authHeaders = getStealthHeaders(token);
    authHeaders["Signature"] = generateSignature(verifyPayload, sessionKey);

    const pinVerifyResp = await fetch(`${TARGET_BASE_URL}/app/secure/pin/verify`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(verifyPayload)
    }).then(r => r.json()).catch(() => ({ message: "PIN Verify Error" }));
    logs.push({ "Step 4: PIN Verification": pinVerifyResp });

    // STEP 5: PRE-DISPATCH INTEGRITY CHECK
    await sleep(1500);
    ts = Date.now();
    const prePayload = { mobile: targetPhone, type: 13, appPinCode: pinCode, ts, userId };
    authHeaders = getStealthHeaders(token);
    authHeaders["Signature"] = generateSignature(prePayload, sessionKey);

    const preResp = await fetch(`${TARGET_BASE_URL}/app/bind/pre/check`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(prePayload)
    }).then(r => r.json()).catch(() => ({ message: "Pre-Check Error" }));
    logs.push({ "Step 5: Pre-Check Integrity": preResp });

    // STEP 6: FINAL OTP DISPATCH
    await sleep(1500);
    ts = Date.now();
    const otpPayload = { mobile: targetPhone, type: 13, accountType: String(accountType), ts, userId };
    authHeaders = getStealthHeaders(token);
    authHeaders["Signature"] = generateSignature(otpPayload, sessionKey);

    const otpResp = await fetch(`${TARGET_BASE_URL}/app/bind/send/otp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(otpPayload)
    }).then(r => r.json()).catch(() => ({ message: "OTP Dispatch Error" }));
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
