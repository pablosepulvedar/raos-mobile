import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { supabase } from '../../../lib/supabase'

const formatHorario = (value: number | string) => {
  if (value === null || value === undefined) return ''
  const horario = String(value).padStart(4, '0')
  return `${horario.slice(0, 2)}:${horario.slice(2)}`
}

const parseHorario = (hour: string, minute: string) => {
  if (!hour || !minute) return null
  const h = hour.padStart(2, '0')
  const m = minute.padStart(2, '0')

  if (Number(h) > 23 || Number(m) > 59) return null
  return `${h}${m}`
}

export default function Horarios() {
  const router = useRouter()
  const [horarios, setHorarios] = useState<any[]>([])
  const [hour, setHour] = useState('12')
  const [minute, setMinute] = useState('00')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const fetchHorarios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('horarios')
        .select('*')
        .order('horario', { ascending: true })

      if (error) {
        console.error('[Horarios] Error fetching:', error)
        Alert.alert('Error', 'No se pudieron cargar los horarios')
      } else {
        setHorarios(data || [])
      }
    } catch (error: any) {
      console.error('[Horarios] Unexpected error:', error)
      Alert.alert('Error', 'Ocurrió un error al cargar los horarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHorarios()
  }, [])

  const resetForm = () => {
    setHour('12')
    setMinute('00')
    setEditingId(null)
  }

  useFocusEffect(
    useCallback(() => {
      resetForm()
      return () => {}
    }, [])
  )

  const saveHorario = async () => {
    const horario = parseHorario(hour, minute)
    if (!horario) {
      Alert.alert('Error', 'Ingresa una hora válida de 00 a 23 y minutos de 00 a 59')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('horarios')
          .update({ horario: Number(horario) })
          .eq('id', editingId)

        if (error) {
          throw error
        }
        Alert.alert('Actualizado', 'El horario se actualizó correctamente')
      } else {
        const { error } = await supabase
          .from('horarios')
          .insert({ horario: Number(horario) })

        if (error) {
          throw error
        }
        Alert.alert('Creado', 'Horario agregado correctamente')
      }
      resetForm()
      await fetchHorarios()
    } catch (error: any) {
      console.error('[Horarios] Save error:', error)
      Alert.alert('Error', error.message || 'No se pudo guardar el horario')
    } finally {
      setSaving(false)
    }
  }

  const editHorario = (item: any) => {
    const raw = String(item.horario).padStart(4, '0')
    setHour(raw.slice(0, 2))
    setMinute(raw.slice(2))
    setEditingId(item.id)
  }

  const deleteHorario = async (item: any) => {
    Alert.alert('Eliminar horario', `¿Eliminar ${formatHorario(item.horario)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('horarios')
              .delete()
              .eq('id', item.id)

            if (error) {
              throw error
            }
            fetchHorarios()
          } catch (error: any) {
            console.error('[Horarios] Delete error:', error)
            Alert.alert('Error', 'No se pudo eliminar el horario')
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
          🕒 Horarios
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#333', fontSize: 16, marginBottom: 8 }}>
            Lista de horarios guardados
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color="#3c1361" />
          ) : horarios.length === 0 ? (
            <Text style={{ color: '#666' }}>No hay horarios registrados.</Text>
          ) : (
            horarios.map((item) => (
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
                      {formatHorario(item.horario)}
                    </Text>
                    <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                      Creado: {item.created_at ? new Date(item.created_at).toLocaleString() : '---'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => deleteHorario(item)}
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
            {editingId ? 'Editar horario' : 'Agregar horario'}
          </Text>

          <View style={{ flexDirection: 'row', columnGap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#1e5a96', fontWeight: '700', marginBottom: 6 }}>Hora</Text>
              <TextInput
                placeholder="12"
                value={hour}
                onChangeText={(text) => setHour(text.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="numeric"
                maxLength={2}
                style={{
                  backgroundColor: '#fff',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#d3c0ff'
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#1e5a96', fontWeight: '700', marginBottom: 6 }}>Minutos</Text>
              <TextInput
                placeholder="00"
                value={minute}
                onChangeText={(text) => setMinute(text.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="numeric"
                maxLength={2}
                style={{
                  backgroundColor: '#fff',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#d3c0ff'
                }}
              />
            </View>
          </View>

          <Pressable
            onPress={saveHorario}
            disabled={saving}
            style={{
              backgroundColor: '#6f42c1',
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {saving ? 'Guardando...' : editingId ? 'Actualizar horario' : 'Agregar horario'}
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
