import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Login() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const login = async () => {

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      })

    console.log(data, error)

    if (data.session) {
      router.replace('/(tabs)')
    }

  }

  return (

    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 30}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 20
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: '#fff', fontSize: 30, marginBottom: 20 }}>
          Login
        </Text>

        <TextInput
          placeholder="Correo"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          style={{
            backgroundColor: '#222',
            color: '#fff',
            padding: 15,
            borderRadius: 10,
            marginBottom: 15
          }}
        />

        <TextInput
          placeholder="Contraseña"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            backgroundColor: '#222',
            color: '#fff',
            padding: 15,
            borderRadius: 10,
            marginBottom: 20
          }}
        />

        <Pressable
          onPress={login}
          style={{
            backgroundColor: '#fff',
            padding: 15,
            borderRadius: 10
          }}
        >

          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
            Iniciar sesión
          </Text>

        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>

  )
}