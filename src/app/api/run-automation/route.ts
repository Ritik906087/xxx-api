
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

const BASE_URL = "https://api.rswallet-api.com/app";
const FIXED_REFERRAL = "0ealuckpbyno";
const DEFAULT_PIN = "954073";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, loginToken, Signature, X-Forwarded-For, X-Real-IP',
};

/**
 * Anti-Detection: Generate Random Mobile IP
 */
function getRandomIP() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
}

/**
 * Anti-Detection: Rotating Android User-Agents
 */
function getRandomUserAgent() {
  const uas = [
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"
  ];
  return uas[Math.floor(Math.random() * uas.length)];
}

/**
 * Cryptographic Signature Engine
 * Sorted keys + session key -> MD5
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
 * Stealth Header Factory with IP Spoofing
 */
function getStealthHeaders(token?: string) {
  const ip = getRandomIP();
  const headers: any = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": getRandomUserAgent(),
    "X-Forwarded-For": ip,
    "X-Real-IP": ip,
    "Client-IP": ip,
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
    const channelType = body.channelType || 8;
    const accountType = body.accountType || "1";
    const otpCode = body.otp;
    const sessionId = body.sessionId;

    if (!targetMobile) {
      return NextResponse.json({ code: 400, message: "Target Identity Required" }, { status: 200, headers: CORS_HEADERS });
    }

    const db = await getDb();
    const accounts = db.collection('automation_accounts');

    if (action === "send-otp") {
      // 1. SMART ACCOUNT REUSE LOGIC
      let account = await accounts.findOne({ phone: targetMobile });
      let password = account?.password || `Ritik${Math.random().toString(36).substring(7)}@1`;

      if (!account) {
        // REGISTRATION STEP
        const regHeaders = getStealthHeaders();
        const regResp = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: regHeaders,
          body: JSON.stringify({ phone: targetMobile, password, referralCode: FIXED_REFERRAL })
        }).then(r => r.json()).catch(() => ({}));

        logs.push({ "Step 1: Automated Registration": regResp });
        
        // Save initial credentials
        await accounts.updateOne(
          { phone: targetMobile },
          { $set: { phone: targetMobile, password, pin: DEFAULT_PIN, createdAt: new Date() } },
          { upsert: true }
        );
      } else {
        logs.push({ "Step 1: Identity Manager": "Smart Reuse: Account Found in MongoDB" });
      }

      // 2. AUTHENTICATED LOGIN
      const loginResp = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getStealthHeaders(),
        body: JSON.stringify({ phone: targetMobile, password })
      }).then(r => r.json());
      
      logs.push({ "Step 2: Automated Login": loginResp });

      if (loginResp.code !== 200) {
        return NextResponse.json({ code: 400, message: "Authentication Failed", logs }, { status: 200, headers: CORS_HEADERS });
      }

      const { userId, loginToken, sessionKey } = loginResp.data;
      const authHeaders = getStealthHeaders(loginToken);

      // 3. SECURE PIN MANAGEMENT (Bind & Verify)
      try {
        const ts = Date.now();
        const pinPayload = { pinCode: DEFAULT_PIN, ts, userId };
        const pinHeaders = { ...authHeaders, Signature: generateSignature(pinPayload, sessionKey) };
        await fetch(`${BASE_URL}/secure/pin/bind`, { method: 'POST', headers: pinHeaders, body: JSON.stringify(pinPayload) });
        
        const vPayload = { pinCode: DEFAULT_PIN, ts: Date.now(), userId };
        const vHeaders = { ...authHeaders, Signature: generateSignature(vPayload, sessionKey) };
        await fetch(`${BASE_URL}/secure/pin/verify`, { method: 'POST', headers: vHeaders, body: JSON.stringify(vPayload) });
      } catch (e) {}

      // 4. OTP TRIGGER
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
          channelType: parseInt(channelType),
          createdAt: new Date()
        });
        return NextResponse.json({ code: 200, message: "OTP Dispatched", sessionId: newSessionId, logs }, { status: 200, headers: CORS_HEADERS });
      }

      return NextResponse.json({ code: 400, message: otpResp.message || "OTP Send Failed", logs }, { status: 200, headers: CORS_HEADERS });

    } else if (action === "verify-otp") {
      const session = await db.collection('automation_sessions').findOne({ sessionId });
      if (!session) return NextResponse.json({ code: 400, message: "Session Expired" }, { status: 200, headers: CORS_HEADERS });

      const { userId, loginToken, sessionKey, requestId, channelType: cType } = session;
      const checkPayload = {
        code: otpCode,
        type: cType,
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
      
      logs.push({ "Step 4: VPA Extraction": checkResp });

      if (checkResp.code === 200) {
        return NextResponse.json({ 
          code: 200, 
          message: "Verified", 
          vpaList: checkResp.data?.upiInfos || [],
          logs 
        }, { status: 200, headers: CORS_HEADERS });
      }

      return NextResponse.json({ code: 400, message: checkResp.message || "Invalid OTP", logs }, { status: 200, headers: CORS_HEADERS });
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
