import AfricasTalking from 'africastalking';

let _at: any;
let _sms: any;

function getSms() {
  if (!_sms) {
    _at = AfricasTalking({
      apiKey: process.env.AT_API_KEY || 'dummy',
      username: process.env.AT_USERNAME || 'sandbox',
    });
    _sms = _at.SMS;
  }
  return _sms;
}

export interface SendSmsOptions {
  to: string | string[];  // Phone number(s) in international format, e.g. "+265999123456"
  message: string;
  senderId?: string;      // Optional — defaults to AT_SENDER_ID from env
}

export async function sendSms({ to, message, senderId }: SendSmsOptions) {
  const recipients = Array.isArray(to) ? to : [to];
  const from = senderId || process.env.AT_SENDER_ID || 'Sandbox';

  try {
    const sendOptions: any = { to: recipients, message };
    if (from && from !== 'Sandbox') sendOptions.from = from;

    const result = await getSms().send(sendOptions);

    return { success: true, result };
  } catch (error) {
    console.error('Error sending SMS via Africa\'s Talking:', error);
    return { success: false, error };
  }
}

/**
 * Handles an incoming USSD session request from Africa's Talking.
 * Returns a USSD response string. Prefix with "CON " to continue, "END " to end the session.
 */
export function handleUssdSession(
  sessionId: string,
  phoneNumber: string,
  text: string
): string {
  const parts = text.split('*').filter(Boolean);
  const level = parts.length;

  // Level 0: Main menu
  if (level === 0) {
    return `CON Welcome to VSLA Connect (Malawi)
1. Check Balances & Status
2. Deposit via Mobile Money
3. Apply for Emergency Loan
4. Next Meeting & Share-Out
5. Group Health Score
6. Support & Helpline
0. Exit`;
  }

  // Level 1: First selection
  const choice = parts[0];

  if (choice === '1') {
    return `END VSLA Connect Status:
Savings: MWK 45,000 (APPROVED)
Active Loan: MWK 15,000 (Repaying)
Group: InclusionX VSLA
Log in at app.vslaconnect.mw for full breakdown.`;
  }

  if (choice === '2') {
    if (level === 1) {
      return `CON Enter Contribution Amount (MWK):`;
    }
    if (level === 2) {
      const amt = parts[1];
      return `CON Select Mobile Money Operator:
1. Airtel Money (+26599/98)
2. TNM Mpamba (+26588/31)
3. Cash (Pay to Treasurer)`;
    }
    if (level === 3) {
      const amt = parts[1];
      const op = parts[2] === '1' ? 'Airtel Money' : parts[2] === '2' ? 'TNM Mpamba' : 'Cash';
      if (parts[2] === '3') {
        return `END Cash contribution of MWK ${amt} recorded as PENDING. Please hand physical cash to your Treasurer for approval.`;
      }
      return `END A prompt for MWK ${amt} via ${op} has been initiated to ${phoneNumber}. Enter your PIN on phone to confirm.`;
    }
  }

  if (choice === '3') {
    if (level === 1) {
      return `CON Emergency Loan Request
Enter requested loan amount in MWK (Max: 3x your savings):`;
    }
    if (level === 2) {
      const amt = parts[1];
      return `CON Enter Reason for Loan:
1. Agriculture / Farming Inputs
2. Business Stock / Trading
3. Medical / Emergency
4. School Fees`;
    }
    if (level === 3) {
      const amt = parts[1];
      return `END Loan request for MWK ${amt} submitted to committee! You will receive an SMS notification once officers vote.`;
    }
  }

  if (choice === '4') {
    return `END Next VSLA Assembly:
Date: Sunday, 2 August 2026 at 2:00 PM
Venue: Community Hall / Kwa Manga
Agenda: Monthly share purchases & voting.`;
  }

  if (choice === '5') {
    return `END InclusionX VSLA Health Rating:
Composite Rating: 85/100 (AA High Liquidity)
Bank Loan Eligible: YES
Interest Subsidy Tier: Tier 1`;
  }

  if (choice === '6') {
    return `END VSLA Connect Helpline:
WhatsApp / Call: +265 991 000 000
Email: support@finovate.mw
Toll-Free SMS: 265`;
  }

  if (choice === '0') {
    return `END Thank you for using VSLA Connect. Save together, grow together!`;
  }

  return `END Invalid option. Please dial *384*265# to start again.`;
}
