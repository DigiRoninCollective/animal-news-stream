/**
 * Supabase Client Configuration
 *
 * This file initializes and exports the Supabase client for use throughout the application.
 * Make sure to set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.'
  );
}

// Create and export Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

module.exports = supabase;
