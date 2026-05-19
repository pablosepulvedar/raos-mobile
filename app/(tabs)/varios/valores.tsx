import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { supabase } from '../../../lib/supabase'

const formatCurrency = (value: number | string) => {
  const number = Number(value)
  if (Number.isNaN(number)) return ''
  return `$${number.toLocaleString('es-CL')}`
}

export default function Valores() {
  const router = useRouter()
  const [valores, setValores] = useState<any[]>([])
  const [servicio, setServicio] = useState('')
  const [monto, setMonto] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const fetchValores = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('valores')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('[Valores] Error fetching:', error)
        Alert.alert('Error', 'No se pudieron cargar los valores')
      } else {
        setValores(data || [])
      }
    } catch (error: any) {
      console.error('[Valores] Unexpected error:', error)
      Alert.alert('Error', 'Ocurrió un error al cargar los valores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchValores()
  }, [])

  const resetForm = () => {
    setServicio('')
    setMonto('')
    setEditingId(null)
  }

  useFocusEffect(
    useCallback(() => {
      resetForm()
      return () => {}
    }, [])
  )

  const saveValor = async () => {
    if (!servicio.trim() || !monto.trim()) {
      Alert.alert('Error', 'Completa el servicio y el monto')
      return
    }

    const numericMonto = Number(monto.replace(/[^0-9]/g, ''))
    if (Number.isNaN(numericMonto)) {
      Alert.alert('Error', 'El monto debe contener solo números')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('valores')
          .update({ servicio: servicio.trim(), monto: numericMonto })
          .eq('id', editingId)

        if (error) {
          throw error
        }
        Alert.alert('Actualizado', 'Valor actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('valores')
          .insert({ servicio: servicio.trim(), monto: numericMonto })

        if (error) {
          throw error
        }
        Alert.alert('Creado', 'Valor agregado correctamente')
      }
      resetForm()
      await fetchValores()
    } catch (error: any) {
      console.error('[Valores] Save error:', error)
      Alert.alert('Error', error.message || 'No se pudo guardar el valor')
    } finally {
      setSaving(false)
    }
  }

  const editValor = (item: any) => {
    setServicio(item.servicio || '')
    setMonto(String(item.monto ?? ''))
    setEditingId(item.id)
  }

  const deleteValor = async (item: any) => {
    Alert.alert('Eliminar valor', `¿Eliminar el servicio ${item.servicio}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('valores')
              .delete()
              .eq('id', item.id)

            if (error) {
              throw error
            }
            fetchValores()
          } catch (error: any) {
            console.error('[Valores] Delete error:', error)
            Alert.alert('Error', 'No se pudo eliminar el valor')
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
          💲 Valores
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#333', fontSize: 16, marginBottom: 8 }}>
            Valores existentes
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color="#3c1361" />
          ) : valores.length === 0 ? (
            <Text style={{ color: '#666' }}>No hay valores registrados.</Text>
          ) : (
            valores.map((item) => (
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
                      {item.servicio}
                    </Text>
                    <Text style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
                      {formatCurrency(item.monto)}
                    </Text>
                    <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                      Creado: {item.created_at ? new Date(item.created_at).toLocaleString() : '---'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => editValor(item)}
                      style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#6f42c1' }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Editar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deleteValor(item)}
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
            {editingId ? 'Editar valor' : 'Agregar valor'}
          </Text>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#1e5a96', fontWeight: '700', marginBottom: 6 }}>Servicio</Text>
            <TextInput
              placeholder="vuelo normal"
              value={servicio}
              onChangeText={setServicio}
              style={{
                backgroundColor: '#fff',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#d3c0ff'
              }}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#1e5a96', fontWeight: '700', marginBottom: 6 }}>Monto</Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#d3c0ff'
            }}>
              <Text style={{ color: '#999', marginRight: 8 }}>$</Text>
              <TextInput
                placeholder="65000"
                value={monto}
                onChangeText={(text) => setMonto(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  color: '#000'
                }}
              />
            </View>
          </View>

          <Pressable
            onPress={saveValor}
            disabled={saving}
            style={{
              backgroundColor: '#6f42c1',
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {saving ? 'Guardando...' : editingId ? 'Actualizar valor' : 'Agregar valor'}
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
