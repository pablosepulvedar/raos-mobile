import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function Pilotos() {
  const router = useRouter()
  const [pilotos, setPilotos] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [licencia, setLicencia] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPilotos()
  }, [])

  const fetchPilotos = async () => {
    try {
      const { data, error } = await supabase
        .from('pilotos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Pilotos] Error al cargar:', error)
        return
      }

      setPilotos(data || [])
    } catch (error: any) {
      console.error('[Pilotos] Error inesperado:', error)
    }
  }

  const resetForm = () => {
    setNombre('')
    setLicencia('')
    setEmail('')
    setShowForm(false)
  }

  useFocusEffect(
    useCallback(() => {
      resetForm()
      return () => {}
    }, [])
  )

  const crearPiloto = async () => {
    if (!nombre || !licencia) {
      Alert.alert('Error', 'Completa el nombre y la licencia')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('pilotos')
        .insert({ nombre, licencia, email })

      if (error) {
        Alert.alert('Error', error.message)
      } else {
        Alert.alert('Éxito', 'Piloto creado correctamente')
        setNombre('')
        setLicencia('')
        setEmail('')
        setShowForm(false)
        fetchPilotos()
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f0f8f5' }}>
      <View style={{ backgroundColor: '#34a853', paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} style={{ paddingRight: 10 }}>
          <Text style={{ color: '#fff', fontSize: 24 }}>← Volver</Text>
        </Pressable>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
          ✈️ Pilotos
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingVertical: 15 }}>
        <Pressable
          onPress={() => {
            if (!showForm) {
              setNombre('')
              setLicencia('')
              setEmail('')
            }
            setShowForm(!showForm)
          }}
          style={{
            backgroundColor: '#1b5e31',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
            {showForm ? 'Cancelar' : '+ Nuevo Piloto'}
          </Text>
        </Pressable>
      </View>

      {showForm && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#e9f7ef', marginHorizontal: 20, borderRadius: 8, padding: 15 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1b5e31', marginBottom: 12 }}>
            Nuevo Piloto
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
              borderColor: '#b2dfbb'
            }}
          />

          <TextInput
            placeholder="Licencia"
            value={licencia}
            onChangeText={setLicencia}
            style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 8,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#b2dfbb'
            }}
          />

          <TextInput
            placeholder="Email (opcional)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#b2dfbb'
            }}
          />

          <Pressable
            onPress={crearPiloto}
            disabled={loading}
            style={{
              backgroundColor: '#34a853',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
              {loading ? 'Guardando...' : 'Guardar Piloto'}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1b5e31', marginBottom: 12 }}>
          {pilotos.length} pilotos
        </Text>

        {pilotos.map((piloto) => (
          <View key={piloto.id || piloto.nombre} style={{ backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#34a853' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1b5e31' }}>
              {piloto.nombre}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              Licencia: {piloto.licencia}
            </Text>
            {piloto.email ? (
              <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                {piloto.email}
              </Text>
            ) : null}
          </View>
        ))}

        {pilotos.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: '#999', fontSize: 14 }}>
              No hay pilotos registrados
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
