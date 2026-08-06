
'use server';

import crypto from 'crypto';

const TARGET_BASE_URL = "https://api.rswallet-api.com";

function generateSignature(data: Record<string, any>, sessionKey: string = "") {
  const sortedKeys = Object.keys(data).sort();
  let rawStr = "";
  for (const key of sortedKeys) {
    rawStr += `${key}${data[key]}`;
  }
  rawStr += sessionKey;
  return crypto.createHash('md5').update(rawStr).digest('hex');
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function runAutomation(targetPhone: string, accountType: string = "1") {
  const logs: any[] = [];
  
  if (!targetPhone) {
    return { code: 400, message: "Phone number is required", logs: [] };
  }

  // Generate Bot Phone
  const firstDigit = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)];
  const remainingDigits = Math.floor(100000000 + Math.random() * 900000000).toString().substring(1);
  const botPhone = firstDigit + remainingDigits;

  const password = "Ritik@123";
  const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
  const referralCode = "0ealuckpayvp";

  const baseHeaders = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  };

  try {
    await sleep(2000);

    // 1. Register Bot
    const regResp = await fetch(`${TARGET_BASE_URL}/app/auth/register`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        phone: botPhone,
        password: password,
        referralCode: referralCode,
      })
    }).then(r => r.json());
    logs.push({ "Register (Bot)": regResp });

    if (regResp.code !== 200) {
      return { code: 400, message: "Rate limit hit or Registration failed", logs };
    }

    await sleep(2000);

    // 2. Login Bot
    const loginResp = await fetch(`${TARGET_BASE_URL}/app/auth/login`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({ phone: botPhone, password: password })
    }).then(r => r.json());
    logs.push({ "Login (Bot)": loginResp });

    if (loginResp.code !== 200) {
      return { code: 400, message: "Login failed", logs };
    }

    const loginData = loginResp.data || {};
    const userId = loginData.userId;
    const token = loginData.loginToken;
    const sessionKey = loginData.sessionKey || "";

    const authHeaders: any = { 
      ...baseHeaders,
      "Authorization": token,
      "token": token
    };

    await sleep(2000);

    // 3. Pin Bind
    let ts = Date.now();
    const pinPayload = { pinCode: pinCode, ts: ts, userId: userId };
    authHeaders["Signature"] = generateSignature(pinPayload, sessionKey);

    const pinBindResp = await fetch(`${TARGET_BASE_URL}/app/secure/pin/bind`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinPayload)
    }).then(r => r.json());
    logs.push({ "Pin Bind": pinBindResp });

    await sleep(2000);

    // 4. Pin Verify
    ts = Date.now();
    const pinVerifyPayload = { pinCode: pinCode, ts: ts, userId: userId };
    authHeaders["Signature"] = generateSignature(pinVerifyPayload, sessionKey);

    const pinVerifyResp = await fetch(`${TARGET_BASE_URL}/app/secure/pin/verify`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinVerifyPayload)
    }).then(r => r.json());
    logs.push({ "Pin Verify": pinVerifyResp });

    await sleep(2000);

    // 5. Pre Check
    ts = Date.now();
    const prePayload = {
      mobile: targetPhone,
      type: 13,
      appPinCode: pinCode,
      ts: ts,
      userId: userId,
    };
    authHeaders["Signature"] = generateSignature(prePayload, sessionKey);

    const preResp = await fetch(`${TARGET_BASE_URL}/app/bind/pre/check`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(prePayload)
    }).then(r => r.json());
    logs.push({ "Pre Check": preResp });

    await sleep(2000);

    // 6. Send OTP to Target
    ts = Date.now();
    const otpPayload = {
      mobile: targetPhone,
      type: 13,
      accountType: accountType,
      ts: ts,
      userId: userId,
    };
    authHeaders["Signature"] = generateSignature(otpPayload, sessionKey);

    const otpResp = await fetch(`${TARGET_BASE_URL}/app/bind/send/otp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(otpPayload)
    }).then(r => r.json());
    logs.push({ "Send OTP to Target": otpResp });

    return {
      code: 200,
      message: "Automation executed successfully",
      logs: logs,
    };

  } catch (error: any) {
    return { code: 500, message: error.message, logs };
  }
}
