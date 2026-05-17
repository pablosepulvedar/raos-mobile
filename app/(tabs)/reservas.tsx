import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function Reservas() {
  const router = useRouter()
  const [reservas, setReservas] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nombreCliente, setNombreCliente] = useState('')
  const [fecha, setFecha] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReservas()
  }, [])

  const fetchReservas = async () => {
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .order('fecha', { ascending: false })
    
    if (!error && data) {
      setReservas(data)
    }
  }

  const crearReserva = async () => {
    if (!nombreCliente || !fecha || !cantidad) {
      Alert.alert('Error', 'Completa todos los campos')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('reservas')
        .insert({
          nombre_cliente: nombreCliente,
          fecha,
          cantidad: parseInt(cantidad),
          estado: 'pendiente'
        })

      if (error) {
        Alert.alert('Error', error.message)
      } else {
        Alert.alert('Éxito', 'Reserva creada correctamente')
        setNombreCliente('')
        setFecha('')
        setCantidad('')
        setShowForm(false)
        fetchReservas()
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#ffd700', paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} style={{ paddingRight: 10 }}>
          <Text style={{ color: '#1e5a96', fontSize: 24 }}>← Volver</Text>
        </Pressable>
        <Text style={{ color: '#1e5a96', fontSize: 24, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
          📅 Reservas
        </Text>
      </View>

      {/* Botón agregar */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 15 }}>
        <Pressable
          onPress={() => setShowForm(!showForm)}
          style={{
            backgroundColor: '#1e5a96',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
            {showForm ? 'Cancelar' : '+ Nueva Reserva'}
          </Text>
        </Pressable>
      </View>

      {/* Formulario */}
      {showForm && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff3cd', marginHorizontal: 20, borderRadius: 8, padding: 15 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e5a96', marginBottom: 12 }}>
            Nueva Reserva
          </Text>

          <TextInput
            placeholder="Nombre del cliente"
            value={nombreCliente}
            onChangeText={setNombreCliente}
            style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 8,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#ffd700'
            }}
          />

          <TextInput
            placeholder="Fecha (YYYY-MM-DD)"
            value={fecha}
            onChangeText={setFecha}
            style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 8,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#ffd700'
            }}
          />

          <TextInput
            placeholder="Cantidad de personas"
            value={cantidad}
            onChangeText={setCantidad}
            keyboardType="numeric"
            style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#ffd700'
            }}
          />

          <Pressable
            onPress={crearReserva}
            disabled={loading}
            style={{
              backgroundColor: '#ffd700',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#1e5a96', fontSize: 14, fontWeight: '700' }}>
              {loading ? 'Creando...' : 'Crear Reserva'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Lista de reservas */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e5a96', marginBottom: 12 }}>
          {reservas.length} reservas
        </Text>

        {reservas.map((reserva) => (
          <View
            key={reserva.id}
            style={{
              backgroundColor: '#fff',
              padding: 15,
              borderRadius: 8,
              marginBottom: 10,
              borderLeftWidth: 4,
              borderLeftColor: '#ffd700'
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e5a96' }}>
                  {reserva.nombre_cliente}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  📅 {reserva.fecha}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  👥 {reserva.cantidad} personas
                </Text>
              </View>
              <View style={{
                backgroundColor: reserva.estado === 'confirmada' ? '#28a745' : '#ffc107',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6
              }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                  {reserva.estado?.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {reservas.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: '#999', fontSize: 14 }}>
              No hay reservas registradas
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
