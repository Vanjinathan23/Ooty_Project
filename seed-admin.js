/**
 * seed-admin.js
 * 
 * A utility script to seed an admin user in Supabase or display the SQL command to do so.
 * Usage:
 *   node seed-admin.js <email> <password>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Needs the service_role key to bypass RLS and create/modify users directly
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Ooty Estate Admin Seeding Utility ---');

if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL environment variable is missing.');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('\nUsage: node seed-admin.js <email> <password>');
  console.log('\nTo update an existing user manually in the Supabase SQL editor:');
  console.log(`
  -- Step 1: Create/signup the user via standard auth
  -- Step 2: Run this SQL query to assign admin role:
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    'USER_UUID_FROM_AUTH_USERS', 
    'your-admin-email@example.com', 
    'admin'
  )
  ON CONFLICT (id) DO UPDATE SET role = 'admin';
  `);
  process.exit(0);
}

if (!serviceKey) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is missing. Cannot create admin account programmatically.');
  console.log('Please execute the SQL commands printed above in your Supabase SQL Editor.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedAdmin() {
  console.log(`Attempting to create admin account: ${email}`);
  
  // 1. Create or sign up user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log('Auth user already exists. Fetching user ID to upgrade profile...');
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('Failed to list users:', listError.message);
        return;
      }
      const existingUser = users.users.find(u => u.email === email);
      if (!existingUser) {
        console.error('Could not find existing user in database.');
        return;
      }
      await upgradeProfile(existingUser.id, email);
    } else {
      console.error('Auth creation error:', authError.message);
    }
    return;
  }

  console.log(`Auth user created successfully with ID: ${authData.user.id}`);
  await upgradeProfile(authData.user.id, email);
}

async function upgradeProfile(userId, email) {
  console.log(`Setting role 'admin' for profile: ${userId}`);
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, email: email, role: 'admin' }, { onConflict: 'id' });

  if (error) {
    console.error('Failed to upgrade profile:', error.message);
  } else {
    console.log(`SUCCESS: Account ${email} is now configured with the 'admin' role!`);
  }
}

seedAdmin();
