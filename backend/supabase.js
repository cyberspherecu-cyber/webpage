const { createClient } = require('@supabase/supabase-js');

// Supabase project credentials — set via SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// in the environment (Render dashboard or backend/.env locally). The service
// role key bypasses Row Level Security, which is what the admin CRUD API needs.
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

if (!supabaseConfigured) {
  console.warn('⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — Supabase features are disabled. Set them in your .env / hosting env vars.');
}

// Only construct the client when credentials are present — createClient throws
// on an empty URL, and without credentials the app falls back to local storage.
const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

// Public bucket where all uploaded files live (gallery, event covers, team
// photos, challenge files). Public buckets are served directly by Supabase CDN.
const BUCKET = 'uploads';

// Converts a storage path like "gallery/123.png" into its public URL.
function publicStorageUrl(storagePath) {
  const clean = String(storagePath).replace(/^\/+/, '');
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${clean}`;
}

// Inverse of publicStorageUrl: extracts the storage path from a stored URL.
// Returns null if the URL isn't one of ours.
function storagePathFromUrl(url) {
  if (!url) return null;
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

// Ensures the uploads bucket exists (idempotent — errors on "already exists"
// are ignored). Call once at startup.
async function ensureBucket() {
  if (!supabaseConfigured) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message || '')) {
    console.warn(`⚠️  Could not create storage bucket "${BUCKET}":`, error.message);
  }
}

module.exports = {
  supabase,
  supabaseConfigured,
  BUCKET,
  publicStorageUrl,
  storagePathFromUrl,
  ensureBucket,
};
