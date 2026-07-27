import { PaymentsController } from './controllers/payments/payments.controller';

async function main() {
  const txs = [
    'contrib-a6a1d0a4-f119-411b-a74f-6c624009216e-1785126398901',
    'contrib-37a30aa4-67c0-4875-bec8-a87ef6925c7e-1785126060340'
  ];
  
  for (const tx of txs) {
    console.log(`Processing webhook manually for: ${tx}`);
    const result = await PaymentsController.processWebhook({
      tx_ref: tx,
      status: 'success'
    });
    console.log('Result:', result);
  }
}

main().catch(console.error);
