import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

/**
 * @fileOverview Hybrid Engine v33.0 - Optimized Routing
 * Fixed: Engine selection now strictly respected. 
 * RSWallet: Strictly Old Account Pool system.
 * DTPay: Multi-Token Load Balancing with Auto-Migration.
 */

const RS_BASE_URL = "https://api.rswallet-api.com/app";
const DT_BASE_URL = "https://dtpay.app/runner-api/runner/api/v1";
const FIXED_REFERRAL = "0ealuckpbyno";
const DEFAULT_PIN = "954073";

// New Active Migration Target
const MIGRATED_NEW_TOKEN = "9de595f72cb34d018673e8fee7b5ba05";

// List of Expired Tokens for Migration
const EXPIRED_TOKENS = [
  "92577e85d3e64dae94939ea23e229fa0",
  "8c04304e5bcc498dbf1a24e71542ac7f",
  "8c6f643e9804479db035b14b9c978dad",
  "1fd198a728534bec88af2bfe8a5238a7",
  "06c121d451774f489dc3d6e709feeb38",
  "c77dd20bf8f74e77b0d1f26111f19105",
  "282ed000eaee4a0bbb36aad00a406126",
  "3a03a6378fba45219e240ecc0b05b1ad",
  "5de8234504e643cdba794b17017e363a",
  "11e16fb100e2411aacd3146c118eb7df"
];

// DTPay Active Token Pool
const DT_TOKEN_POOL = [
  "9de595f72cb34d018673e8fee7b5ba05", // Primary Active
  "b3c8acfef00440e78a5dca12844fa0ba",
  "648ade53f9ff434e9c264f8a050440aa",
  "5ca04d9e066a4dc1a1ac31d7bb087f1d",
  "e742d569dd214f59afd9998fc7e4ee8b",
  "2aeb9075afac4746a5ae1f8c27b36dbc",
  "4b1ff16ad2db4a3fb98747c1e3d82fea",
  "2f6c1e99f15a4d95aec594b042528f5e",
  "eca3ff6cfa134e72b172eb8e2f4dee65",
  "2ff3d739fd8f4e5d809d06cb4de22474",
  "1e467fbaba784d6ba0f30a1b043d400f"
];

const SPECIAL_PHONE = "9955557336";
const SPECIAL_TOKEN = "b7adb3c145f04b2eb630cc3e3424c667";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, loginToken, Signature, X-Device-ID, X-Android-ID, X-Real-IP, Client-IP, X-Runner-Token, X-App-Version, X-App-Version-Code, X-App-Platform, Accept, INDIATOKEN',
};

async function getResolvedDtToken(phone: string) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  
  if (cleanPhone === SPECIAL_PHONE) return SPECIAL_TOKEN;

  const db = await getDb();
  
  const existingMapping = await db.collection('dt_token_mappings').findOne({ phone: cleanPhone });
  if (existingMapping) {
    if (EXPIRED_TOKENS.includes(existingMapping.token)) {
      await db.collection('dt_token_mappings').updateOne(
        { _id: existingMapping._id },
        { $set: { token: MIGRATED_NEW_TOKEN, migratedAt: new Date(), oldToken: existingMapping.token } }
      );
      return MIGRATED_NEW_TOKEN;
    }
    return existingMapping.token;
  }

  // Pure distributed selector mapping algorithm to ensure loads do not hit a single node
  const pool = DT_TOKEN_POOL;
  const selectedToken = pool[Math.floor(Math.random() * pool.length)];
  
  await db.collection('dt_token_mappings').insertOne({
    phone: cleanPhone,
    token: selectedToken,
    createdAt: new Date(),
    lastUsed: new Date()
  });

  return selectedToken;
}

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

async function provisionRSAccount() {
  const db = await getDb();
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
      
      // Strict Engine Routing Logic
      const isDt = engine === "dtpay";

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
        // RSWallet Engine (Legacy)
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
      
      let targetProvider = "";
      if (type === 1 || type === 14) targetProvider = "PHONEPE";
      else if (type === 9) targetProvider = "PAYTM";
      else if (type === 2) targetProvider = "MOBIKWIK";
      else if (type === 3) targetProvider = "FREECHARGE";
      else if (type === 18) targetProvider = "BHARATPE";

      const listUrl = `${DT_BASE_URL}/upi/list?account=${phone}&ctType=${type}`;
      const listRes = await fetch(listUrl, {
        method: 'GET',
        headers: getStealthHeaders(token, true)
      }).then(r => r.json());

      if (listRes?.code === 0 && listRes.data?.length > 0) {
        const upiRecord = listRes.data.find((item: any) => 
          String(item.walletPhone).includes(phone.slice(-10)) && 
          String(item.provider).toUpperCase() === targetProvider
        );

        if (upiRecord?.runnerUpiId) {
          const detailUrl = `${DT_BASE_URL}/upi/detail?runnerUpiId=${upiRecord.runnerUpiId}&limit=5`;
          const detailRes = await fetch(detailUrl, {
            method: 'GET',
            headers: getStealthHeaders(token, true)
          }).then(r => r.json());

          if (detailRes?.code === 0 && detailRes.data) {
            const mappedVpaList = (detailRes.data.recentBills || []).map((bill: any) => ({
              vpa: `UTR: ${bill.utr} | Amount: ₹${bill.amount}`,
              upiAccount: detailRes.data.upi?.upiAccount || upiRecord.upiAccount || phone,
              provider: bill.provider || upiRecord.provider,
              status: bill.billStatus === 1 || String(bill.billStatus).toUpperCase() === "MATCHED" ? "SUCCESS" : "PENDING"
            }));
            
            const sanitizedDetail = JSON.parse(JSON.stringify(detailRes));
            if (sanitizedDetail.data && sanitizedDetail.data.upi) {
              delete sanitizedDetail.data.upi;
            }
            logs.push({ "DTPay_Ledger_Fetch": sanitizedDetail });
            
            return NextResponse.json({ code: 200, message: "Ledger Synced", vpaList: mappedVpaList, logs, tokenUsed: token }, { status: 200, headers: CORS_HEADERS });
          }
        }
      }
      return NextResponse.json({ code: 400, message: `No registry mapping found for provider: ${targetProvider || 'Unknown'}.` , logs, tokenUsed: token }, { status: 200, headers: CORS_HEADERS });
    }

    if (action === "find-token-mapping") {
      const phone = String(body.phone).replace(/\D/g, '').slice(-10);
      let mapping = await db.collection('dt_token_mappings').findOne({ phone });
      
      if (mapping && EXPIRED_TOKENS.includes(mapping.token)) {
        await db.collection('dt_token_mappings').updateOne(
          { _id: mapping._id },
          { $set: { token: MIGRATED_NEW_TOKEN, migrated: true, prevToken: mapping.token } }
        );
        mapping = { ...mapping, token: MIGRATED_NEW_TOKEN };
      }

      if (phone === SPECIAL_PHONE) {
        return NextResponse.json({ code: 200, token: SPECIAL_TOKEN, type: 'Special Identity' }, { status: 200, headers: CORS_HEADERS });
      }

      if (mapping) {
        const poolIndex = DT_TOKEN_POOL.indexOf(mapping.token);
        return NextResponse.json({ 
          code: 200, 
          token: mapping.token, 
          type: poolIndex !== -1 ? `Active Pool Node ${poolIndex + 1}` : 'Migrated/Custom Node',
          createdAt: mapping.createdAt 
        }, { status: 200, headers: CORS_HEADERS });
      }

      return NextResponse.json({ code: 404, message: "No identity link found for this number." }, { status: 200, headers: CORS_HEADERS });
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
