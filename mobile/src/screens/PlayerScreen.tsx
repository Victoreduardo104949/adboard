import { useCallback, useEffect, useRef, useState } from 'react'
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useEventListener } from 'expo'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useKeepAwake } from 'expo-keep-awake'
import { supabase } from '../lib/supabase'
import type { Ad } from '../lib/types'
import { startLockTask, stopLockTask } from '../lib/kiosk'
import { refreshExitPin } from '../lib/pin'
import PinDialog from '../components/PinDialog'

function ImageSlide({ ad, onNext }: { ad: Ad; onNext: () => void }) {
  useEffect(() => {
    const ms = (ad.duration ?? 10) * 1000
    const timer = setTimeout(onNext, ms)
    return () => clearTimeout(timer)
  }, [ad.id, ad.duration, onNext])

  return (
    <Image
      source={{ uri: ad.media_url }}
      style={styles.fill}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={0}
    />
  )
}

function VideoSlide({ ad, onNext }: { ad: Ad; onNext: () => void }) {
  const player = useVideoPlayer(
    { uri: ad.media_url, useCaching: true },
    (p) => {
      p.loop = false
      p.muted = true
      p.play()
    },
  )

  useEventListener(player, 'playToEnd', onNext)

  useEffect(() => {
    const safety = setTimeout(onNext, 10 * 60 * 1000)
    return () => clearTimeout(safety)
  }, [ad.id, onNext])

  return (
    <VideoView
      style={styles.fill}
      player={player}
      nativeControls={false}
      contentFit="cover"
      surfaceType="textureView"
    />
  )
}

function PlayerScreen({ code }: { code: string }) {
  useKeepAwake()

  const [playlist, setPlaylist] = useState<Ad[]>([])
  const [index, setIndex] = useState(0)
  const [iteration, setIteration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pinVisible, setPinVisible] = useState(false)
  const tapTimes = useRef<number[]>([])

  const openPin = useCallback(() => setPinVisible(true), [])

  const handleExit = useCallback(() => {
    stopLockTask()
    BackHandler.exitApp()
  }, [])

  useEffect(() => {
    startLockTask()
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      openPin()
      return true
    })
    return () => sub.remove()
  }, [openPin])

  useEffect(() => {
    refreshExitPin()
  }, [])

  const handleTap = useCallback(() => {
    const now = Date.now()
    tapTimes.current = tapTimes.current.filter((t) => now - t < 3000)
    tapTimes.current.push(now)
    if (tapTimes.current.length >= 5) {
      tapTimes.current = []
      openPin()
    }
  }, [openPin])

  const fetchPlaylist = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_playlist', { p_code: code })
    if (error) {
      setError(error.message)
      return
    }
    setPlaylist((data ?? []) as Ad[])
    setError(null)
  }, [code])

  useEffect(() => {
    fetchPlaylist()
    const interval = setInterval(() => {
      fetchPlaylist()
      refreshExitPin()
      supabase.rpc('ping_screen', { p_code: code }).then(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchPlaylist, code])

  const next = useCallback(() => {
    const current = playlist[index]
    if (current) {
      supabase.rpc('increment_ad_play', { p_ad_id: current.id }).then(() => {})
    }
    setIndex((i) => (i + 1) % Math.max(playlist.length, 1))
    setIteration((n) => n + 1)
  }, [playlist, index])

  let content: React.ReactNode

  if (error) {
    content = (
      <View style={styles.center}>
        <Text style={styles.msg}>Falha de conexão com o servidor.</Text>
        <Pressable style={styles.retry} onPress={fetchPlaylist}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    )
  } else {
    const current = playlist[index]

    if (!current) {
      content = (
        <View style={styles.center}>
          <Text style={styles.msg}>Aguardando anúncios...</Text>
          <Text style={styles.sub}>Crie e ative conteúdo no painel admin.</Text>
        </View>
      )
    } else {
      content = current.media_type === 'image' ? (
        <ImageSlide key={`${current.id}-${iteration}`} ad={current} onNext={next} />
      ) : (
        <VideoSlide key={`${current.id}-${iteration}`} ad={current} onNext={next} />
      )
    }
  }

  return (
    <View style={styles.fill}>
      {content}
      <Pressable style={styles.tapHotspot} onPress={handleTap} />
      <PinDialog
        visible={pinVisible}
        onUnlock={handleExit}
        onClose={() => setPinVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  tapHotspot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 100,
    height: 100,
  },
  center: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
  },
  msg: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sub: {
    color: '#8b95ab',
    fontSize: 14,
  },
  retry: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4f8cff',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: '#4f8cff',
    fontWeight: '600',
  },
})

export default PlayerScreen
