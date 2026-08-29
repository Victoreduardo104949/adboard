import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import PairingScreen from './src/screens/PairingScreen'
import PlayerScreen from './src/screens/PlayerScreen'
import { getPairedCode, setPairedCode } from './src/lib/storage'
import { supabaseConfigOk } from './src/lib/supabase'

function ConfigWarning() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Configuração incompleta</Text>
      <Text style={styles.msg}>
        Crie o arquivo .env na pasta mobile/ com EXPO_PUBLIC_SUPABASE_URL e
        EXPO_PUBLIC_SUPABASE_ANON_KEY.
      </Text>
    </View>
  )
}

export default function App() {
  const [code, setCode] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getPairedCode().then((c) => {
      setCode(c)
      setReady(true)
    })
  }, [])

  if (!supabaseConfigOk) {
    return <ConfigWarning />
  }

  if (!ready) {
    return <View style={styles.fill} />
  }

  return (
    <View style={styles.fill}>
      <StatusBar hidden />
      {code === null ? (
        <PairingScreen
          onPaired={async (c) => {
            await setPairedCode(c)
            setCode(c)
          }}
        />
      ) : (
        <PlayerScreen code={code} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    backgroundColor: '#0f1420',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  msg: {
    color: '#8b95ab',
    fontSize: 14,
    textAlign: 'center',
  },
})
