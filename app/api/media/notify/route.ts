import { NextResponse } from 'next/server';

/**
 * Cloudinary Upload Notification Webhook
 * Cloudinary POSTs upload completion events here.
 * Docs: https://cloudinary.com/documentation/notifications
 *
 * Registered URL: https://vlsa-connect.vercel.app/api/media/notify
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { public_id, secure_url, resource_type, notification_type } = body;

    console.log('[Cloudinary Notification]', { public_id, secure_url, resource_type, notification_type });

    // notification_type can be "upload", "delete", "moderation" etc.
    // For now, just acknowledge receipt. Extend here to update user avatarUrl in DB.

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('[Cloudinary Notification] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
