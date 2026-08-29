import { useState } from 'react'

export default function MobilePlayerPreview() {
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode') ?? 'pairing' // 'pairing' | 'player' | 'pin'
  const [digits, setDigits] = useState('123')

  if (mode === 'pairing') {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#0f1420',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          gap: '24px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#e8edf7' }}>
          Configuração do Tablet
        </h1>
        <div
          style={{
            background: '#fff',
            padding: '16px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {/* High quality SVG QR Code mock */}
          <svg width="220" height="220" viewBox="0 0 220 220">
            <rect width="220" height="220" fill="#fff" />
            <path
              d="M20,20 h60 v60 h-60 z M30,30 v40 h40 v-40 z M40,40 h20 v20 h-20 z
                 M140,20 h60 v60 h-60 z M150,30 v40 h40 v-40 z M160,40 h20 v20 h-20 z
                 M20,140 h60 v60 h-60 z M30,150 v40 h40 v-40 z M40,160 h20 v20 h-20 z
                 M90,20 h20 v30 h-20 z M120,20 h10 v20 h-10 z M90,60 h40 v20 h-40 z
                 M20,90 h30 v20 h-30 z M60,90 h20 v40 h-20 z M90,90 h20 v20 h-20 z
                 M120,90 h30 v30 h-30 z M160,90 h40 v20 h-40 z M100,120 h40 v20 h-40 z
                 M150,120 h20 v30 h-20 z M180,120 h20 v40 h-20 z M90,150 h20 v30 h-20 z
                 M120,160 h30 v40 h-30 z M160,170 h40 v30 h-40 z M90,190 h20 v10 h-20 z"
              fill="#000"
            />
          </svg>
        </div>
        <div
          style={{
            fontSize: '44px',
            fontWeight: 800,
            letterSpacing: '12px',
            color: '#fff',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          TL7FCL
        </div>
        <p
          style={{
            color: '#8b95ab',
            fontSize: '16px',
            textAlign: 'center',
            maxWidth: '420px',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          No painel admin, vá em <span style={{ color: '#4f8cff', fontWeight: 700 }}>Telas</span> e
          digite este código para registrar o tablet.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#fbbf24',
              boxShadow: '0 0 10px #fbbf24',
            }}
          />
          <span style={{ color: '#8b95ab', fontSize: '15px' }}>
            Aguardando registro no painel...
          </span>
        </div>
      </div>
    )
  }

  if (mode === 'player') {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1920&q=80"
          alt="Anúncio em Reprodução"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Discreto indicador de loop / info */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            padding: '8px 16px',
            borderRadius: '20px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
            }}
          />
          <span>Signage 24h Player • Conectado</span>
        </div>
      </div>
    )
  }

  // mode === 'pin'
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#121826',
          borderRadius: '20px',
          padding: '32px 28px',
          width: '340px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: '1px solid #1f293d',
          boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
        }}
      >
        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>
          PIN de saída
        </h2>
        <p
          style={{
            color: '#8b95ab',
            fontSize: '13px',
            marginTop: '6px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          Digite o PIN de 6 dígitos para sair do modo quiosque
        </p>

        {/* Dots */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid ' + (i < digits.length ? '#4f8cff' : '#3a4b66'),
                backgroundColor: i < digits.length ? '#4f8cff' : 'transparent',
                boxShadow: i < digits.length ? '0 0 10px #4f8cff' : 'none',
                transition: 'all 0.15s ease',
              }}
            />
          ))}
        </div>

        {/* Keypad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            width: '100%',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, idx) => {
            if (d === '') return <div key={idx} />
            return (
              <button
                key={idx}
                onClick={() => {
                  if (d === '⌫') setDigits((prev) => prev.slice(0, -1))
                  else if (digits.length < 6) setDigits((prev) => prev + d)
                }}
                style={{
                  height: '60px',
                  borderRadius: '12px',
                  backgroundColor: '#1c2436',
                  color: '#fff',
                  fontSize: '22px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.1s',
                }}
              >
                {d}
              </button>
            )
          })}
        </div>

        <button
          style={{
            marginTop: '24px',
            background: 'transparent',
            border: 'none',
            color: '#8b95ab',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
