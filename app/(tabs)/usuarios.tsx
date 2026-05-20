import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { supabase } from '../../lib/supabase'

type RolOption = { id: number; nombre: string }

const inputStyle = {
  backgroundColor: '#fff',
  padding: 12,
  borderRadius: 8,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#4fa3ff',
  color: '#111',
  fontSize: 16
} as const

const readonlyInputStyle = {
  ...inputStyle,
  backgroundColor: '#f0f0f0',
  color: '#555'
} as const

const placeholderColor = '#888'

const logUsuarios = (...args: unknown[]) => {
  console.log('[Usuarios]', ...args)
}

export default function Usuarios() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [rolesCatalog, setRolesCatalog] = useState<RolOption[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<RolOption[]>([])
  const [showRolePicker, setShowRolePicker] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsuarios()
    fetchRoles()
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
    })
  }, [])

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('id, nombre')
      .order('nombre', { ascending: true })

    if (!error && data) {
      setRolesCatalog(data)
    }
  }

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select(`
          *,
          perfil_roles (
            id,
            rol_id,
            roles (
              id,
              nombre
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        const { data: fallback } = await supabase
          .from('perfiles')
          .select('*')
          .order('created_at', { ascending: false })
        setUsuarios(fallback || [])
        return
      }

      setUsuarios(data || [])
    } catch {
      // Sin acción
    }
  }

  const getRoleNames = (usuario: any) => {
    const roles = (usuario.perfil_roles || [])
      .map((pr: any) => pr.roles?.nombre)
      .filter(Boolean)
    return roles.length > 0 ? roles.join(', ') : 'Sin roles'
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchUsuarios(), fetchRoles()])
    setRefreshing(false)
  }

  const resetForm = () => {
    setNombre('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setSelectedRoles([])
    setShowRolePicker(false)
    setEditingId(null)
    setShowForm(false)
  }

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetForm()
      }
    }, [])
  )

  const syncPerfilRoles = async (perfilId: string, roleIds: number[]) => {
    const { data: existing, error: fetchError } = await supabase
      .from('perfil_roles')
      .select('id, rol_id')
      .eq('perfil_id', perfilId)

    if (fetchError) {
      throw fetchError
    }

    const existingRows = existing || []
    const existingRolIds = existingRows.map((row) => row.rol_id)
    const toAdd = roleIds.filter((id) => !existingRolIds.includes(id))
    const toRemove = existingRows.filter((row) => !roleIds.includes(row.rol_id))

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from('perfil_roles')
        .delete()
        .in('id', toRemove.map((row) => row.id))

      if (error) {
        throw error
      }
    }

    if (toAdd.length > 0) {
      const { error } = await supabase
        .from('perfil_roles')
        .insert(toAdd.map((rol_id) => ({ perfil_id: perfilId, rol_id })))

      if (error) {
        throw error
      }
    }
  }

  const updatePassword = async (userId: string, newPassword: string) => {
    const isSelf = userId === currentUserId
    logUsuarios('Contraseña: intento', { userId, isSelf })

    if (isSelf) {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword })
      logUsuarios('Contraseña: auth.updateUser', { user: data.user?.id, error: error?.message })
      if (error) {
        throw error
      }
      return
    }

    const { error } = await supabase.rpc('admin_set_user_password', {
      target_user_id: userId,
      new_password: newPassword
    })

    logUsuarios('Contraseña: rpc admin_set_user_password', { error: error?.message })

    if (error) {
      throw new Error(
        'No se pudo cambiar la contraseña de otro usuario. Falta la función admin_set_user_password en Supabase, o edita tu propio perfil.'
      )
    }
  }

  const addRole = (rol: RolOption) => {
    if (!selectedRoles.find((item) => item.id === rol.id)) {
      setSelectedRoles((current) => [...current, rol])
    }
    setShowRolePicker(false)
  }

  const removeRole = (rolId: number) => {
    setSelectedRoles((current) => current.filter((item) => item.id !== rolId))
  }

  const availableRoles = rolesCatalog.filter(
    (rol) => !selectedRoles.find((item) => item.id === rol.id)
  )

  const openCreateForm = () => {
    setEditingId(null)
    setNombre('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setSelectedRoles([])
    setShowRolePicker(false)
    setShowForm(true)
  }

  const openEditForm = async (usuario: any) => {
    logUsuarios('Abrir edición', { id: usuario.id, nombre: usuario.nombre })
    const rolesFromProfile: RolOption[] = (usuario.perfil_roles || [])
      .map((pr: any) => pr.roles)
      .filter(Boolean)
      .map((rol: any) => ({ id: rol.id, nombre: rol.nombre }))

    let userEmail = usuario.email || ''
    if (!userEmail && usuario.id === currentUserId) {
      const { data } = await supabase.auth.getUser()
      userEmail = data.user?.email || ''
    }

    setEditingId(usuario.id)
    setNombre(usuario.nombre || '')
    setEmail(userEmail)
    setPassword('')
    setConfirmPassword('')
    setSelectedRoles(rolesFromProfile)
    setShowRolePicker(false)
    setShowForm(true)
  }

  const toggleActivo = async (usuario: any) => {
    try {
      const nuevoEstado = !usuario.activo
      const { data, error, status } = await supabase
        .from('perfiles')
        .update({ activo: nuevoEstado })
        .eq('id', usuario.id)
        .select('id, activo')

      logUsuarios('Toggle activo', { id: usuario.id, nuevoEstado, status, data, error: error?.message })

      if (error) {
        Alert.alert('Error', error.message || 'No se pudo cambiar el estado')
        return
      }

      if (!data || data.length === 0) {
        Alert.alert('Error', 'No se pudo cambiar el estado. Revisa políticas RLS de UPDATE en perfiles.')
        return
      }

      await fetchUsuarios()
    } catch {
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

      await supabase.from('perfil_roles').delete().eq('perfil_id', usuario.id)

      const { error, status } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', usuario.id)

      if (error) {
        Alert.alert('Error', error.message || 'No se pudo eliminar el usuario')
        return
      }

      if (status === 204 || status === 200) {
        if (editingId === usuario.id) {
          resetForm()
        }
        await fetchUsuarios()
      }
    } catch {
      Alert.alert('Error', 'Ocurrió un error al eliminar el usuario')
    } finally {
      setDeletingId(null)
    }
  }

  const guardarUsuario = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresa el nombre')
      return
    }

    if (!editingId && (!email.trim() || !password.trim())) {
      Alert.alert('Error', 'Completa email y contraseña')
      return
    }

    const needsPasswordMatch = !editingId || password.trim().length > 0
    if (needsPasswordMatch) {
      if (!confirmPassword.trim()) {
        Alert.alert('Error', 'Confirma la contraseña')
        return
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden')
        return
      }
    }

    if (selectedRoles.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un rol')
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        const newNombre = nombre.trim()
        logUsuarios('Guardar edición', {
          editingId,
          newNombre,
          roles: selectedRoles.map((r) => r.id),
          cambiaPassword: password.trim().length > 0
        })

        const { error: profileError, status } = await supabase
          .from('perfiles')
          .update({ nombre: newNombre })
          .eq('id', editingId)

        logUsuarios('UPDATE perfiles respuesta', {
          status,
          error: profileError?.message,
          code: profileError?.code
        })

        if (profileError) {
          throw profileError
        }

        const { data: verifyProfile, error: verifyError } = await supabase
          .from('perfiles')
          .select('id, nombre')
          .eq('id', editingId)
          .single()

        logUsuarios('VERIFY perfiles después de UPDATE', {
          verifyProfile,
          verifyError: verifyError?.message
        })

        if (verifyError || !verifyProfile || verifyProfile.nombre !== newNombre) {
          throw new Error(
            verifyError?.message ||
              'El nombre no se guardó. Revisa políticas RLS de UPDATE/SELECT en la tabla perfiles.'
          )
        }

        let passwordNote = ''
        if (password.trim()) {
          try {
            await updatePassword(editingId, password.trim())
            passwordNote = '\n\nContraseña: actualizada.'
          } catch (pwdError: any) {
            logUsuarios('Contraseña: falló', pwdError?.message)
            passwordNote = `\n\nContraseña: ${pwdError?.message || 'no se pudo actualizar'}.`
          }
        } else {
          logUsuarios('Contraseña: sin cambios (campo vacío)')
        }

        logUsuarios('SYNC perfil_roles', { perfilId: editingId, roleIds: selectedRoles.map((r) => r.id) })
        await syncPerfilRoles(editingId, selectedRoles.map((rol) => rol.id))
        logUsuarios('SYNC perfil_roles: OK')

        await fetchUsuarios()
        resetForm()

        Alert.alert(
          'Éxito',
          `Nombre actualizado a "${verifyProfile.nombre}".${passwordNote}`
        )
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim()
      })

      if (authError) {
        Alert.alert('Error Auth', authError.message)
        return
      }

      if (!authData.user) {
        Alert.alert('Error', 'No se pudo crear el usuario en autenticación')
        return
      }

      const profileInsert: Record<string, unknown> = {
        id: authData.user.id,
        nombre: nombre.trim(),
        activo: true,
        email: email.trim()
      }

      let { error: profileError } = await supabase
        .from('perfiles')
        .insert(profileInsert)

      if (profileError?.message?.includes('email')) {
        const { email: _email, ...withoutEmail } = profileInsert
        const retry = await supabase.from('perfiles').insert(withoutEmail)
        profileError = retry.error
      }

      if (profileError) {
        throw profileError
      }

      await syncPerfilRoles(authData.user.id, selectedRoles.map((rol) => rol.id))

      Alert.alert('Éxito', 'Usuario creado correctamente')
      resetForm()
      await fetchUsuarios()
    } catch (error: any) {
      logUsuarios('Guardar ERROR', error?.message, error?.code, error)
      Alert.alert('Error', error.message || 'No se pudo guardar el usuario')
    } finally {
      setLoading(false)
    }
  }

  const renderRolesField = () => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: '#1e5a96', fontWeight: '700', marginBottom: 6 }}>Roles</Text>

      <Pressable
        onPress={() => setShowRolePicker(!showRolePicker)}
        style={{
          backgroundColor: '#fff',
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#4fa3ff',
          marginBottom: 8
        }}
      >
        <Text style={{ color: availableRoles.length === 0 ? '#888' : '#111' }}>
          {availableRoles.length === 0
            ? 'No hay más roles disponibles'
            : 'Seleccionar rol...'}
        </Text>
      </Pressable>

      {showRolePicker && availableRoles.length > 0 && (
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#4fa3ff',
            marginBottom: 8,
            overflow: 'hidden'
          }}
        >
          {availableRoles.map((rol, index) => (
            <Pressable
              key={rol.id}
              onPress={() => addRole(rol)}
              style={{
                padding: 12,
                borderBottomWidth: index < availableRoles.length - 1 ? 1 : 0,
                borderBottomColor: '#f0f0f0'
              }}
            >
              <Text style={{ color: '#111', fontSize: 16 }}>{rol.nombre}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View
        style={{
          minHeight: 48,
          backgroundColor: '#fff',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#4fa3ff',
          padding: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8
        }}
      >
        {selectedRoles.length === 0 ? (
          <Text style={{ color: '#888', fontSize: 14 }}>Los roles seleccionados aparecerán aquí</Text>
        ) : (
          selectedRoles.map((rol) => (
            <View
              key={rol.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#e8f0f7',
                borderRadius: 20,
                paddingVertical: 6,
                paddingLeft: 12,
                paddingRight: 8
              }}
            >
              <Text style={{ color: '#1e5a96', fontWeight: '600', marginRight: 6 }}>{rol.nombre}</Text>
              <Pressable onPress={() => removeRole(rol.id)} hitSlop={8}>
                <Text style={{ color: '#d11a2a', fontWeight: '700', fontSize: 16 }}>×</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </View>
  )

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f8f9fa' }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4fa3ff" />
      }
    >
      <View style={{ backgroundColor: '#4fa3ff', paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} style={{ paddingRight: 10 }}>
          <Text style={{ color: '#fff', fontSize: 24 }}>← Volver</Text>
        </Pressable>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
          👥 Usuarios
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingVertical: 15 }}>
        <Pressable
          onPress={() => {
            if (showForm) {
              resetForm()
            } else {
              openCreateForm()
            }
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

      {showForm && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#e8f0f7', marginHorizontal: 20, borderRadius: 8, padding: 15 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e5a96', marginBottom: 12 }}>
            {editingId ? 'Editar usuario' : 'Nuevo usuario'}
          </Text>

          <Text style={{ color: '#1e5a96', fontWeight: '700', marginBottom: 6 }}>Nombre</Text>
          <TextInput
            placeholder="Nombre"
            placeholderTextColor={placeholderColor}
            value={nombre}
            onChangeText={setNombre}
            style={inputStyle}
          />

          <Text style={{ color: '#1e5a96', fontWeight: '700', marginBottom: 6 }}>Email</Text>
          <TextInput
            placeholder="correo@ejemplo.com"
            placeholderTextColor={placeholderColor}
            value={email}
            onChangeText={setEmail}
            editable={!editingId}
            keyboardType="email-address"
            autoCapitalize="none"
            style={editingId ? readonlyInputStyle : inputStyle}
          />

          <Text style={{ color: '#1e5a96', fontWeight: '700', marginBottom: 6 }}>
            {editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          </Text>
          <TextInput
            placeholder={editingId ? 'Dejar vacío para no cambiar' : 'Contraseña'}
            placeholderTextColor={placeholderColor}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={inputStyle}
          />

          {(!editingId || password.length > 0) && (
            <>
              <Text style={{ color: '#1e5a96', fontWeight: '700', marginBottom: 6 }}>
                Confirmar contraseña
              </Text>
              <TextInput
                placeholder="Confirmar contraseña"
                placeholderTextColor={placeholderColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={{
                  ...inputStyle,
                  borderColor:
                    confirmPassword.length === 0
                      ? '#4fa3ff'
                      : password === confirmPassword
                        ? '#34a853'
                        : '#d9534f'
                }}
              />
              {confirmPassword.length > 0 && (
                <Text
                  style={{
                    marginTop: -4,
                    marginBottom: 10,
                    fontSize: 13,
                    fontWeight: '600',
                    color: password === confirmPassword ? '#34a853' : '#d9534f'
                  }}
                >
                  {password === confirmPassword
                    ? '✓ Las contraseñas coinciden'
                    : '✗ Las contraseñas no coinciden'}
                </Text>
              )}
            </>
          )}

          {renderRolesField()}

          <Pressable
            onPress={guardarUsuario}
            disabled={loading}
            style={{
              backgroundColor: '#ffd700',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#1e5a96', fontSize: 14, fontWeight: '700' }}>
              {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear usuario'}
            </Text>
          </Pressable>
        </View>
      )}

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
              borderLeftColor: usuario.activo ? '#4fa3ff' : '#ccc'
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e5a96' }}>
                  {usuario.nombre}
                </Text>
                {usuario.email ? (
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{usuario.email}</Text>
                ) : null}
                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {usuario.activo ? '✅ Activo' : '❌ Inactivo'}
                </Text>
                <Text style={{ fontSize: 12, color: '#1e5a96', marginTop: 4 }}>
                  🛡️ {getRoleNames(usuario)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                  onPress={() => openEditForm(usuario)}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: '#e8f0f7',
                    marginRight: 8
                  }}
                >
                  <Text style={{ color: '#1e5a96', fontWeight: '700' }}>Editar</Text>
                </Pressable>
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
                    marginLeft: 8,
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
