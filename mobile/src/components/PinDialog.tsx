import { useEffect, useState } from 'react'
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { checkPin } from '../lib/pin'

interface Props {
  visible: boolean
  onUnlock: () => void
  onClose: () => void
}

function PinDialog({ visible, onUnlock, onClose }: Props) {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!visible) {
      setDigits('')
      setError(false)
    }
  }, [visible])

  function press(d: string) {
    if (digits.length >= 6) return
    const next = digits + d
    setDigits(next)
    setError(false)
    if (next.length === 6) {
      setTimeout(async () => {
        if (await checkPin(next)) {
          setDigits('')
          onUnlock()
        } else {
          setError(true)
          setDigits('')
        }
      }, 120)
    }
  }

  function backspace() {
    setDigits((d) => d.slice(0, -1))
    setError(false)
  }

  if (!visible) return null

  const key = (label: string, onPress: () => void, extra?: StyleProp<ViewStyle>) => (
    <Pressable style={({ pressed }) => [styles.key, pressed && styles.keyPressed, extra]} onPress={onPress}>
      <Text style={styles.keyText}>{label}</Text>
    </Pressable>
  )

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>PIN de saída</Text>
        <Text style={styles.subtitle}>Digite o PIN de 6 dígitos para sair do app</Text>

        <View style={styles.dots}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.dot, i < digits.length && styles.dotFilled, error && styles.dotError]} />
          ))}
        </View>

        <View style={styles.pad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => key(d, () => press(d)))}
          {key('', () => {}, styles.blank)}
          {key('0', () => press('0'))}
          {key('⌫', backspace)}
        </View>

        <Pressable style={styles.cancel} onPress={onClose}>
          <Text style={styles.cancelText}>Fechar</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#121826',
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8b95ab',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#3a4b66',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#4f8cff',
    borderColor: '#4f8cff',
  },
  dotError: {
    backgroundColor: '#ff4d4f',
    borderColor: '#ff4d4f',
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 264,
    justifyContent: 'center',
    gap: 12,
  },
  key: {
    width: 72,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#1c2436',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    backgroundColor: '#2a3550',
  },
  blank: {
    backgroundColor: 'transparent',
  },
  keyText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  cancel: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: '#8b95ab',
    fontSize: 14,
  },
})

export default PinDialog
