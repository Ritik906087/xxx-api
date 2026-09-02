import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

/**
 * @fileOverview Refactored Hybrid Engine with MongoDB Account Pool & Auto-Healing.
 * Strictly excludes: Paytm, MobiKwik, Freecharge, Amazon.
 * Supports: PhonePe, Navi, PhonePeBusiness, SuperMoney, BharatPeBusiness.
 */

const RS_BASE_URL = "https://api.rswallet-api.com/app";
const FIXED_REFERRAL = "0ealuckpbyno";
const DEFAULT_PIN = "954073";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, loginToken, Signature, X-Device-ID, X-Android-ID, X-Real-IP, Client-IP',
};

// --- STEALTH UTILITIES ---

function getRandomIP() {
  return `${Math.floor(Math.random() * 220) + 10}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
}

function getRandomHex(len: number) {
  return crypto.randomBytes(len).toString('hex');
}

function getStealthHeaders(token?: string) {
  const ip = getRandomIP();
  const headers: any = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": `Mozilla/5.0 (Linux; Android ${12 + Math.floor(Math.random() * 3)}; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${118 + Math.floor(Math.random() * 5)}.0.0.0 Mobile Safari/537.36`,
    "X-Forwarded-For": ip,
    "X-Real-IP": ip,
    "Client-IP": ip,
    "X-Device-ID": getRandomHex(8),
    "X-Android-ID": getRandomHex(8),
  };
  if (token) {
    const cleanToken = token.replace(/['"]+/g, '').trim();
    headers["token"] = cleanToken;
    headers["loginToken"] = cleanToken;
  }
  return headers;
}

function generateRSSignature(payload: Record<string, any>, sessionKey: string): string {
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
  const rawString = `${queryString}&${sessionKey}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

// --- ACCOUNT POOL & AUTO-HEALING ---

async function generateAndStoreAccount(logs: any[]) {
  const db = await getDb();
  let finalAccount = null;

  for (let attempt = 1; attempt <= 10; attempt++) {
    const botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + crypto.randomInt(100000000, 999999999).toString().substring(0, 9);
    const botPassword = "Ritik" + getRandomHex(2) + "@1";
    const headers = getStealthHeaders();

    try {
      // Register
      await fetch(`${RS_BASE_URL}/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone: botPhone, password: botPassword, referralCode: FIXED_REFERRAL })
      });

      // Login
      const loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone: botPhone, password: botPassword })
      }).then(r => r.json());

      if (loginResp?.code === 200) {
        const { userId, loginToken, sessionKey } = loginResp.data;
        
        // Warmup Session (PIN Bind & Verify)
        const ts = Date.now();
        const pinPayload = { pinCode: DEFAULT_PIN, ts, userId: parseInt(userId) };
        const pinHeaders = { ...getStealthHeaders(loginToken), Signature: generateRSSignature(pinPayload, sessionKey) };
        await fetch(`${RS_BASE_URL}/secure/pin/bind`, { method: 'POST', headers: pinHeaders, body: JSON.stringify(pinPayload) });

        finalAccount = {
          phone: botPhone,
          password: botPassword,
          userId: parseInt(userId),
          loginToken,
          sessionKey,
          status: 'active',
          lastUsed: new Date()
        };

        await db.collection('dummy_accounts').insertOne(finalAccount);
        logs.push({ "Auto-Healing": { ok: true, msg: `Provisioned fresh account: ${botPhone}` } });
        return finalAccount;
      }
    } catch (e) {
      continue;
    }
    await new Promise(r => setTimeout(r, 500 * attempt));
  }
  return null;
}

async function getValidAccount(logs: any[]) {
  const db = await getDb();
  
  // Try to find an active account from pool
  const account = await db.collection('dummy_accounts').findOneAndUpdate(
    { status: 'active' },
    { $set: { lastUsed: new Date() } },
    { sort: { lastUsed: 1 } }
  );

  if (account) {
    logs.push({ "Pool Management": { ok: true, msg: `Fetched account from pool: ${account.phone}` } });
    return account;
  }

  // If no active account, heal by creating one
  logs.push({ "Pool Management": { ok: false, msg: "Pool empty. Triggering Auto-Healing..." } });
  return await generateAndStoreAccount(logs);
}

// --- MAIN ROUTE ---

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const logs: any[] = [];
  try {
    const body = await request.json();
    const action = body.action || "send-otp";
    const db = await getDb();

    if (action === "send-otp") {
      const targetMobile = body.phone;
      const channelType = parseInt(body.channelType);

      // Exclusion Check: Strictly allow only PhonePe, Navi, PPB, SuperMoney, BPB
      const allowedTypes = [1, 13, 14, 17, 18];
      if (!allowedTypes.includes(channelType)) {
        return NextResponse.json({ code: 403, message: "Channel Access Denied (Excluded Platform)", logs }, { status: 200, headers: CORS_HEADERS });
      }

      // 1. Get account from pool
      let dummy = await getValidAccount(logs);
      if (!dummy) return NextResponse.json({ code: 500, message: "Identity Pool Depleted", logs }, { status: 200, headers: CORS_HEADERS });

      // 2. Sequential PIN Verification (Fresh Warmup)
      let ts = Date.now();
      const verifyPayload = { pinCode: DEFAULT_PIN, ts, userId: dummy.userId };
      const sig = generateRSSignature(verifyPayload, dummy.sessionKey);
      const authHeaders = { ...getStealthHeaders(dummy.loginToken), Signature: sig };

      const verifyResp = await fetch(`${RS_BASE_URL}/secure/pin/verify`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(verifyPayload)
      }).then(r => r.json());

      // AUTO-HEALING: If session expired (1002), mark expired and retry once
      if (verifyResp.code === 1002) {
        logs.push({ "Auto-Healing": { ok: false, msg: `Account ${dummy.phone} session expired. Recycling...` } });
        await db.collection('dummy_accounts').updateOne({ phone: dummy.phone }, { $set: { status: 'expired' } });
        dummy = await generateAndStoreAccount(logs);
        if (!dummy) return NextResponse.json({ code: 500, message: "Healing Failed", logs }, { status: 200, headers: CORS_HEADERS });
      }

      // 3. Final OTP Dispatch
      ts = Date.now();
      const otpPayload = { mobile: targetMobile, type: channelType, accountType: "1", ts, userId: dummy.userId };
      const otpSig = generateRSSignature(otpPayload, dummy.sessionKey);
      const otpHeaders = { ...getStealthHeaders(dummy.loginToken), Signature: otpSig };

      const otpResp = await fetch(`${RS_BASE_URL}/bind/send/otp`, {
        method: 'POST',
        headers: otpHeaders,
        body: JSON.stringify(otpPayload)
      }).then(r => r.json());

      logs.push({ "Step 4: Legacy OTP Dispatch": otpResp });

      if (otpResp.code === 200) {
        const sessionId = "RS_" + getRandomHex(4).toUpperCase();
        await db.collection('automation_sessions').insertOne({ 
          sessionId, 
          userId: dummy.userId, 
          loginToken: dummy.loginToken, 
          sessionKey: dummy.sessionKey, 
          requestId: otpResp.data.requestId, 
          channelType, 
          engine: 'Legacy', 
          createdAt: new Date() 
        });
        return NextResponse.json({ code: 200, message: "OTP Sent Successfully", sessionId, logs }, { status: 200, headers: CORS_HEADERS });
      }

      return NextResponse.json({ code: 400, message: otpResp.message || "OTP Dispatch Failed", logs }, { status: 200, headers: CORS_HEADERS });
    }

    if (action === "verify-otp") {
      const { sessionId, otp } = body;
      const session = await db.collection('automation_sessions').findOne({ sessionId });
      if (!session) return NextResponse.json({ code: 400, message: "Session Expired" }, { status: 200, headers: CORS_HEADERS });

      const checkPayload = { 
        code: String(otp), 
        type: parseInt(session.channelType), 
        requestId: parseInt(session.requestId), 
        ts: Date.now(), 
        userId: parseInt(session.userId) 
      };
      
      const sig = generateRSSignature(checkPayload, session.sessionKey);
      const authHeaders = { ...getStealthHeaders(session.loginToken), Signature: sig };

      const checkResp = await fetch(`${RS_BASE_URL}/bind/check/otp`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(checkPayload)
      }).then(r => r.json());

      logs.push({ "Verification Final": checkResp });

      if (checkResp.code === 200) {
        return NextResponse.json({ code: 200, message: "Success", vpaList: checkResp.data?.upiInfos || [], logs }, { status: 200, headers: CORS_HEADERS });
      }
      return NextResponse.json({ code: 400, message: checkResp.message || "Invalid OTP", logs }, { status: 200, headers: CORS_HEADERS });
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
