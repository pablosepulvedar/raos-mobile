import { supabase } from './supabase'

const logAuth = (...args: unknown[]) => {
  console.log('[Auth]', ...args)
}

/** Solo cierra sesión en Supabase. La navegación la maneja onAuthStateChange en app/_layout.tsx */
export async function signOut() {
  logAuth('signOut: inicio')

  const { data: before } = await supabase.auth.getSession()
  logAuth('signOut: sesión antes', {
    hasSession: !!before.session,
    userId: before.session?.user?.id
  })

  const { error } = await supabase.auth.signOut()
  logAuth('signOut: respuesta', { error: error?.message, code: error?.code })

  if (error) {
    logAuth('signOut: reintento scope local')
    await supabase.auth.signOut({ scope: 'local' })
  }

  const { data: after } = await supabase.auth.getSession()
  logAuth('signOut: sesión después', { hasSession: !!after.session })
}
