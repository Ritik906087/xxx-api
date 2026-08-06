import crypto from 'crypto';
import { NextResponse } from 'next/server';

/**
 * Helper to generate MD5 signature based on alphabetical sorting of keys.
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
 * Next.js API Route for Automation Orchestration.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const targetPhone = body.phone;
    const accountType = body.accountType || "1";

    if (!targetPhone) {
      return NextResponse.json({ code: 400, message: "Phone number is required", logs: [] });
    }

    // Generate Bot Identity
    const firstDigit = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)];
    const remainingDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
    const botPhone = firstDigit + remainingDigits;

    const password = "Ritik@123";
    const pinCode = "954073";
    const referralCode = "0ealuckpayvp";
    const targetBaseUrl = "https://api.rswallet-api.com";

    const baseHeaders = {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json;charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    };

    const logs: any[] = [];

    // 1. Register Bot
    const regRes = await fetch(`${targetBaseUrl}/app/auth/register`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({ phone: botPhone, password, referralCode })
    });
    const regJson = await regRes.json();
    logs.push({ "Register (Bot)": regJson });

    if (regJson.code !== 200) {
      return NextResponse.json({ code: 400, message: "Rate limit hit", logs });
    }

    await new Promise(res => setTimeout(res, 1000));

    // 2. Login Bot
    const loginRes = await fetch(`${targetBaseUrl}/app/auth/login`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({ phone: botPhone, password })
    });
    const loginJson = await loginRes.json();
    logs.push({ "Login (Bot)": loginJson });

    if (loginJson.code !== 200) {
      return NextResponse.json({ code: 400, message: "Login failed", logs });
    }

    const userId = loginJson.data.userId;
    const token = loginJson.data.loginToken;
    const sessionKey = loginJson.data.sessionKey || "";

    const authHeaders: Record<string, string> = {
      ...baseHeaders,
      "Authorization": token,
      "token": token
    };

    await new Promise(res => setTimeout(res, 1000));

    // 3. Pin Bind
    let ts = Date.now();
    let pinPayload = { pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(pinPayload, sessionKey);

    const bindRes = await fetch(`${targetBaseUrl}/app/secure/pin/bind`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinPayload)
    });
    const bindJson = await bindRes.json();
    logs.push({ "Pin Bind": bindJson });

    await new Promise(res => setTimeout(res, 1000));

    // 4. Pin Verify
    ts = Date.now();
    pinPayload = { pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(pinPayload, sessionKey);

    const verifyRes = await fetch(`${targetBaseUrl}/app/secure/pin/verify`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pinPayload)
    });
    const verifyJson = await verifyRes.json();
    logs.push({ "Pin Verify": verifyJson });

    await new Promise(res => setTimeout(res, 1000));

    // 5. Pre Check
    ts = Date.now();
    const prePayload = { mobile: targetPhone, type: 13, appPinCode: pinCode, ts, userId };
    authHeaders["Signature"] = generateSignature(prePayload, sessionKey);

    const preRes = await fetch(`${targetBaseUrl}/app/bind/pre/check`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(prePayload)
    });
    const preJson = await preRes.json();
    logs.push({ "Pre Check": preJson });

    await new Promise(res => setTimeout(res, 1000));

    // 6. Send OTP
    ts = Date.now();
    const otpPayload = { mobile: targetPhone, type: 13, accountType: String(accountType), ts, userId };
    authHeaders["Signature"] = generateSignature(otpPayload, sessionKey);

    const otpRes = await fetch(`${targetBaseUrl}/app/bind/send/otp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(otpPayload)
    });
    const otpJson = await otpRes.json();
    logs.push({ "Send OTP to Target": otpJson });

    return NextResponse.json({ code: 200, message: "Automation executed successfully", logs });

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs: [] });
  }
}
