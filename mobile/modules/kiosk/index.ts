import { requireOptionalNativeModule } from 'expo-modules-core'

const Kiosk = requireOptionalNativeModule('Kiosk') as
  | {
      isDeviceOwner(): boolean
      startLockTask(): void
      stopLockTask(): void
    }
  | null

export function isDeviceOwner(): boolean {
  return Kiosk?.isDeviceOwner() ?? false
}

export function startLockTask(): void {
  Kiosk?.startLockTask()
}

export function stopLockTask(): void {
  Kiosk?.stopLockTask()
}

export default Kiosk
