import { Tabs, usePathname, useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { LogoutButton } from '@/components/logout-button'
import { signOut } from '@/lib/auth'

function CustomTabBar() {
  const router = useRouter()
  const pathname = usePathname()
  const isHome =
    pathname === '/(tabs)' ||
    pathname === '/(tabs)/' ||
    pathname === '/(tabs)/index' ||
    pathname.endsWith('/index')

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
        paddingTop: 10,
        paddingBottom: 24
      }}
    >
      <Pressable
        onPress={() => router.push('/(tabs)/')}
        style={{ alignItems: 'center', minWidth: 72 }}
      >
        <IconSymbol name="house.fill" size={28} color={isHome ? '#1e5a96' : '#999'} />
        <Text
          style={{
            color: isHome ? '#1e5a96' : '#999',
            fontSize: 12,
            fontWeight: isHome ? '700' : '500',
            marginTop: 4
          }}
        >
          Inicio
        </Text>
      </Pressable>
    </View>
  )
}

export default function TabsLayout() {
  const [loggingOut, setLoggingOut] = useState(false)
  const loggingOutRef = useRef(false)

  const handleLogout = useCallback(async () => {
    if (loggingOutRef.current) return

    loggingOutRef.current = true
    setLoggingOut(true)
    console.log('[Auth] botón Cerrar sesión presionado')

    try {
      await signOut()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.log('[Auth] signOut error', message)
    } finally {
      loggingOutRef.current = false
      setLoggingOut(false)
    }
  }, [])

  const renderLogout = useCallback(
    () => <LogoutButton onPress={handleLogout} disabled={loggingOut} />,
    [handleLogout, loggingOut]
  )

  const hiddenTab = { href: null } as const

  return (
    <Tabs
      tabBar={() => <CustomTabBar />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff'
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', headerRight: renderLogout }} />
      <Tabs.Screen
        name="usuarios"
        options={{ title: 'Usuarios', headerRight: renderLogout, ...hiddenTab }}
      />
      <Tabs.Screen
        name="reservas"
        options={{ title: 'Reservas', headerRight: renderLogout, ...hiddenTab }}
      />
      <Tabs.Screen
        name="varios"
        options={{ title: 'Varios', headerRight: renderLogout, ...hiddenTab }}
      />
      <Tabs.Screen
        name="pilotos"
        options={{ title: 'Pago pilotos', headerRight: renderLogout, ...hiddenTab }}
      />
      <Tabs.Screen name="explore" options={hiddenTab} />
    </Tabs>
  )
}
