import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { supabase } from '../lib/supabase'
import type { VerifyScreenResult } from '../lib/types'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return out
}

interface Props {
  onPaired: (code: string) => void
}

function PairingScreen({ onPaired }: Props) {
  const [code] = useState(generateCode)
  const [status, setStatus] = useState('Aguardando registro...')

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.rpc('verify_screen', { p_code: code })
      const result = (data ?? []) as VerifyScreenResult[]
      if (result.length > 0 && result[0].valid) {
        setStatus('Registrado! Iniciando...')
        onPaired(code)
      } else {
        setStatus('Aguardando registro no painel...')
      }
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [code, onPaired])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuração do Tablet</Text>
      <View style={styles.qrWrap}>
        <QRCode value={code} size={220} backgroundColor="#000" color="#fff" />
      </View>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.hint}>
        No painel admin, vá em <Text style={styles.bold}>Telas</Text> e digite este
        código para registrar o tablet.
      </Text>
      <View style={styles.statusRow}>
        <View style={styles.dot} />
        <Text style={styles.status}>{status}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1420',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  title: {
    color: '#e8edf7',
    fontSize: 22,
    fontWeight: '700',
  },
  qrWrap: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  code: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 10,
  },
  hint: {
    color: '#8b95ab',
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 360,
  },
  bold: {
    color: '#4f8cff',
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fbbf24',
  },
  status: {
    color: '#8b95ab',
    fontSize: 14,
  },
})

export default PairingScreen
