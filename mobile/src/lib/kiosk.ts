import { requireOptionalNativeModule } from 'expo-modules-core'

interface KioskNative {
  isDeviceOwner(): boolean
  startLockTask(): void
  stopLockTask(): void
}

const native = requireOptionalNativeModule('Kiosk') as KioskNative | null

export const kioskAvailable = native != null

export function isDeviceOwner(): boolean {
  try {
    return native?.isDeviceOwner() ?? false
  } catch {
    return false
  }
}

export function startLockTask(): void {
  try {
    native?.startLockTask()
  } catch {}
}

export function stopLockTask(): void {
  try {
    native?.stopLockTask()
  } catch {}
}
