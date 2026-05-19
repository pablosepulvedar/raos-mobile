import { useRouter } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'

export default function Varios() {
  const router = useRouter()

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{ backgroundColor: '#6f42c1', paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} style={{ paddingRight: 10 }}>
          <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
          ⚙️ Varios
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingVertical: 30 }}>
        <Pressable
          onPress={() => router.push('/varios/horarios')}
          style={{
            backgroundColor: '#fff',
            paddingVertical: 18,
            paddingHorizontal: 20,
            borderRadius: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#d3c0ff'
          }}
        >
          <Text style={{ color: '#3c1361', fontSize: 16, fontWeight: '700' }}>
            🕒 Horarios
          </Text>
          <Text style={{ color: '#5a3cbc', fontSize: 12, marginTop: 4 }}>
            Configuración de horarios
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/varios/valores')}
          style={{
            backgroundColor: '#fff',
            paddingVertical: 18,
            paddingHorizontal: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#d3c0ff'
          }}
        >
          <Text style={{ color: '#3c1361', fontSize: 16, fontWeight: '700' }}>
            💲 Valores
          </Text>
          <Text style={{ color: '#5a3cbc', fontSize: 12, marginTop: 4 }}>
            Configuración de valores
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
