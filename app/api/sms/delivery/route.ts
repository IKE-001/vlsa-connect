import { NextResponse } from 'next/server';

/**
 * Africa's Talking SMS Delivery Report Callback
 * Africa's Talking POSTs delivery status updates here.
 * Docs: https://developers.africastalking.com/docs/sms/sending
 *
 * Registered URL: https://vlsa-connect.vercel.app/api/sms/delivery
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const id = formData.get('id') as string;
    const status = formData.get('status') as string; // "Success" | "Failed" | "Buffered"
    const phoneNumber = formData.get('phoneNumber') as string;
    const networkCode = formData.get('networkCode') as string;
    const failureReason = formData.get('failureReason') as string | null;

    console.log('[SMS Delivery Report]', { id, status, phoneNumber, networkCode, failureReason });

    // TODO: Update the Notification record in the DB to SENT or FAILED
    // e.g. await db.notification.updateMany({ where: { ... }, data: { status: ... } })

    // Africa's Talking requires a 200 response to acknowledge receipt
    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('[SMS Delivery Report] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
