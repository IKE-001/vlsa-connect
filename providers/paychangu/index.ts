/**
 * PayChangu Payment Provider
 * Docs: https://paychangu.readme.io/reference
 *
 * All monetary amounts are in tambala (1 MWK = 100 tambala).
 * Convert to MWK (divide by 100) before sending to PayChangu which expects MWK.
 */

const BASE_URL = process.env.PAYCHANGU_BASE_URL || 'https://api.paychangu.com';
const SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vlsa-connect.vercel.app';
const CALLBACK_URL = process.env.PAYCHANGU_CALLBACK_URL || `${APP_URL}/api/payments/callback`;

export interface InitiatePaymentOptions {
  amountTambala: number;       // Amount in tambala — we convert to MWK internally
  currency?: string;           // Default: "MWK"
  email: string;               // Customer email
  firstName: string;
  lastName: string;
  txRef: string;               // Your unique transaction reference (e.g. UUID)
  callbackUrl?: string;        // Override default callback URL
  returnUrl?: string;          // Where to redirect after payment
  description?: string;
}

export interface VerifyPaymentOptions {
  txRef: string;               // The transaction reference you used when initiating
}

/**
 * Initiates a payment via PayChangu.
 * Returns a checkout URL to redirect the user to.
 */
export async function initiatePayment(options: InitiatePaymentOptions) {
  const amountMwk = options.amountTambala / 100; // Convert tambala → MWK

  const payload = {
    amount: amountMwk,
    currency: options.currency || 'MWK',
    email: options.email,
    first_name: options.firstName,
    last_name: options.lastName,
    callback_url: options.callbackUrl || CALLBACK_URL,
    return_url: options.returnUrl || CALLBACK_URL,
    tx_ref: options.txRef,
    customization: {
      title: 'VSLA Connect',
      description: options.description || 'VSLA Connect Payment',
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/payment`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return { success: false, error: data };
    }

    return {
      success: true,
      checkoutUrl: data?.data?.checkout_url,
      txRef: options.txRef,
      data,
    };
  } catch (error) {
    console.error('Error initiating PayChangu payment:', error);
    return { success: false, error };
  }
}

/**
 * Verifies the status of a payment using the transaction reference.
 */
export async function verifyPayment({ txRef }: VerifyPaymentOptions) {
  try {
    const response = await fetch(`${BASE_URL}/verify-payment/${txRef}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return { success: false, error: data };
    }

    const status = data?.data?.status; // "successful", "pending", "failed"

    return {
      success: true,
      status,
      isPaid: status === 'successful',
      data,
    };
  } catch (error) {
    console.error('Error verifying PayChangu payment:', error);
    return { success: false, error };
  }
}

/**
 * Fetches all supported mobile money operators from PayChangu.
 */
export async function getMobileMoneyOperators() {
  try {
    const response = await fetch(`${BASE_URL}/mobile-money`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
    });

    const data = await response.json() as any;
    if (!response.ok) {
      return { success: false, error: data };
    }

    return { success: true, operators: data?.data ?? [] };
  } catch (error) {
    console.error('Error getting mobile money operators:', error);
    return { success: false, error };
  }
}

/**
 * Initiates a Mobile Money payout/transfer via PayChangu.
 */
export async function initiateMobileMoneyPayout(options: {
  mobile: string;
  amountTambala: number;
  operatorRefId: string;
  chargeId: string;
}) {
  const amountMwk = options.amountTambala / 100;
  const payload = {
    mobile: options.mobile,
    amount: amountMwk,
    mobile_money_operator_ref_id: options.operatorRefId,
    charge_id: options.chargeId,
  };

  try {
    const response = await fetch(`${BASE_URL}/mobile-money/payouts/initialize`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as any;
    if (!response.ok) {
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error initiating PayChangu MM Payout:', error);
    return { success: false, error };
  }
}

/**
 * Fetches supported banks for payouts.
 */
export async function getSupportedBanks() {
  try {
    const response = await fetch(`${BASE_URL}/direct-charge/payouts/supported-banks?currency=MWK`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
    });

    const data = await response.json() as any;
    if (!response.ok) {
      return { success: false, error: data };
    }

    return { success: true, banks: data ?? [] };
  } catch (error) {
    console.error('Error getting supported banks:', error);
    return { success: false, error };
  }
}

/**
 * Initiates a Bank payout/transfer via PayChangu.
 */
export async function initiateBankPayout(options: {
  bankUuid: string;
  accountNumber: string;
  accountName: string;
  amountTambala: number;
  chargeId: string;
}) {
  const amountMwk = options.amountTambala / 100;
  const payload = {
    payout_method: 'bank_transfer',
    bank_uuid: options.bankUuid,
    bank_account_number: options.accountNumber,
    bank_account_name: options.accountName,
    amount: amountMwk,
    charge_id: options.chargeId,
  };

  try {
    const response = await fetch(`${BASE_URL}/direct-charge/payouts/initialize`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as any;
    if (!response.ok) {
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error initiating PayChangu Bank Payout:', error);
    return { success: false, error };
  }
}

