import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://naxdteshucafrelbuupc.supabase.co'
const supabaseKey = 'sb_publishable_HjWK57G8yL7BERGMnizbeg_sCiD8iLH'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)