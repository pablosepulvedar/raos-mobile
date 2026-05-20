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
        const { data, error } = await supabase.auth.getUser()
        if (error || !data.user) return

        setUser(data.user as any)

        const { data: profile } = await supabase
          .from('perfiles')
          .select('nombre')
          .eq('id', data.user.id)
          .single()

        if (profile?.nombre) {
          setUserName(profile.nombre)
        } else {
          setUserName(data.user.email?.split('@')[0] || 'Usuario')
        }
      } catch {
        // Sin acción: se muestra "Usuario" por defecto
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

        {/* Pago pilotos */}
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
            💵 Pago pilotos
          </Text>
          <Text style={{ color: '#e7f5ea', fontSize: 12, marginTop: 4 }}>
            Ver y gestionar pagos de pilotos
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
            Horarios, valores y roles
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}