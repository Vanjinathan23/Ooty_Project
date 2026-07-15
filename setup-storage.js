import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  console.log('--- Setting up Supabase Storage Buckets ---');

  const buckets = ['property-images', 'property-documents'];

  for (const bucket of buckets) {
    console.log(`Checking bucket: ${bucket}...`);
    const { data: existingBucket, error: getError } = await supabase.storage.getBucket(bucket);
    
    if (existingBucket) {
      console.log(`Bucket '${bucket}' already exists.`);
    } else {
      console.log(`Creating bucket '${bucket}'...`);
      const { data, error } = await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: bucket === 'property-images' ? ['image/*'] : ['application/pdf'],
      });

      if (error) {
        console.error(`Failed to create bucket '${bucket}':`, error.message);
      } else {
        console.log(`Successfully created public bucket '${bucket}'.`);
      }
    }
  }
  
  console.log('\nNOTE: Storage RLS Policies still need to be created via the SQL Editor.');
  console.log('Please run the SQL provided in the walkthrough to secure your buckets.');
  console.log('--- Setup Complete ---');
}

setupStorage();
