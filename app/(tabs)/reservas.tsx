import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function Reservas() {
  const router = useRouter()
  const [reservas, setReservas] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [selectedHorarioId, setSelectedHorarioId] = useState<number | null>(null)
  const [horarios, setHorarios] = useState<any[]>([])
  const [valores, setValores] = useState<any[]>([])
  const [selectedValorIds, setSelectedValorIds] = useState<number[]>([])
  const [showHoraOptions, setShowHoraOptions] = useState(false)
  const [cantidad, setCantidad] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const getDateString = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
  }

  const formatHorario = (value: number | string) => {
    const raw = String(value).padStart(4, '0')
    return `${raw.slice(0, 2)}:${raw.slice(2)}`
  }

  const getHorarioLabel = (horarioId: number | null | undefined) => {
    if (!horarioId) return '---'
    const horario = horarios.find((item) => item.id === horarioId)
    return horario ? formatHorario(horario.horario) : String(horarioId)
  }

  const formatCurrency = (value: number | string) => {
    const number = Number(value)
    if (Number.isNaN(number)) return ''
    return `$${number.toLocaleString('es-CL')}`
  }

  const getMonthName = (month: number) => {
    return [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ][month]
  }

  const fetchReservas = async (date: string) => {
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .eq('fecha', date)
      .order('fecha', { ascending: true })

    if (!error && data) {
      setReservas(data)
    } else {
      setReservas([])
    }
  }

  const fetchHorarios = async () => {
    const { data, error } = await supabase
      .from('horarios')
      .select('*')
      .order('horario', { ascending: true })

    if (!error && data) {
      setHorarios(data)
    } else {
      setHorarios([])
    }
  }

  const fetchValores = async () => {
    const { data, error } = await supabase
      .from('valores')
      .select('*')
      .order('servicio', { ascending: true })

    if (!error && data) {
      setValores(data)
    } else {
      setValores([])
    }
  }

  const resetForm = () => {
    setNombre('')
    setTelefono('')
    setHora('')
    setSelectedHorarioId(null)
    setSelectedValorIds([])
    setCantidad('')
    setShowForm(false)
  }

  useFocusEffect(
    useCallback(() => {
      resetForm()
      return () => {}
    }, [])
  )

  useEffect(() => {
    const today = getDateString(new Date())
    setSelectedDate(today)
    setFecha(today)
    fetchReservas(today)
    fetchHorarios()
    fetchValores()
  }, [])

  const changeMonth = (direction: 'prev' | 'next') => {
    const nextMonth = direction === 'prev' ? currentMonth - 1 : currentMonth + 1
    if (nextMonth < 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else if (nextMonth > 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(nextMonth)
    }
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstWeekday = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const selectDate = async (day: number) => {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(date)
    setFecha(date)
    await fetchReservas(date)
  }

  const crearReserva = async () => {
    const numericTelefono = Number(telefono.replace(/[^0-9]/g, ''))
    if (!nombre || !telefono || !fecha || !selectedHorarioId || !cantidad || selectedValorIds.length === 0) {
      Alert.alert('Error', 'Completa todos los campos y selecciona al menos un servicio')
      return
    }
    if (Number.isNaN(numericTelefono)) {
      Alert.alert('Error', 'El teléfono debe contener solo números')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reservas')
        .insert({
          nombre: nombre.trim(),
          telefono: numericTelefono,
          fecha,
          horario_id: selectedHorarioId,
          cantidad: parseInt(cantidad, 10)
        })
        .select('id')
        .single()

      if (error || !data) {
        Alert.alert('Error', error?.message || 'No se pudo crear la reserva')
        return
      }

      const reservaId = data.id
      const servicios = selectedValorIds.map((valorId) => ({
        reserva_id: reservaId,
        valor_id: valorId
      }))

      const { error: servicioError } = await supabase
        .from('reserva_servicios')
        .insert(servicios)

      if (servicioError) {
        Alert.alert('Error', servicioError.message || 'No se pudieron guardar los servicios')
        return
      }

      Alert.alert('Éxito', 'Reserva creada correctamente')
      setNombre('')
      setTelefono('')
      setFecha(selectedDate)
      setHora('')
      setSelectedHorarioId(null)
      setSelectedValorIds([])
      setCantidad('')
      setShowForm(false)
      fetchReservas(selectedDate)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstWeekday = getFirstWeekday(currentYear, currentMonth)
    const weeks: Array<Array<number | null>> = []
    let currentDay = 1

    for (let week = 0; week < 6; week++) {
      const days: Array<number | null> = []
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        if ((week === 0 && dayIndex < firstWeekday) || currentDay > daysInMonth) {
          days.push(null)
        } else {
          days.push(currentDay)
          currentDay += 1
        }
      }
      weeks.push(days)
      if (currentDay > daysInMonth) break
    }

    return (
      <View style={{ marginHorizontal: 20, marginBottom: 20, backgroundColor: '#fff', borderRadius: 12, padding: 15, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Pressable onPress={() => changeMonth('prev')} style={{ padding: 8 }}>
            <Text style={{ fontSize: 16, color: '#1e5a96' }}>‹</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e5a96' }}>
            {getMonthName(currentMonth)} {currentYear}
          </Text>
          <Pressable onPress={() => changeMonth('next')} style={{ padding: 8 }}>
            <Text style={{ fontSize: 16, color: '#1e5a96' }}>›</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dayLabel) => (
            <Text key={dayLabel} style={{ width: 34, textAlign: 'center', color: '#999', fontSize: 12 }}>{dayLabel}</Text>
          ))}
        </View>

        {weeks.map((week, index) => (
          <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <View key={dayIndex} style={{ width: 34, height: 34 }} />
              }
              const dateValue = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const selected = dateValue === selectedDate
              return (
                <Pressable
                  key={dayIndex}
                  onPress={() => selectDate(day)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 34,
                    backgroundColor: selected ? '#1e5a96' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: selected ? '#fff' : '#333', fontSize: 12, fontWeight: selected ? '700' : '500' }}>
                    {day}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>
    )
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

      {renderCalendar()}

      <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e5a96', marginBottom: 8 }}>
          Seleccionado: {selectedDate}
        </Text>
        <Text style={{ fontSize: 14, color: '#555' }}>
          Toca un día para ver las reservas de esa fecha.
        </Text>
      </View>

      {/* Botón agregar */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 15 }}>
        <Pressable
          onPress={() => {
            if (!showForm) {
              setNombre('')
              setHora('')
              setSelectedHorarioId(null)
              setSelectedValorIds([])
              setCantidad('')
            }
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
            placeholder="Nombre"
            value={nombre}
            onChangeText={setNombre}
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
            placeholder="Teléfono"
            value={telefono}
            onChangeText={(text) => setTelefono(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 8,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#ffd700'
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: '#1e5a96', fontWeight: '700', width: 90 }}>Fecha</Text>
            <TextInput
              placeholder="Selecciona fecha"
              value={fecha}
              editable={false}
              style={{
                backgroundColor: '#f0f0f0',
                padding: 12,
                borderRadius: 8,
                flex: 1,
                borderWidth: 1,
                borderColor: '#ffd700'
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: '#1e5a96', fontWeight: '700', width: 90 }}>Horario</Text>
            <Pressable
              onPress={() => setShowHoraOptions(!showHoraOptions)}
              style={{
                backgroundColor: '#fff',
                padding: 12,
                borderRadius: 8,
                flex: 1,
                borderWidth: 1,
                borderColor: '#ffd700'
              }}
            >
              <Text style={{ color: hora ? '#000' : '#999' }}>
                {hora || 'Selecciona un horario'}
              </Text>
            </Pressable>
          </View>

          {showHoraOptions && (
            <View style={{ marginBottom: 10, marginLeft: 90 }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2c44e', overflow: 'hidden' }}>
                {horarios.length === 0 ? (
                  <Text style={{ padding: 12, color: '#999' }}>No hay horarios cargados.</Text>
                ) : (
                  horarios.map((option) => (
                    <Pressable
                      key={option.id}
                      onPress={() => {
                        setHora(formatHorario(option.horario))
                        setSelectedHorarioId(option.id)
                        setShowHoraOptions(false)
                      }}
                      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
                    >
                      <Text>{formatHorario(option.horario)}</Text>
                    </Pressable>
                  ))
                )}
              </View>
            </View>
          )}

          <View style={{ marginBottom: 12, marginLeft: 90 }}>
            <Text style={{ color: '#1e5a96', fontWeight: '700', marginBottom: 8 }}>Servicios</Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ffd700' }}>
              {valores.length === 0 ? (
                <Text style={{ padding: 12, color: '#999' }}>
                  No hay valores cargados. Agrega servicios desde Varios → Valores.
                </Text>
              ) : (
                valores.map((item) => {
                  const selected = selectedValorIds.includes(item.id)
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        setSelectedValorIds((current) =>
                          current.includes(item.id)
                            ? current.filter((id) => id !== item.id)
                            : [...current, item.id]
                        )
                      }}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        borderBottomWidth: item.id !== valores[valores.length - 1].id ? 1 : 0,
                        borderBottomColor: '#f0f0f0',
                        backgroundColor: selected ? '#e8f7ff' : '#fff'
                      }}
                    >
                      <View>
                        <Text style={{ color: '#333', fontWeight: '700' }}>{item.servicio}</Text>
                        <Text style={{ color: '#666', marginTop: 4 }}>{formatCurrency(item.monto)}</Text>
                      </View>
                      <Text style={{ color: selected ? '#1e5a96' : '#999', fontWeight: '700' }}>
                        {selected ? 'Seleccionado' : 'Seleccionar'}
                      </Text>
                    </Pressable>
                  )
                })
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: '#1e5a96', fontWeight: '700', width: 90 }}>Cantidad</Text>
            <TextInput
              placeholder="5"
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="numeric"
              style={{
                backgroundColor: '#fff',
                padding: 12,
                borderRadius: 8,
                flex: 1,
                borderWidth: 1,
                borderColor: '#ffd700'
              }}
            />
          </View>

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
          {reservas.length} reservas para {selectedDate}
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
                  {reserva.nombre || 'Reserva'}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  � {reserva.telefono ?? '---'} • �📅 {reserva.fecha} • ⏰ {getHorarioLabel(reserva.horario_id)}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  👥 {reserva.cantidad} personas
                </Text>
              </View>
            </View>
          </View>
        ))}

        {reservas.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: '#999', fontSize: 14 }}>
              No hay reservas para esta fecha.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
