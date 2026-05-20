import { Pressable, Text } from 'react-native'

type LogoutButtonProps = {
  onPress: () => void
  disabled?: boolean
}

export function LogoutButton({ onPress, disabled }: LogoutButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ paddingHorizontal: 16, paddingVertical: 8, opacity: disabled ? 0.5 : 1 }}
    >
      <Text style={{ color: '#007AFF', fontWeight: '600' }}>
        Cerrar sesión
      </Text>
    </Pressable>
  )
}
