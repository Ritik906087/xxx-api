
import { NextResponse } from 'next/server';
import { runAutomation } from '@/app/actions/vantage-actions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, accountType } = body;
    
    const result = await runAutomation(phone, accountType);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ 
      code: 500, 
      message: error.message, 
      logs: [] 
    }, { status: 500 });
  }
}
