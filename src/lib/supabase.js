import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ykoupyvgfxdgeunobgcp.supabase.co';
const SUPABASE_ANON_KEY = 
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrb3VweXZnZnhkZ2V1bm9iZ2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjM5MTEsImV4cCI6MjA5MzA5OTkxMX0.6VhINLpwmgg_5jxkMB7h9fqEWhho8QxVcu8kLIXGcyo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
