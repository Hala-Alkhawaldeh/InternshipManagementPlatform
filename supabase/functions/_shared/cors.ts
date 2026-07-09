// Shared CORS headers for all Edge Functions called directly from the browser
// (supabase.functions.invoke sends a preflight OPTIONS request because it adds
// an Authorization header — every function must answer OPTIONS and include
// these headers on every response, or the browser blocks the request before
// it even reaches the function's real logic).
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
