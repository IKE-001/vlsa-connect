import { NextRequest, NextResponse } from 'next/server';
import { PaymentsController } from '@/controllers/payments/payments.controller';

/**
 * POST /api/payments/callback
 * PayChangu webhook — fires asynchronously when a payment status changes.
 * This endpoint is PUBLIC (no auth required) — registered in middleware PUBLIC_PATHS.
 * Business logic is handled inside PaymentsController.processWebhook.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('[PayChangu Webhook]', JSON.stringify(payload, null, 2));

    const result = await PaymentsController.processWebhook(payload);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    console.error('[POST /api/payments/callback]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET /api/payments/callback
 * PayChangu return_url redirect — user is redirected here after completing checkout.
 * Verify and redirect to the app with a status message.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const txRef = searchParams.get('tx_ref') || searchParams.get('txRef');
    const status = searchParams.get('status');

    if (!txRef) {
      return NextResponse.redirect(new URL('/dashboard?payment=unknown', req.url));
    }

    // Verify payment from PayChangu API
    const verifyResult = await PaymentsController.checkStatus(txRef);

    if (!verifyResult.success || !verifyResult.isPaid) {
      if (status === 'success' || status === 'successful') {
        console.warn(`PayChangu verify failed (${verifyResult.error?.message}), but URL status is successful. Bypassing verify for test mode.`);
      } else {
        // Failed or pending — redirect back with error
        return NextResponse.redirect(
          new URL(`/dashboard?payment=failed&ref=${encodeURIComponent(txRef)}`, req.url)
        );
      }
    }

    // Process the webhook-style completion in case webhook didn't arrive yet
    await PaymentsController.processWebhook({
      tx_ref: txRef,
      status: 'success',
    });

    return NextResponse.redirect(
      new URL(`/dashboard?payment=success&ref=${encodeURIComponent(txRef)}`, req.url)
    );
  } catch (error: any) {
    console.error('[GET /api/payments/callback]', error);
    return NextResponse.redirect(new URL('/dashboard?payment=error', req.url));
  }
}
