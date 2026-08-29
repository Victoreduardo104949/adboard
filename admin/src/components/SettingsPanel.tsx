import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { KeyRound } from 'lucide-react'

async function sha256Hex(s: string): Promise<string> {
  const bytes = new TextEncoder().encode(s)
  const buf = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function SettingsPanel() {
  const [pin, setPin] = useState('')
  const [hasPin, setHasPin] = useState(false)
  const [saved, setSaved] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPin = useCallback(async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'exit_pin_hash')
      .maybeSingle()
    if (error) {
      setError(error.message)
    } else {
      setHasPin(Boolean(data?.value))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPin()
  }, [fetchPin])

  async function save(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(null)
    if (!/^\d{6}$/.test(pin)) {
      setError('O PIN deve ter exatamente 6 dígitos.')
      return
    }
    const value = await sha256Hex(pin)
    const { error } = await supabase.from('settings').upsert(
      { key: 'exit_pin_hash', value },
      { onConflict: 'key' },
    )
    if (error) {
      setError(error.message)
    } else {
      setPin('')
      setHasPin(true)
      setSaved(true)
    }
  }

  if (loading) {
    return <div className="loading">Carregando…</div>
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Configurações</h1>
          <p className="muted">Modo quiosque dos tablets</p>
        </div>
      </div>

      <form className="settings-form" onSubmit={save}>
        <div className="settings-card">
          <div className="settings-icon">
            <KeyRound size={20} />
          </div>
          <div>
            <strong>PIN de saída do modo quiosque</strong>
            <p className="muted">
              No tablet, toque 5 vezes no canto inferior direito da tela (ou
              use o botão voltar) e digite este PIN para sair do app.
              {hasPin ? ' PIN atual definido.' : ' Nenhum PIN definido ainda.'}
            </p>
          </div>
        </div>

        <label className="field">
          <span>Novo PIN (6 dígitos)</span>
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''))
              setSaved(null)
            }}
          />
        </label>

        {error && <p className="error">{error}</p>}
        {saved && <p className="ok">PIN salvo. Os tablets serão atualizados em até 1 minuto.</p>}

        <button type="submit" className="primary">
          Salvar PIN
        </button>
      </form>
    </div>
  )
}

export default SettingsPanel
