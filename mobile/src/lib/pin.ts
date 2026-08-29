import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'
import { supabase } from './supabase'

const STORAGE_KEY = 'signage.exitPinHash'

let cachedHash: string | null | undefined

export async function refreshExitPin(): Promise<void> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'exit_pin_hash')
    .maybeSingle()
  if (error || !data?.value) return
  cachedHash = String(data.value)
  try {
    await AsyncStorage.setItem(STORAGE_KEY, cachedHash)
  } catch {}
}

export async function getExitPinHash(): Promise<string | null> {
  if (cachedHash !== undefined) return cachedHash
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    if (stored) {
      cachedHash = stored
      return stored
    }
  } catch {}
  await refreshExitPin()
  return cachedHash ?? null
}

export async function checkPin(input: string): Promise<boolean> {
  const hash = await getExitPinHash()
  if (!hash) return false
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input,
  )
  return digest === hash
}
