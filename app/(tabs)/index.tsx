import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [userName, setUserName] = useState('Usuario')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('[Home] Obteniendo usuario actual')
        const { data, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('[Home] Error al obtener usuario:', error)
          return
        }
        
        if (data.user) {
          console.log('[Home] Usuario encontrado:', data.user.id)
          setUser(data.user as any)
          
          // Traer nombre desde tabla perfiles
          const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('nombre')
            .eq('id', data.user.id)
            .single()
          
          if (profileError) {
            console.log('[Home] Perfil no encontrado:', profileError.message)
          }
          
          if (profile?.nombre) {
            console.log('[Home] Nombre del perfil:', profile.nombre)
            setUserName(profile.nombre)
          } else {
            console.log('[Home] Usando email como nombre')
            setUserName(data.user.email?.split('@')[0] || 'Usuario')
          }
        }
      } catch (error: any) {
        console.error('[Home] Error inesperado:', error)
      }
    }
    
    fetchUser()
  }, [])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#1e5a96', paddingTop: 40, paddingBottom: 30, paddingHorizontal: 20 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 5 }}>
          Bienvenido
        </Text>
        <Text style={{ color: '#b0d4f1', fontSize: 16 }}>
          {userName}
        </Text>
      </View>

      {/* Menu */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 30 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e5a96', marginBottom: 15 }}>
          Menú
        </Text>

        {/* Usuarios */}
        <Pressable
          onPress={() => router.push('/(tabs)/usuarios')}
          style={{
            backgroundColor: '#4fa3ff',
            paddingVertical: 18,
            paddingHorizontal: 20,
            borderRadius: 12,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3.84,
            elevation: 5
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            👥 Usuarios
          </Text>
          <Text style={{ color: '#e8f0f7', fontSize: 12, marginTop: 4 }}>
            Agregar y gestionar usuarios
          </Text>
        </Pressable>

        {/* Reservas */}
        <Pressable
          onPress={() => router.push('/(tabs)/reservas')}
          style={{
            backgroundColor: '#ffd700',
            paddingVertical: 18,
            paddingHorizontal: 20,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3.84,
            elevation: 5
          }}
        >
          <Text style={{ color: '#1e5a96', fontSize: 16, fontWeight: '700' }}>
            📅 Reservas
          </Text>
          <Text style={{ color: '#154a7a', fontSize: 12, marginTop: 4 }}>
            Ver y gestionar reservas
          </Text>
        </Pressable>

        {/* Pilotos */}
        <Pressable
          onPress={() => router.push('/pilotos')}
          style={{
            backgroundColor: '#34a853',
            paddingVertical: 18,
            paddingHorizontal: 20,
            borderRadius: 12,
            marginTop: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3.84,
            elevation: 5
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            ✈️ Pilotos
          </Text>
          <Text style={{ color: '#e7f5ea', fontSize: 12, marginTop: 4 }}>
            Ver y gestionar pilotos
          </Text>
        </Pressable>

        {/* Varios */}
        <Pressable
          onPress={() => router.push('/varios')}
          style={{
            backgroundColor: '#6f42c1',
            paddingVertical: 18,
            paddingHorizontal: 20,
            borderRadius: 12,
            marginTop: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3.84,
            elevation: 5
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            ⚙️ Varios
          </Text>
          <Text style={{ color: '#e9ddf6', fontSize: 12, marginTop: 4 }}>
            Accede a horarios y valores
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}