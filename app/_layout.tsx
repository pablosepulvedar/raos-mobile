import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import type { Session } from '@supabase/supabase-js'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/use-color-scheme'
import { supabase } from '@/lib/supabase'

const logAuth = (...args: unknown[]) => {
  console.log('[Auth]', ...args)
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      logAuth('getSession', { hasSession: !!initial })
      setSession(initial)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      logAuth('onAuthStateChange', { event, hasSession: !!nextSession })
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return null
  }

  const isLoggedIn = !!session

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="index" />
        </Stack.Protected>

        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>

        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal', headerShown: true }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
