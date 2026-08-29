import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'signage.pairedCode'

export async function getPairedCode(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY)
  } catch {
    return null
  }
}

export async function setPairedCode(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, code)
  } catch {}
}
