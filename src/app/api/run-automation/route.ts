
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

// API Endpoints
const RS_BASE_URL = "https://api.rswallet-api.com/app";
const DT_BASE_URL = "https://dtpay.app/runner-api/runner/api/v1";

// DTPay Master Credentials
const DT_MASTER_PHONE = "7870873927";
const DT_MASTER_PWD = "123456";

// Channel Mappings
const DTPAY_CHANNELS = [1, 2, 3, 9]; // Amazon, MobiKwik, Freecharge, Paytm

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, loginToken, Signature, X-Forwarded-For, X-Real-IP, X-Runner-Token',
};

function getRandomIP() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
}

function getRandomUserAgent() {
  const uas = [
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"
  ];
  return uas[Math.floor(Math.random() * uas.length)];
}

function sanitizePhone(phone: string): string {
  const cleaned = String(phone).replace(/\D/g, '');
  return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
}

function generateRSSignature(payload: Record<string, any>, sessionKey: string): string {
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
  const rawString = `${queryString}&${sessionKey}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

function getStealthHeaders(token?: string, isDTPay: boolean = false) {
  const ip = getRandomIP();
  const headers: any = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": getRandomUserAgent(),
    "X-Forwarded-For": ip,
    "X-Real-IP": ip,
  };

  if (isDTPay) {
    headers["X-App-Version"] = "1.1.13";
    headers["X-App-Version-Code"] = "17";
    if (token) headers["X-Runner-Token"] = token;
  } else if (token) {
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
    const rawMobile = body.phone;
    
    if (!rawMobile) {
      return NextResponse.json({ code: 400, message: "Target Identity Required" }, { status: 200, headers: CORS_HEADERS });
    }

    const targetMobile = sanitizePhone(rawMobile);
    const channelType = parseInt(body.channelType) || 8;
    const isDTPayFlow = DTPAY_CHANNELS.includes(channelType);
    
    const db = await getDb();

    if (action === "send-otp") {
      if (isDTPayFlow) {
        // --- DTPAY LOGIN FLOW ---
        logs.push({ "Step 0: DTPay Engine": `Initializing Login flow for CT Type ${channelType}` });
        
        const loginResp = await fetch(`${DT_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: getStealthHeaders(undefined, true),
          body: JSON.stringify({ phone: DT_MASTER_PHONE, password: DT_MASTER_PWD, countryCode: "+91" })
        }).then(r => r.json());

        logs.push({ "Step 1: DTPay Master Login": loginResp });

        if (loginResp.code !== 0 || !loginResp.ok) {
          return NextResponse.json({ code: 400, message: loginResp.msg || "DTPay Auth Failed", logs }, { status: 200, headers: CORS_HEADERS });
        }

        const runnerToken = loginResp.data.token;
        const dtHeaders = getStealthHeaders(runnerToken, true);

        // Send OTP
        const otpResp = await fetch(`${DT_BASE_URL}/provider/sendOtp?ctType=${channelType}&account=${targetMobile}`, {
          method: 'POST',
          headers: dtHeaders,
          body: JSON.stringify({})
        }).then(r => r.json());

        logs.push({ "Step 2: DTPay OTP Dispatch": otpResp });

        if (otpResp.code === 0 && otpResp.ok) {
          const newSessionId = "DT_" + Math.random().toString(36).substring(7).toUpperCase();
          await db.collection('automation_sessions').insertOne({
            sessionId: newSessionId,
            runnerToken,
            channelType,
            targetMobile,
            engine: 'DTPay',
            createdAt: new Date()
          });
          return NextResponse.json({ code: 200, message: "OTP Dispatched", sessionId: newSessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.msg || "OTP Send Failed", logs }, { status: 200, headers: CORS_HEADERS });

      } else {
        // --- LEGACY RSWALLET FLOW ---
        logs.push({ "Step 0: Legacy Engine": `Initializing RSWallet flow for CT Type ${channelType}` });
        
        // Random Bot Registration logic for RS
        const botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + Math.floor(100000000 + Math.random() * 900000000).toString().substring(1);
        const password = "Ritik" + Math.random().toString(36).substring(7) + "@1";

        await fetch(`${RS_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: getStealthHeaders(),
          body: JSON.stringify({ phone: botPhone, password, referralCode: "0ealuckpbyno" })
        });

        const loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: getStealthHeaders(),
          body: JSON.stringify({ phone: botPhone, password })
        }).then(r => r.json());

        logs.push({ "Step 1: Legacy Login": loginResp });

        if (loginResp.code !== 200) {
          return NextResponse.json({ code: 400, message: "Legacy Auth Failed", logs }, { status: 200, headers: CORS_HEADERS });
        }

        const { userId, loginToken, sessionKey } = loginResp.data;
        const authHeaders = getStealthHeaders(loginToken);

        // PIN Setup
        const ts = Date.now();
        const pinPayload = { pinCode: "954073", ts, userId };
        const pinHeaders = { ...authHeaders, Signature: generateRSSignature(pinPayload, sessionKey) };
        await fetch(`${RS_BASE_URL}/secure/pin/bind`, { method: 'POST', headers: pinHeaders, body: JSON.stringify(pinPayload) });

        // Trigger OTP
        const otpPayload = { mobile: targetMobile, type: channelType, accountType: "1", ts: Date.now(), userId };
        const otpHeaders = { ...authHeaders, Signature: generateRSSignature(otpPayload, sessionKey) };
        const otpResp = await fetch(`${RS_BASE_URL}/bind/send/otp`, {
          method: 'POST',
          headers: otpHeaders,
          body: JSON.stringify(otpPayload)
        }).then(r => r.json());

        logs.push({ "Step 2: Legacy OTP Dispatch": otpResp });

        if (otpResp.code === 200) {
          const newSessionId = "RS_" + Math.random().toString(36).substring(7).toUpperCase();
          await db.collection('automation_sessions').insertOne({
            sessionId: newSessionId,
            userId,
            loginToken,
            sessionKey,
            requestId: otpResp.data.requestId,
            channelType,
            engine: 'Legacy',
            createdAt: new Date()
          });
          return NextResponse.json({ code: 200, message: "OTP Dispatched", sessionId: newSessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: "OTP Send Failed", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "verify-otp") {
      const sessionId = body.sessionId;
      const otpCode = body.otp;
      const session = await db.collection('automation_sessions').findOne({ sessionId });
      
      if (!session) return NextResponse.json({ code: 400, message: "Session Expired" }, { status: 200, headers: CORS_HEADERS });

      if (session.engine === 'DTPay') {
        const { runnerToken, channelType: cType, targetMobile: tMob } = session;
        const dtHeaders = getStealthHeaders(runnerToken, true);

        // 1. Verify OTP
        const verifyResp = await fetch(`${DT_BASE_URL}/provider/verifyOtp?ctType=${cType}&account=${tMob}&otp=${otpCode}`, {
          method: 'POST',
          headers: dtHeaders,
          body: JSON.stringify({})
        }).then(r => r.json());

        logs.push({ "Step 3: DTPay OTP Verify": verifyResp });

        if (verifyResp.code === 0 && verifyResp.ok) {
          // 2. Complete Login
          await fetch(`${DT_BASE_URL}/provider/completeLogin?ctType=${cType}&account=${tMob}`, {
            method: 'POST',
            headers: dtHeaders,
            body: JSON.stringify({})
          });

          // 3. Get UPI Info
          const infoResp = await fetch(`${DT_BASE_URL}/provider/upiInfo?ctType=${cType}&account=${tMob}`, {
            method: 'POST',
            headers: dtHeaders,
            body: JSON.stringify({})
          }).then(r => r.json());

          logs.push({ "Step 4: DTPay VPA Fetch": infoResp });

          return NextResponse.json({ 
            code: 200, 
            message: "Verified", 
            vpaList: infoResp.data?.upiInfos || [],
            logs 
          }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: verifyResp.msg || "Invalid OTP", logs }, { status: 200, headers: CORS_HEADERS });

      } else {
        // LEGACY VERIFY
        const { userId, loginToken, sessionKey, requestId, channelType: cType } = session;
        const checkPayload = { code: otpCode, type: cType, requestId, ts: Date.now(), userId };
        const checkHeaders = { ...getStealthHeaders(loginToken), Signature: generateRSSignature(checkPayload, sessionKey) };
        
        const checkResp = await fetch(`${RS_BASE_URL}/bind/check/otp`, {
          method: 'POST',
          headers: checkHeaders,
          body: JSON.stringify(checkPayload)
        }).then(r => r.json());
        
        logs.push({ "Step 3: Legacy VPA Extraction": checkResp });

        if (checkResp.code === 200) {
          return NextResponse.json({ 
            code: 200, 
            message: "Verified", 
            vpaList: checkResp.data?.upiInfos || [],
            logs 
          }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: "Invalid OTP", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
