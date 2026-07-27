import { PaymentsController } from './controllers/payments/payments.controller';

async function main() {
  const txRef = 'contrib-af9f55a0-10b5-44e7-ba87-cf18efd44806-1785124815796';
  console.log(`Processing webhook manually for: ${txRef}`);
  
  const result = await PaymentsController.processWebhook({
    tx_ref: txRef,
    status: 'success'
  });
  
  console.log('Result:', result);
}

main().catch(console.error);
