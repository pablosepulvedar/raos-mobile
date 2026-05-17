import { Tabs, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, Text } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function TabsLayout() {

  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/')
      }
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    try {
      console.log('[Logout] Iniciando cierre de sesión')
      
      // Intenta cerrar sesión, pero no espera si hay error de red
      const logoutPromise = supabase.auth.signOut({
        scope: 'local'
      })
      
      // Timeout de 3 segundos
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 3000)
      )
      
      try {
        await Promise.race([logoutPromise, timeoutPromise])
        console.log('[Logout] Sesión cerrada exitosamente')
      } catch (timeoutError) {
        console.log('[Logout] Timeout o error en logout, continuando igual')
      }
      
      console.log('[Logout] Redirigiendo al login')
      // Siempre redirige, sin importar si el logout funcionó o no
      setTimeout(() => {
        router.replace('/')
      }, 100)
    } catch (error: any) {
      console.error('[Logout] Error inesperado:', error.message)
      console.log('[Logout] Forzando redirección al login')
      router.replace('/')
    }
  }

  if (loading) return null

  const LogoutButton = () => (
    <Pressable onPress={handleLogout} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <Text style={{ color: '#007AFF', fontWeight: '600' }}>
        Cerrar sesión
      </Text>
    </Pressable>
  )

  return (
    <Tabs screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#000' },
      headerTintColor: '#fff'
    }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', headerRight: LogoutButton }} />
      <Tabs.Screen name="usuarios" options={{ title: 'Usuarios', headerRight: LogoutButton, href: null }} />
      <Tabs.Screen name="reservas" options={{ title: 'Reservas', headerRight: LogoutButton, href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  )

}