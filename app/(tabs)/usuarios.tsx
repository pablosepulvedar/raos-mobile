import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function Usuarios() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      console.log('[Usuarios] Buscando usuarios')
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('[Usuarios] Error buscando:', error)
      } else {
        console.log('[Usuarios] Usuarios encontrados:', data?.length)
        if (data && data.length > 0) {
          data.forEach((u: any) => {
            console.log(`[Usuarios] - ${u.nombre} (ID: ${u.id.substring(0, 8)}...) activo=${u.activo}`)
          })
        }
        setUsuarios(data || [])
      }
    } catch (error: any) {
      console.error('[Usuarios] Error:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchUsuarios()
    setRefreshing(false)
  }

  const resetForm = () => {
    setNombre('')
    setEmail('')
    setPassword('')
    setShowForm(false)
  }

  useFocusEffect(
    useCallback(() => {
      resetForm()
      return () => {}
    }, [])
  )

  const toggleActivo = async (usuario: any) => {
    try {
      const nuevoEstado = !usuario.activo
      console.log('[Usuarios] TOGGLE: ID=', usuario.id)
      console.log('[Usuarios] TOGGLE: Nombre=', usuario.nombre)
      console.log('[Usuarios] TOGGLE: Estado anterior=', usuario.activo)
      console.log('[Usuarios] TOGGLE: Nuevo estado=', nuevoEstado)
      
      // Actualizar en Supabase - SIN .select() para evitar problemas de RLS
      console.log('[Usuarios] Enviando UPDATE a Supabase...')
      const { error, status, count } = await supabase
        .from('perfiles')
        .update({ activo: nuevoEstado })
        .eq('id', usuario.id)
      
      console.log('[Usuarios] UPDATE Status:', status)
      console.log('[Usuarios] UPDATE Count:', count)
      console.log('[Usuarios] UPDATE Error:', error)
      
      if (error) {
        console.error('[Usuarios] ❌ ERROR ACTUALIZANDO:', JSON.stringify(error))
        Alert.alert('Error', error.message || 'No se pudo cambiar el estado')
        return
      }
      
      if (status === 204 || status === 200) {
        console.log('[Usuarios] ✅ UPDATE EXITOSO en BD, refrescando lista...')
        // Refrescar la lista después de actualizar
        await fetchUsuarios()
      } else {
        console.log('[Usuarios] ⚠️ Status inesperado:', status)
      }
    } catch (error: any) {
      console.error('[Usuarios] ❌ ERROR INESPERADO:', error.message)
      console.error('[Usuarios] Stack:', error)
      Alert.alert('Error', 'Ocurrió un error al cambiar el estado')
    }
  }

  const confirmEliminarUsuario = (usuario: any) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Estás seguro de que deseas eliminar a ${usuario.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminarUsuario(usuario) }
      ]
    )
  }

  const eliminarUsuario = async (usuario: any) => {
    try {
      setDeletingId(usuario.id)
      console.log('[Usuarios] Eliminando usuario:', usuario.id)
      const { error, status, count } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', usuario.id)

      console.log('[Usuarios] DELETE Status:', status)
      console.log('[Usuarios] DELETE Count:', count)
      console.log('[Usuarios] DELETE Error:', error)

      if (error) {
        console.error('[Usuarios] ❌ ERROR ELIMINANDO:', JSON.stringify(error))
        Alert.alert('Error', error.message || 'No se pudo eliminar el usuario')
        return
      }

      if (status === 204 || status === 200) {
        console.log('[Usuarios] ✅ Eliminación exitosa, refrescando lista...')
        await fetchUsuarios()
      } else {
        console.log('[Usuarios] ⚠️ Status inesperado en delete:', status)
      }
    } catch (error: any) {
      console.error('[Usuarios] ❌ ERROR INESPERADO ELIMINANDO:', error)
      Alert.alert('Error', 'Ocurrió un error al eliminar el usuario')
    } finally {
      setDeletingId(null)
    }
  }

  const crearUsuario = async () => {
    if (!nombre || !email || !password) {
      Alert.alert('Error', 'Completa todos los campos')
      return
    }

    setLoading(true)
    try {
      console.log('[Usuarios] Iniciando creación de usuario:', email)
      
      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      console.log('[Usuarios] Respuesta auth:', { authData, authError })

      if (authError) {
        console.error('[Usuarios] Error en signUp:', authError.message)
        Alert.alert('Error Auth', authError.message)
        setLoading(false)
        return
      }

      // Crear perfil - Intentar con diferentes nombres de columna
      if (authData.user) {
        console.log('[Usuarios] Creando perfil para user_id:', authData.user.id)
        
        // Intenta primero con 'id' como columna principal
        const { data: profileData, error: profileError } = await supabase
          .from('perfiles')
          .insert({
            id: authData.user.id,
            nombre,
            activo: true
          })
          .select()

        console.log('[Usuarios] Respuesta perfil:', { profileData, profileError })

        if (profileError) {
          console.error('[Usuarios] Error al crear perfil:', profileError)
          console.log('[Usuarios] Mensaje exacto del error:', profileError.message)
          Alert.alert('Error Perfil', 'El campo de la tabla podría llamarse diferente. Verifica en Supabase qué columnas tiene exactamente la tabla perfiles.')
        } else {
          console.log('[Usuarios] Usuario creado exitosamente')
          Alert.alert('Éxito', 'Usuario creado correctamente')
          setNombre('')
          setEmail('')
          setPassword('')
          setShowForm(false)
          fetchUsuarios()
        }
      }
    } catch (error: any) {
      console.error('[Usuarios] Error inesperado:', error)
      Alert.alert('Error', error.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f8f9fa' }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4fa3ff" />
      }
    >
      {/* Header */}
      <View style={{ backgroundColor: '#4fa3ff', paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} style={{ paddingRight: 10 }}>
          <Text style={{ color: '#fff', fontSize: 24 }}>← Volver</Text>
        </Pressable>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
          👥 Usuarios
        </Text>
      </View>

      {/* Botón agregar */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 15 }}>
        <Pressable
          onPress={() => {
            setNombre('')
            setEmail('')
            setPassword('')
            setShowForm(!showForm)
          }}
          style={{
            backgroundColor: '#1e5a96',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
            {showForm ? 'Cancelar' : '+ Agregar Usuario'}
          </Text>
        </Pressable>
      </View>

      {/* Formulario */}
      {showForm && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#e8f0f7', marginHorizontal: 20, borderRadius: 8, padding: 15 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e5a96', marginBottom: 12 }}>
            Nuevo Usuario
          </Text>

          <TextInput
            placeholder="Nombre"
            value={nombre}
            onChangeText={setNombre}
            style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 8,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#4fa3ff'
            }}
          />

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 8,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#4fa3ff'
            }}
          />

          <TextInput
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#4fa3ff'
            }}
          />

          <Pressable
            onPress={crearUsuario}
            disabled={loading}
            style={{
              backgroundColor: '#ffd700',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#1e5a96', fontSize: 14, fontWeight: '700' }}>
              {loading ? 'Creando...' : 'Crear Usuario'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Lista de usuarios */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e5a96', marginBottom: 12 }}>
          {usuarios.length} usuarios registrados
        </Text>

        {usuarios.map((usuario) => (
          <View
            key={usuario.id}
            style={{
              backgroundColor: '#fff',
              padding: 15,
              borderRadius: 8,
              marginBottom: 10,
              borderLeftWidth: 4,
              borderLeftColor: usuario.activo ? '#4fa3ff' : '#ccc',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e5a96' }}>
                {usuario.nombre}
              </Text>
              <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {usuario.activo ? '✅ Activo' : '❌ Inactivo'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Switch
                value={usuario.activo}
                onValueChange={() => toggleActivo(usuario)}
                thumbColor={usuario.activo ? '#4fa3ff' : '#ccc'}
                trackColor={{ false: '#ddd', true: '#b0d4f1' }}
              />
              <Pressable
                onPress={() => confirmEliminarUsuario(usuario)}
                disabled={deletingId === usuario.id}
                style={{
                  marginLeft: 10,
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: '#ffe5e5',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#d11a2a', fontWeight: '700', fontSize: 16 }}>
                  {deletingId === usuario.id ? '...' : '🗑️'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}

        {usuarios.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#4fa3ff" />
            <Text style={{ color: '#999', fontSize: 14, marginTop: 10 }}>
              No hay usuarios registrados
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
