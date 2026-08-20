import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

// API Endpoints
const RS_BASE_URL = "https://api.rswallet-api.com/app";
const DT_BASE_URL = "https://dtpay.app/runner-api/runner/api/v1";

// DTPay Master Credentials
const DT_MASTER_PHONE = "7870873927";
const DT_MASTER_PWD = "123456";

// Channel Logic Separation
const DTPAY_CHANNELS = [1, 2, 3, 9]; // Amazon, MobiKwik, Freecharge, Paytm

const DTPAY_PROVIDERS: Record<number, string> = {
  1: "AMAZON",
  2: "MOBIKWIK",
  3: "FREECHARGE",
  9: "PAYTM"
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, loginToken, Signature, X-Runner-Token, X-App-Version, X-App-Version-Code',
};

function getRandomIP() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
}

function getRandomUserAgent() {
  const uas = [
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"
  ];
  return uas[Math.floor(Math.random() * uas.length)];
}

function sanitizePhone(phone: string): string {
  const cleaned = String(phone).replace(/\D/g, '');
  return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
}

function generateRSSignature(payload: Record<string, any>, sessionKey: string): string {
  const sortedKeys = Object.keys(payload).sort();
  let rawStr = "";
  for (const key of sortedKeys) {
    rawStr += `${key}${payload[key]}`;
  }
  rawStr += sessionKey;
  return crypto.createHash('md5').update(rawStr).digest('hex');
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
    const db = await getDb();

    if (action === "send-otp") {
      const targetMobile = sanitizePhone(body.phone || "");
      const channelType = parseInt(body.channelType);
      
      // HYBRID ROUTING
      const isDTPay = DTPAY_CHANNELS.includes(channelType);
      logs.push({ "Step 0: Engine Selection": { ok: true, msg: `Routing to ${isDTPay ? 'DTPay (New)' : 'Legacy (Old)'} Engine for Type ${channelType}` } });

      if (isDTPay) {
        // DTPay Flow: Login Master -> Send OTP
        const loginResp = await fetch(`${DT_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: getStealthHeaders(undefined, true),
          body: JSON.stringify({ phone: DT_MASTER_PHONE, password: DT_MASTER_PWD, countryCode: "+91" })
        }).then(r => r.json());

        logs.push({ "Step 1: DTPay Master Auth": loginResp });
        if (!loginResp.ok) return NextResponse.json({ code: 400, message: "Master Auth Failed", logs }, { status: 200, headers: CORS_HEADERS });

        const runnerToken = loginResp.data.token;
        const otpResp = await fetch(`${DT_BASE_URL}/provider/sendOtp?ctType=${channelType}&account=${targetMobile}`, {
          method: 'POST',
          headers: getStealthHeaders(runnerToken, true),
          body: JSON.stringify({})
        }).then(r => r.json());

        logs.push({ "Step 2: DTPay OTP Trigger": otpResp });
        if (otpResp.ok) {
          const sessionId = "DT_" + Math.random().toString(36).substring(7).toUpperCase();
          await db.collection('automation_sessions').insertOne({ sessionId, runnerToken, channelType, targetMobile, engine: 'DTPay', createdAt: new Date() });
          return NextResponse.json({ code: 200, message: "OTP Sent via DTPay", sessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.msg || "DTPay OTP Failed", logs }, { status: 200, headers: CORS_HEADERS });

      } else {
        // Legacy RSWallet Flow: Reg/Login Bot -> Bind PIN -> Send OTP
        const botPhone = targetMobile;
        const password = "Bot" + Math.random().toString(36).substring(7) + "@1";

        const regResp = await fetch(`${RS_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: getStealthHeaders(),
          body: JSON.stringify({ phone: botPhone, password, referralCode: "0ealuckpbyno" })
        }).then(r => r.json());

        logs.push({ "Step 1: Legacy Registration": regResp });

        const loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: getStealthHeaders(),
          body: JSON.stringify({ phone: botPhone, password })
        }).then(r => r.json());

        logs.push({ "Step 2: Legacy Bot Login": loginResp });
        if (loginResp.code !== 200) return NextResponse.json({ code: 400, message: "Legacy Auth Failed", logs }, { status: 200, headers: CORS_HEADERS });

        const { userId, loginToken, sessionKey } = loginResp.data;
        const authHeaders = getStealthHeaders(loginToken);

        // PIN Bind
        const ts = Date.now();
        const pinPayload = { pinCode: "954073", ts, userId };
        const sig = generateRSSignature(pinPayload, sessionKey);
        await fetch(`${RS_BASE_URL}/secure/pin/bind`, { method: 'POST', headers: { ...authHeaders, Signature: sig }, body: JSON.stringify(pinPayload) });

        const otpPayload = { mobile: targetMobile, type: channelType, accountType: "1", ts: Date.now(), userId };
        const otpSig = generateRSSignature(otpPayload, sessionKey);
        const otpResp = await fetch(`${RS_BASE_URL}/bind/send/otp`, {
          method: 'POST',
          headers: { ...authHeaders, Signature: otpSig },
          body: JSON.stringify(otpPayload)
        }).then(r => r.json());

        logs.push({ "Step 3: Legacy OTP Trigger": otpResp });
        if (otpResp.code === 200) {
          const sessionId = "RS_" + Math.random().toString(36).substring(7).toUpperCase();
          await db.collection('automation_sessions').insertOne({ sessionId, userId, loginToken, sessionKey, requestId: otpResp.data.requestId, channelType, engine: 'Legacy', createdAt: new Date() });
          return NextResponse.json({ code: 200, message: "OTP Sent via Legacy", sessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: "Legacy OTP Failed", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "verify-otp") {
      const { sessionId, otp } = body;
      const session = await db.collection('automation_sessions').findOne({ sessionId });
      if (!session) return NextResponse.json({ code: 400, message: "Session Expired" }, { status: 200, headers: CORS_HEADERS });

      if (session.engine === 'DTPay') {
        const { runnerToken, channelType: cType, targetMobile: tMob } = session;
        const dtHeaders = getStealthHeaders(runnerToken, true);

        const verifyResp = await fetch(`${DT_BASE_URL}/provider/verifyOtp?ctType=${cType}&account=${tMob}&otp=${otp}`, {
          method: 'POST',
          headers: dtHeaders,
          body: JSON.stringify({})
        }).then(r => r.json());

        logs.push({ "Step 3: DTPay Verification": verifyResp });
        if (verifyResp.ok) {
          await fetch(`${DT_BASE_URL}/provider/completeLogin?ctType=${cType}&account=${tMob}`, { method: 'POST', headers: dtHeaders, body: JSON.stringify({}) });
          const infoResp = await fetch(`${DT_BASE_URL}/provider/upiInfo?ctType=${cType}&account=${tMob}`, { method: 'POST', headers: dtHeaders, body: JSON.stringify({}) }).then(r => r.json());
          logs.push({ "Step 4: UPI Profile Extractions": infoResp });
          return NextResponse.json({ code: 200, message: "Success", vpaList: infoResp.data?.upiInfos || [], logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: "Invalid DTPay OTP", logs }, { status: 200, headers: CORS_HEADERS });

      } else {
        const { userId, loginToken, sessionKey, requestId, channelType: cType } = session;
        const checkPayload = { code: otp, type: cType, requestId, ts: Date.now(), userId };
        const sig = generateRSSignature(checkPayload, sessionKey);
        const checkResp = await fetch(`${RS_BASE_URL}/bind/check/otp`, {
          method: 'POST',
          headers: { ...getStealthHeaders(loginToken), Signature: sig },
          body: JSON.stringify(checkPayload)
        }).then(r => r.json());

        logs.push({ "Step 3: Legacy Verification": checkResp });
        if (checkResp.code === 200) {
          return NextResponse.json({ code: 200, message: "Success", vpaList: checkResp.data?.upiInfos || [], logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: "Invalid Legacy OTP", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "fetch-by-phone") {
      const targetMobile = sanitizePhone(body.phone || "");
      const channelType = parseInt(body.channelType);
      const providerName = DTPAY_PROVIDERS[channelType];

      if (!providerName) return NextResponse.json({ code: 400, message: "History only supported for DTPay Channels" }, { status: 200, headers: CORS_HEADERS });

      logs.push({ "Step 0: Probe Strategy": { ok: true, msg: `Searching ${providerName} ledger for ${targetMobile}` } });

      const loginResp = await fetch(`${DT_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getStealthHeaders(undefined, true),
        body: JSON.stringify({ phone: DT_MASTER_PHONE, password: DT_MASTER_PWD, countryCode: "+91" })
      }).then(r => r.json());

      if (!loginResp.ok) return NextResponse.json({ code: 400, message: "Master Auth Failed", logs }, { status: 200, headers: CORS_HEADERS });

      const runnerToken = loginResp.data.token;
      const listResp = await fetch(`${DT_BASE_URL}/upi/list`, { method: 'GET', headers: getStealthHeaders(runnerToken, true) }).then(r => r.json());

      if (listResp.ok) {
        const match = listResp.data.find((u: any) => u.upiAccount.includes(targetMobile) && u.provider === providerName);
        if (match) {
          const detailResp = await fetch(`${DT_BASE_URL}/upi/detail?runnerUpiId=${match.runnerUpiId}&limit=5`, { method: 'GET', headers: getStealthHeaders(runnerToken, true) }).then(r => r.json());
          return NextResponse.json({ code: 200, data: detailResp.data, logs }, { status: 200, headers: CORS_HEADERS });
        }
      }
      return NextResponse.json({ code: 404, message: `No ${providerName} record found for this number.`, logs }, { status: 200, headers: CORS_HEADERS });
    }

    if (action === "fetch-upi-details") {
      const { runnerUpiId } = body;
      const loginResp = await fetch(`${DT_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getStealthHeaders(undefined, true),
        body: JSON.stringify({ phone: DT_MASTER_PHONE, password: DT_MASTER_PWD, countryCode: "+91" })
      }).then(r => r.json());

      const detailResp = await fetch(`${DT_BASE_URL}/upi/detail?runnerUpiId=${runnerUpiId}&limit=5`, { method: 'GET', headers: getStealthHeaders(loginResp.data.token, true) }).then(r => r.json());
      return NextResponse.json({ code: 200, data: detailResp.data, logs }, { status: 200, headers: CORS_HEADERS });
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
