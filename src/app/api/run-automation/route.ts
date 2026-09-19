import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

/**
 * @fileOverview Hybrid Engine v25.0
 * DTPay: 12 Token Load Balancing + Sticky Sessions (MongoDB persistence)
 * RSWallet: Old Account Pool system (background provisioning + MongoDB accounts)
 */

const RS_BASE_URL = "https://api.rswallet-api.com/app";
const DT_BASE_URL = "https://dtpay.app/runner-api/runner/api/v1";
const FIXED_REFERRAL = "0ealuckpbyno";
const DEFAULT_PIN = "954073";

// DTPay Full 12 Token Pool (10 Pool + 1 Special + 1 Legacy)
const DT_TOKEN_POOL = [
  "92577e85d3e64dae94939ea23e229fa0",
  "8c04304e5bcc498dbf1a24e71542ac7f",
  "8c6f643e9804479db035b14b9c978dad",
  "1fd198a728534bec88af2bfe8a5238a7",
  "06c121d451774f489dc3d6e709feeb38",
  "c77dd20bf8f74e77b0d1f26111f19105",
  "282ed000eaee4a0bbb36aad00a406126",
  "3a03a6378fba45219e240ecc0b05b1ad",
  "5de8234504e643cdba794b17017e363a",
  "11e16fb100e2411aacd3146c118eb7df",
  "b7adb3c145f04b2eb630cc3e3424c667", // Special Token for 9955557336
  "acebce0aa2f64ddd945b5bcb6bc9c089"  // Legacy Static Token
];

const SPECIAL_PHONE = "9955557336";
const SPECIAL_TOKEN = "b7adb3c145f04b2eb630cc3e3424c667";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, loginToken, Signature, X-Device-ID, X-Android-ID, X-Real-IP, Client-IP, X-Runner-Token, X-App-Version, X-App-Version-Code, X-App-Platform, Accept',
};

// --- STICKY TOKEN RESOLVER (DTPay ONLY) ---

async function getResolvedDtToken(phone: string) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  
  // Rule 0: Special Internal Number
  if (cleanPhone === SPECIAL_PHONE) return SPECIAL_TOKEN;

  const db = await getDb();
  
  // Rule 1: Sticky Session Check (Identity Persistence from DB)
  const existingMapping = await db.collection('dt_token_mappings').findOne({ phone: cleanPhone });
  if (existingMapping) {
    return existingMapping.token;
  }

  // Rule 2: Load Balance (Pick from the 10 main pool tokens to avoid load on one)
  const pool = DT_TOKEN_POOL.slice(0, 10);
  const selectedToken = pool[Math.floor(Math.random() * pool.length)];
  
  // Rule 3: Persist Identity Mapping
  await db.collection('dt_token_mappings').insertOne({
    phone: cleanPhone,
    token: selectedToken,
    createdAt: new Date(),
    lastUsed: new Date()
  });

  return selectedToken;
}

// --- UTILITIES ---

function getRandomHex(len: number) {
  return crypto.randomBytes(len).toString('hex');
}

function getStealthHeaders(token: string, isDt = false, isForm = false) {
  const ip = `${Math.floor(Math.random() * 220) + 10}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
  
  if (isDt) {
    return {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": isForm ? "application/x-www-form-urlencoded" : "application/json;charset=UTF-8",
      "X-Forwarded-For": ip,
      "X-Real-IP": ip,
      "Client-IP": ip,
      "X-Runner-Token": token,
      "X-App-Version": "1.1.17",
      "X-App-Version-Code": "21",
      "X-App-Platform": "android",
      "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36"
    };
  }

  const headers: any = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": `Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36`,
    "X-Forwarded-For": ip,
    "X-Real-IP": ip,
    "Client-IP": ip,
    "X-Device-ID": getRandomHex(8),
    "X-Android-ID": getRandomHex(8),
  };

  if (token) {
    headers["token"] = token;
    headers["loginToken"] = token;
  }

  return headers;
}

function generateRSSignature(payload: Record<string, any>, sessionKey: string): string {
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
  const rawString = `${queryString}&${sessionKey}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

// --- RSWALLET POOL (Old System) ---

async function backgroundProvisioning() {
  try {
    const db = await getDb();
    const activeCount = await db.collection('automation_accounts').countDocuments({ status: 'active' });
    if (activeCount < 10) {
      const botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + crypto.randomInt(100000000, 999999999).toString().substring(0, 9);
      const botPassword = "Ritik" + getRandomHex(2) + "@1";
      
      const regResp = await fetch(`${RS_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getStealthHeaders(""),
        body: JSON.stringify({ phone: botPhone, password: botPassword, referralCode: FIXED_REFERRAL })
      }).then(r => r.json()).catch(() => null);
      
      if (regResp && regResp.code === 200) {
        const loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: getStealthHeaders(""),
          body: JSON.stringify({ phone: botPhone, password: botPassword })
        }).then(r => r.json()).catch(() => null);
        
        if (loginResp && loginResp.code === 200 && loginResp.data?.loginToken) {
          await db.collection('automation_accounts').insertOne({
            phone: botPhone, password: botPassword, status: 'active', createdAt: new Date()
          });
        }
      }
    }
  } catch (e) {}
}

async function provisionRSAccount() {
  const db = await getDb();
  backgroundProvisioning(); // Keep pool filled
  
  const poolAccounts = await db.collection('automation_accounts').find({ status: 'active' }).sort({ createdAt: -1 }).limit(10).toArray();
  
  for (const acc of poolAccounts) {
    try {
      const loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getStealthHeaders(""),
        body: JSON.stringify({ phone: acc.phone, password: acc.password })
      }).then(r => r.json()).catch(() => null);
      
      if (loginResp && loginResp.code === 200 && loginResp.data?.loginToken) {
        const { userId, loginToken, sessionKey } = loginResp.data;
        const ts = Date.now();
        const pinPayload = { pinCode: DEFAULT_PIN, ts, userId: parseInt(userId) };
        const sig = generateRSSignature(pinPayload, sessionKey);
        
        await fetch(`${RS_BASE_URL}/secure/pin/bind`, {
          method: 'POST',
          headers: { ...getStealthHeaders(loginToken), Signature: sig },
          body: JSON.stringify(pinPayload)
        });
        
        return { userId: parseInt(userId), loginToken, sessionKey, phone: acc.phone };
      } else {
        await db.collection('automation_accounts').updateOne({ _id: acc._id }, { $set: { status: 'expired' } });
      }
    } catch (e) {}
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
      const channelType = parseInt(body.channelType);
      const engine = body.engine || "dtpay";
      
      const isDt = engine === "dtpay" || [2, 3, 9].includes(channelType);

      if (isDt) {
        let type = channelType;
        if (type === 33) type = 18; 
        
        const token = await getResolvedDtToken(phone);
        const otpUrl = `${DT_BASE_URL}/provider/sendOtp?ctType=${type}&account=${phone}`;
        
        const otpResp = await fetch(otpUrl, {
          method: 'POST',
          headers: getStealthHeaders(token, true),
          body: JSON.stringify({}) 
        }).then(r => r.json());

        logs.push({ "DTPay_OTP_Send": otpResp });
        
        if (otpResp.code === 0 || otpResp.ok) {
          const sessionId = "DT_" + getRandomHex(4).toUpperCase();
          await db.collection('automation_sessions').insertOne({ 
            sessionId, token, engine: 'DTPay', ctType: type, phone, createdAt: new Date() 
          });
          return NextResponse.json({ code: 200, message: "OTP Sequence Initiated", sessionId, logs, tokenUsed: token }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.msg || "DTPay Error", logs }, { status: 200, headers: CORS_HEADERS });
      } else {
        let acc = await provisionRSAccount();
        if (!acc) return NextResponse.json({ code: 500, message: "RS Pool Provisioning Failed", logs }, { status: 200, headers: CORS_HEADERS });
        
        const ts = Date.now();
        const otpPayload = { mobile: phone, type: channelType, accountType: "1", ts, userId: acc.userId };
        const sig = generateRSSignature(otpPayload, acc.sessionKey);
        
        const otpResp = await fetch(`${RS_BASE_URL}/bind/send/otp`, {
          method: 'POST',
          headers: { ...getStealthHeaders(acc.loginToken), Signature: sig },
          body: JSON.stringify(otpPayload)
        }).then(r => r.json());
        
        logs.push({ "RS_Action": otpResp });
        
        if (otpResp.code === 200) {
          const sessionId = "RS_" + getRandomHex(4).toUpperCase();
          await db.collection('automation_sessions').insertOne({ 
            sessionId, userId: acc.userId, sessionKey: acc.sessionKey, token: acc.loginToken, requestId: otpResp.data.requestId, ctType: channelType, phone, engine: 'Legacy', createdAt: new Date() 
          });
          return NextResponse.json({ code: 200, message: "OTP Sent via RS (Pool Account)", sessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.message || "RS Error", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "verify-otp") {
      const { sessionId, otp } = body;
      const session = await db.collection('automation_sessions').findOne({ sessionId });
      if (!session) return NextResponse.json({ code: 400, message: "Invalid Session" }, { status: 200, headers: CORS_HEADERS });

      if (session.engine === 'DTPay') {
        const verifyUrl = `${DT_BASE_URL}/provider/verifyOtp?ctType=${session.ctType}&account=${session.phone}&otp=${otp}`;
        const verifyResp = await fetch(verifyUrl, {
          method: 'POST',
          headers: getStealthHeaders(session.token, true),
          body: JSON.stringify({})
        }).then(r => r.json());
        
        logs.push({ "DTPay_Verify": verifyResp });

        if (verifyResp.code === 0 || verifyResp.ok) {
          return NextResponse.json({ code: 200, message: "Verification Successful", logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: verifyResp.msg || "Invalid OTP", logs }, { status: 200, headers: CORS_HEADERS });
      } else {
        const checkPayload = { code: String(otp), type: session.ctType, requestId: session.requestId, ts: Date.now(), userId: session.userId };
        const sig = generateRSSignature(checkPayload, session.sessionKey);
        const checkResp = await fetch(`${RS_BASE_URL}/bind/check/otp`, {
          method: 'POST',
          headers: { ...getStealthHeaders(session.token), Signature: sig },
          body: JSON.stringify(checkPayload)
        }).then(r => r.json());
        
        if (checkResp.code === 200) {
          return NextResponse.json({ code: 200, message: "Success", logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: checkResp.message || "Invalid OTP", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "fetch-by-phone") {
      const phone = body.phone;
      const type = parseInt(body.channelType);
      const token = await getResolvedDtToken(phone);
      
      const listUrl = `${DT_BASE_URL}/upi/list?account=${phone}&ctType=${type}`;
      const listRes = await fetch(listUrl, {
        method: 'GET',
        headers: getStealthHeaders(token, true)
      }).then(r => r.json());

      if (listRes?.code === 0 && listRes.data?.length > 0) {
        const upiRecord = listRes.data.find((item: any) => String(item.walletPhone).includes(phone.slice(-10)));
        if (upiRecord?.runnerUpiId) {
          const detailUrl = `${DT_BASE_URL}/upi/detail?runnerUpiId=${upiRecord.runnerUpiId}&limit=5`;
          const detailRes = await fetch(detailUrl, {
            method: 'GET',
            headers: getStealthHeaders(token, true)
          }).then(r => r.json());

          if (detailRes?.code === 0 && detailRes.data) {
            const mappedVpaList = (detailRes.data.recentBills || []).map((bill: any) => ({
              vpa: `UTR: ${bill.utr} | Amount: ₹${bill.amount}`,
              upiAccount: detailRes.data.upi?.upiAccount || phone,
              provider: bill.provider || upiRecord.provider,
              status: bill.billStatus === 1 ? "SUCCESS" : "PENDING"
            }));
            return NextResponse.json({ code: 200, message: "Ledger Synced", vpaList: mappedVpaList, logs: [{ "DTPay_Ledger_Fetch": detailRes }] }, { status: 200, headers: CORS_HEADERS });
          }
        }
      }
      return NextResponse.json({ code: 400, message: "No ledger found." }, { status: 200, headers: CORS_HEADERS });
    }

    if (action === "find-token-mapping") {
      const phone = String(body.phone).replace(/\D/g, '').slice(-10);
      const mapping = await db.collection('dt_token_mappings').findOne({ phone });
      
      if (phone === SPECIAL_PHONE) {
        return NextResponse.json({ code: 200, token: SPECIAL_TOKEN, type: 'Special' }, { status: 200, headers: CORS_HEADERS });
      }

      if (mapping) {
        const poolIndex = DT_TOKEN_POOL.indexOf(mapping.token);
        return NextResponse.json({ 
          code: 200, 
          token: mapping.token, 
          type: poolIndex !== -1 ? `Pool Token ${poolIndex + 1}` : 'Custom',
          createdAt: mapping.createdAt 
        }, { status: 200, headers: CORS_HEADERS });
      }

      return NextResponse.json({ code: 404, message: "No identity link found for this number." }, { status: 200, headers: CORS_HEADERS });
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
