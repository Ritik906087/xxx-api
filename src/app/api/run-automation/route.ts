import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

/**
 * @fileOverview Hybrid Engine v8.0 - Master Stealth Configuration
 * RSWallet: Fresh identity per request (Register -> Login -> PIN Bind -> PIN Verify -> Pre-Check -> OTP)
 * DTPay: Static Auth (acebce0aa2f64ddd945b5bcb6bc9c089) with v1.1.17/21 Headers
 */

const RS_BASE_URL = "https://api.rswallet-api.com/app";
const DT_BASE_URL = "https://dtpay.app/runner-api/runner/api/v1";
const FIXED_REFERRAL = "0ealuckpbyno";
const DEFAULT_PIN = "954073";

// DTPay Static Auth - Provided by User
const DT_STATIC_TOKEN = "acebce0aa2f64ddd945b5bcb6bc9c089";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, loginToken, Signature, X-Device-ID, X-Android-ID, X-Real-IP, Client-IP, X-Runner-Token, X-App-Version, X-App-Version-Code, X-App-Platform',
};

// --- UTILITIES ---

function getRandomHex(len: number) {
  return crypto.randomBytes(len).toString('hex');
}

/**
 * Stealth Header Generator - Aligned with working logs
 */
function getStealthHeaders(token?: string, isDt = false) {
  const ip = `${Math.floor(Math.random() * 220) + 10}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
  
  if (isDt) {
    return {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json;charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36",
      "X-Forwarded-For": ip,
      "X-Real-IP": ip,
      "Client-IP": ip,
      "X-Device-ID": getRandomHex(8),
      "X-Android-ID": getRandomHex(8),
      "X-Runner-Token": token || DT_STATIC_TOKEN,
      "X-App-Version": "1.1.17",
      "X-App-Version-Code": "21",
      "X-App-Platform": "android"
    };
  }

  return {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": `Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36`,
    "X-Forwarded-For": ip,
    "X-Real-IP": ip,
    "Client-IP": ip,
    "X-Device-ID": getRandomHex(8),
    "X-Android-ID": getRandomHex(8),
    "token": token || "",
    "loginToken": token || ""
  };
}

/**
 * Legacy RSWallet Signature Generator (Strict key=value&key2=value2&sessionKey)
 */
function generateRSSignature(payload: Record<string, any>, sessionKey: string): string {
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
  const rawString = `${queryString}&${sessionKey}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

// --- RSWALLET POOL LOGIC (FRESH ACCOUNT EVERY TIME) ---

async function provisionRSAccount(logs: any[]) {
  for (let attempt = 1; attempt <= 15; attempt++) {
    const botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + crypto.randomInt(100000000, 999999999).toString().substring(0, 9);
    const botPassword = "Ritik" + getRandomHex(2) + "@1";
    
    try {
      const stealthHeaders = getStealthHeaders();
      
      const regResp = await fetch(`${RS_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: stealthHeaders,
        body: JSON.stringify({ phone: botPhone, password: botPassword, referralCode: FIXED_REFERRAL })
      }).then(r => r.json());
      
      const loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: stealthHeaders,
        body: JSON.stringify({ phone: botPhone, password: botPassword })
      }).then(r => r.json());

      if (loginResp?.code === 200) {
        const { userId, loginToken, sessionKey } = loginResp.data;
        
        // PIN Binding
        const ts1 = Date.now();
        const pinPayload = { pinCode: DEFAULT_PIN, ts: ts1, userId: parseInt(userId) };
        const sig1 = generateRSSignature(pinPayload, sessionKey);
        await fetch(`${RS_BASE_URL}/secure/pin/bind`, {
          method: 'POST',
          headers: { ...getStealthHeaders(loginToken), Signature: sig1 },
          body: JSON.stringify(pinPayload)
        });

        // PIN Verification
        const ts2 = Date.now();
        const verifyPayload = { pinCode: DEFAULT_PIN, ts: ts2, userId: parseInt(userId) };
        const sig2 = generateRSSignature(verifyPayload, sessionKey);
        await fetch(`${RS_BASE_URL}/secure/pin/verify`, {
          method: 'POST',
          headers: { ...getStealthHeaders(loginToken), Signature: sig2 },
          body: JSON.stringify(verifyPayload)
        });

        // Pre-Check Integrity
        const ts3 = Date.now();
        const prePayload = { ts: ts3, userId: parseInt(userId) }; // Specific keys might vary per channel, but this warms the session
        const sig3 = generateRSSignature(prePayload, sessionKey);
        await fetch(`${RS_BASE_URL}/bind/pre/check`, {
          method: 'POST',
          headers: { ...getStealthHeaders(loginToken), Signature: sig3 },
          body: JSON.stringify(prePayload)
        });

        return { userId: parseInt(userId), loginToken, sessionKey, phone: botPhone };
      }
    } catch (e) { }
    await new Promise(r => setTimeout(r, 400 * attempt));
  }
  return null;
}

// --- MAIN HANDLERS ---

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
      const phone = body.phone;
      let type = parseInt(body.channelType);
      const isDt = [9, 2, 3, 33].includes(type);

      if (isDt) {
        // DTPay Flow - Static Auth
        if (type === 33) type = 18; // Amazon Pay mapping
        
        const otpResp = await fetch(`${DT_BASE_URL}/runner/bind/send/otp`, {
          method: 'POST',
          headers: getStealthHeaders(DT_STATIC_TOKEN, true),
          body: JSON.stringify({ mobile: phone, ctType: type })
        }).then(r => r.json());

        logs.push({ "Step 1: DTPay OTP Dispatch": otpResp });
        
        if (otpResp.code === 200) {
          const sessionId = "DT_" + getRandomHex(4).toUpperCase();
          await db.collection('automation_sessions').insertOne({ sessionId, token: DT_STATIC_TOKEN, engine: 'DTPay', ctType: type, createdAt: new Date() });
          return NextResponse.json({ code: 200, message: "OTP Sent (DTPay)", sessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.msg || "DTPay Dispatch Failed", logs }, { status: 200, headers: CORS_HEADERS });
      } else {
        // Legacy Flow - FRESH IDENTITY
        let acc = await provisionRSAccount(logs);
        if (!acc) return NextResponse.json({ code: 500, message: "Fresh Identity Provisioning Failed", logs }, { status: 200, headers: CORS_HEADERS });

        const ts = Date.now();
        const otpPayload = { mobile: phone, type: type, accountType: "1", ts, userId: acc.userId };
        const sig = generateRSSignature(otpPayload, acc.sessionKey);
        
        const otpResp = await fetch(`${RS_BASE_URL}/bind/send/otp`, {
          method: 'POST',
          headers: { ...getStealthHeaders(acc.loginToken), Signature: sig },
          body: JSON.stringify(otpPayload)
        }).then(r => r.json());

        logs.push({ "Step 4: Legacy OTP Dispatch": otpResp });
        
        if (otpResp.code === 200) {
          const sessionId = "RS_" + getRandomHex(4).toUpperCase();
          await db.collection('automation_sessions').insertOne({ 
            sessionId, 
            userId: acc.userId, 
            sessionKey: acc.sessionKey, 
            token: acc.loginToken, 
            requestId: otpResp.data.requestId, 
            ctType: type,
            engine: 'Legacy', 
            createdAt: new Date() 
          });
          return NextResponse.json({ code: 200, message: "OTP Sent (Legacy)", sessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.message || "Legacy Dispatch Error", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "verify-otp") {
      const { sessionId, otp } = body;
      const session = await db.collection('automation_sessions').findOne({ sessionId });
      if (!session) return NextResponse.json({ code: 400, message: "Invalid Session" }, { status: 200, headers: CORS_HEADERS });

      if (session.engine === 'DTPay') {
        const checkResp = await fetch(`${DT_BASE_URL}/runner/bind/check/otp`, {
          method: 'POST',
          headers: getStealthHeaders(session.token, true),
          body: JSON.stringify({ code: otp, ctType: session.ctType })
        }).then(r => r.json());
        
        if (checkResp.code === 200) return NextResponse.json({ code: 200, message: "Success", vpaList: checkResp.data?.upiInfos || [], logs: [{ "DTPay_Verify": checkResp }] }, { status: 200, headers: CORS_HEADERS });
        return NextResponse.json({ code: 400, message: checkResp.msg || "Invalid OTP", logs: [{ "DTPay_Verify": checkResp }] }, { status: 200, headers: CORS_HEADERS });
      } else {
        const checkPayload = { code: String(otp), type: session.ctType, requestId: session.requestId, ts: Date.now(), userId: session.userId };
        const sig = generateRSSignature(checkPayload, session.sessionKey);
        
        const checkResp = await fetch(`${RS_BASE_URL}/bind/check/otp`, {
          method: 'POST',
          headers: { ...getStealthHeaders(session.token), Signature: sig },
          body: JSON.stringify(checkPayload)
        }).then(r => r.json());
        
        if (checkResp.code === 200) return NextResponse.json({ code: 200, message: "Success", vpaList: checkResp.data?.upiInfos || [], logs: [{ "Legacy_Verify": checkResp }] }, { status: 200, headers: CORS_HEADERS });
        return NextResponse.json({ code: 400, message: checkResp.message || "Invalid OTP", logs: [{ "Legacy_Verify": checkResp }] }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "fetch-by-phone") {
      let type = parseInt(body.channelType);
      if (type === 33) type = 18; // Amazon mapping for History
      
      const res = await fetch(`${DT_BASE_URL}/runner/bind/list?mobile=${body.phone}&ctType=${type}`, {
        headers: getStealthHeaders(DT_STATIC_TOKEN, true)
      }).then(r => r.json());

      logs.push({ "History_Fetch": res });

      if (res.code === 200) {
        return NextResponse.json({ code: 200, vpaList: res.data || [], logs }, { status: 200, headers: CORS_HEADERS });
      }
      return NextResponse.json({ code: 400, message: res.msg || "History Scan Failed (10001)", vpaList: [], logs }, { status: 200, headers: CORS_HEADERS });
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
