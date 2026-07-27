import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log('Secret key loaded:', !!process.env.PAYCHANGU_SECRET_KEY);
