import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { supabase } from '../../../lib/supabase'

export default function Roles() {
  const router = useRouter()
  const [roles, setRoles] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los roles')
      } else {
        setRoles(data || [])
      }
    } catch {
      Alert.alert('Error', 'Ocurrió un error al cargar los roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const resetForm = () => {
    setNombre('')
    setEditingId(null)
  }

  useFocusEffect(
    useCallback(() => {
      resetForm()
      return () => {}
    }, [])
  )

  const saveRol = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del rol')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('roles')
          .update({ nombre: nombre.trim() })
          .eq('id', editingId)

        if (error) {
          throw error
        }
        Alert.alert('Actualizado', 'Rol actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('roles')
          .insert({ nombre: nombre.trim() })

        if (error) {
          throw error
        }
        Alert.alert('Creado', 'Rol agregado correctamente')
      }
      resetForm()
      await fetchRoles()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el rol')
    } finally {
      setSaving(false)
    }
  }

  const editRol = (item: any) => {
    setNombre(item.nombre || '')
    setEditingId(item.id)
  }

  const deleteRol = async (item: any) => {
    Alert.alert('Eliminar rol', `¿Eliminar el rol "${item.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('roles')
              .delete()
              .eq('id', item.id)

            if (error) {
              throw error
            }
            if (editingId === item.id) {
              resetForm()
            }
            fetchRoles()
          } catch (error: any) {
            Alert.alert(
              'Error',
              error.message?.includes('foreign key')
                ? 'No se puede eliminar: el rol está asignado a usuarios'
                : 'No se pudo eliminar el rol'
            )
          }
        }
      }
    ])
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{ backgroundColor: '#fff', paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} style={{ paddingRight: 10 }}>
          <Text style={{ color: '#3c1361', fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={{ color: '#3c1361', fontSize: 24, fontWeight: '700' }}>
          🛡️ Roles
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#333', fontSize: 16, marginBottom: 8 }}>
            Roles existentes
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color="#3c1361" />
          ) : roles.length === 0 ? (
            <Text style={{ color: '#666' }}>No hay roles registrados.</Text>
          ) : (
            roles.map((item) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#e4d8ff',
                  padding: 14,
                  marginBottom: 10
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#3c1361' }}>
                      {item.nombre}
                    </Text>
                    <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                      Creado: {item.created_at ? new Date(item.created_at).toLocaleString() : '---'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => editRol(item)}
                      style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#6f42c1' }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Editar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deleteRol(item)}
                      style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#d9534f' }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Borrar</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e4d8ff' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#3c1361', marginBottom: 10 }}>
            {editingId ? 'Editar rol' : 'Agregar rol'}
          </Text>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#1e5a96', fontWeight: '700', marginBottom: 6 }}>Nombre</Text>
            <TextInput
              placeholder="admin, piloto, recepción..."
              value={nombre}
              onChangeText={setNombre}
              style={{
                backgroundColor: '#fff',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#d3c0ff'
              }}
            />
          </View>

          <Pressable
            onPress={saveRol}
            disabled={saving}
            style={{
              backgroundColor: '#6f42c1',
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {saving ? 'Guardando...' : editingId ? 'Actualizar rol' : 'Agregar rol'}
            </Text>
          </Pressable>

          {editingId && (
            <Pressable
              onPress={resetForm}
              style={{
                marginTop: 12,
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: '#f0f0f0'
              }}
            >
              <Text style={{ color: '#3c1361', fontWeight: '700' }}>Cancelar edición</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 20,
            backgroundColor: '#6f42c1',
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Volver</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
