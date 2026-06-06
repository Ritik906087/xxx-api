
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, mobileNo, fullName } = body;

    if (!email || !mobileNo) {
      return errorResponse("Email and mobileNo are required", 400);
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ 
      $or: [{ email }, { mobileNo }] 
    });

    if (existingUser) {
      return errorResponse("User with this email or mobile number already exists", 409);
    }

    // Insert new user
    const newUser = {
      email,
      mobileNo,
      fullName: fullName || "Vantage User",
      createdAt: new Date().toISOString(),
      role: 'user',
      // In a real app, hash the password before saving!
      password: password || null 
    };

    const result = await usersCollection.insertOne(newUser);

    return jsonResponse({
      success: true,
      message: "User registered successfully",
      userId: result.insertedId,
      user: {
        email: newUser.email,
        mobileNo: newUser.mobileNo,
        fullName: newUser.fullName
      }
    }, 201);

  } catch (error: any) {
    return errorResponse("Registration Failed", 500, error.message);
  }
}
