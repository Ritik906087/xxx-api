
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

const BASE_URL = "https://api.rswallet-api.com/app";
const FIXED_REFERRAL = "0ealuckpbyno";
const DEFAULT_PIN = "954073";

// Fallback Default Credentials
const FALLBACK_USER = { phone: "9060873922", password: "Ritik@9060" };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, loginToken, Signature',
};

/**
 * MD5 Signature Generator
 * Sorted query string + session key
 */
function generateSignature(payload: Record<string, any>, sessionKey: string): string {
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys
    .map(key => `${key}=${payload[key]}`)
    .join('&');
  const rawString = `${queryString}&${sessionKey}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

/**
 * Random Master User Generator
 */
function generateRandomUser() {
  const prefix = ["9", "8", "7"][Math.floor(Math.random() * 3)];
  const phone = prefix + Math.floor(100000000 + Math.random() * 900000000).toString().substring(1);
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pwdSuffix = "";
  for (let i = 0; i < 3; i++) pwdSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  const password = `Ritik${pwdSuffix}@1`;
  return { phone, password };
}

/**
 * Stealth Header Generator with Randomization
 */
function getStealthHeaders(token?: string) {
  const userAgents = [
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
  ];
  
  const headers: any = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
  };
  
  if (token) {
    headers["token"] = token;
    headers["loginToken"] = token;
  }
  
  return headers;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const logs: any[] = [];
  try {
    const body = await request.json();
    const action = body.action || "send-otp";
    const targetMobile = body.phone;
    const channelType = body.channelType || 8; // Default Paytm
    const accountType = body.accountType || "1";
    const otpCode = body.otp;
    const sessionId = body.sessionId;

    if (!targetMobile) {
      return NextResponse.json({ code: 400, message: "Target Mobile Required" }, { status: 200, headers: CORS_HEADERS });
    }

    const db = await getDb();
    const identityMap = db.collection('identity_mappings');

    if (action === "send-otp") {
      // 1. STICKY IDENTITY CHECK
      let masterPhone = "";
      let masterPassword = "";
      const existing = await identityMap.findOne({ targetPhone: targetMobile });

      if (existing) {
        masterPhone = existing.masterPhone;
        masterPassword = existing.masterPassword;
        logs.push({ "Identity Protection": `Sticky Match: Resuming session with Master ${masterPhone}` });
      } else {
        // 2. AUTO REGISTRATION (Randomized)
        let successReg = false;
        for (let i = 0; i < 2; i++) {
          const newUser = generateRandomUser();
          const regResp = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: getStealthHeaders(),
            body: JSON.stringify({ phone: newUser.phone, password: newUser.password, referralCode: FIXED_REFERRAL })
          }).then(r => r.json()).catch(() => ({}));

          if (regResp.code === 200) {
            masterPhone = newUser.phone;
            masterPassword = newUser.password;
            successReg = true;
            await identityMap.updateOne(
              { targetPhone: targetMobile },
              { $set: { masterPhone, masterPassword, masterPin: DEFAULT_PIN, createdAt: new Date().toISOString() } },
              { upsert: true }
            );
            logs.push({ "Step 1: Auto Registration": { code: 200, master: masterPhone } });
            break;
          }
        }

        if (!successReg) {
          masterPhone = FALLBACK_USER.phone;
          masterPassword = FALLBACK_USER.password;
          logs.push({ "Step 1: Registration": "Fallback used" });
        }
      }

      // 3. LOGIN
      const loginResp = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getStealthHeaders(),
        body: JSON.stringify({ phone: masterPhone, password: masterPassword })
      }).then(r => r.json());
      logs.push({ "Step 2: Master Login": loginResp });

      if (loginResp.code !== 200) {
        return NextResponse.json({ code: 400, message: "Master Auth Failed", logs }, { status: 200, headers: CORS_HEADERS });
      }

      const { userId, loginToken, sessionKey } = loginResp.data;
      const authHeaders = getStealthHeaders(loginToken);

      // 4. PIN BIND & VERIFY (Quiet Flow)
      try {
        const ts = Date.now();
        const pinPayload = { pinCode: DEFAULT_PIN, ts, userId };
        const pinHeaders = { ...authHeaders, Signature: generateSignature(pinPayload, sessionKey) };
        await fetch(`${BASE_URL}/secure/pin/bind`, { method: 'POST', headers: pinHeaders, body: JSON.stringify(pinPayload) });
        
        const vPayload = { pinCode: DEFAULT_PIN, ts: Date.now(), userId };
        const vHeaders = { ...authHeaders, Signature: generateSignature(vPayload, sessionKey) };
        await fetch(`${BASE_URL}/secure/pin/verify`, { method: 'POST', headers: vHeaders, body: JSON.stringify(vPayload) });
      } catch (e) {}

      // 5. SEND OTP
      const otpPayload = {
        mobile: targetMobile,
        type: parseInt(channelType),
        accountType: String(accountType),
        ts: Date.now(),
        userId
      };
      const otpHeaders = { ...authHeaders, Signature: generateSignature(otpPayload, sessionKey) };
      const otpResp = await fetch(`${BASE_URL}/bind/send/otp`, {
        method: 'POST',
        headers: otpHeaders,
        body: JSON.stringify(otpPayload)
      }).then(r => r.json());
      logs.push({ "Step 3: OTP Dispatch": otpResp });

      if (otpResp.code === 200) {
        const newSessionId = Math.random().toString(36).substring(7).toUpperCase();
        await db.collection('automation_sessions').insertOne({
          sessionId: newSessionId,
          userId,
          loginToken,
          sessionKey,
          requestId: otpResp.data.requestId,
          channelType,
          createdAt: new Date()
        });
        return NextResponse.json({ code: 200, message: "OTP Sent", sessionId: newSessionId, logs }, { status: 200, headers: CORS_HEADERS });
      }

      return NextResponse.json({ code: 400, message: otpResp.message || "OTP Send Failed", logs }, { status: 200, headers: CORS_HEADERS });

    } else if (action === "verify-otp") {
      const session = await db.collection('automation_sessions').findOne({ sessionId });
      if (!session) return NextResponse.json({ code: 400, message: "Invalid Session" }, { status: 200, headers: CORS_HEADERS });

      const { userId, loginToken, sessionKey, requestId } = session;
      const checkPayload = {
        code: otpCode,
        type: parseInt(channelType),
        requestId,
        ts: Date.now(),
        userId
      };
      const checkHeaders = { ...getStealthHeaders(loginToken), Signature: generateSignature(checkPayload, sessionKey) };
      
      const checkResp = await fetch(`${BASE_URL}/bind/check/otp`, {
        method: 'POST',
        headers: checkHeaders,
        body: JSON.stringify(checkPayload)
      }).then(r => r.json());
      logs.push({ "Step 4: OTP Verification": checkResp });

      if (checkResp.code === 200) {
        return NextResponse.json({ 
          code: 200, 
          message: "Verified", 
          vpaList: checkResp.data?.upiInfos || [],
          logs 
        }, { status: 200, headers: CORS_HEADERS });
      }

      return NextResponse.json({ code: 400, message: checkResp.message || "Verification Failed", logs }, { status: 200, headers: CORS_HEADERS });
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
