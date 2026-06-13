import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { passphrase } = await req.json();
    
    const rootPassphrase = process.env.ROOT_PASSPHRASE;
    const adminSecret = process.env.ADMIN_COOKIE_SECRET;
    
    if (rootPassphrase && adminSecret && passphrase === rootPassphrase) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('gg_root_access', adminSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 86400 // 24 hours
      });
      return response;
    }
    
    // Anti-brute force delay
    await new Promise(r => setTimeout(r, 1500));
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Bad Request' }, { status: 400 });
  }
}
