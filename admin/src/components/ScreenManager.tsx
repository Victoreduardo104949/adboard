import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Group, Screen } from '../lib/types'
import { Plus, Trash2, MonitorPlay } from 'lucide-react'

function isOnline(s: Screen): boolean {
  if (!s.last_seen_at) return false
  const diff = Date.now() - new Date(s.last_seen_at).getTime()
  return diff < 120000
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora mesmo'
  if (min < 60) return `${min} min atrás`
  const h = Math.floor(min / 60)
  return `${h} h atrás`
}

function ScreenManager() {
  const [screens, setScreens] = useState<Screen[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchScreens = useCallback(async () => {
    const { data, error } = await supabase
      .from('screens')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      setError(error.message)
      return
    }
    setScreens(data ?? [])
    setError(null)
    setLoading(false)
  }, [])

  const fetchGroups = useCallback(async () => {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true })
    setGroups(data ?? [])
  }, [])

  useEffect(() => {
    fetchScreens()
    fetchGroups()
    const interval = setInterval(fetchScreens, 15000)
    return () => clearInterval(interval)
  }, [fetchScreens, fetchGroups])

  async function register(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) return
    const { error } = await supabase
      .from('screens')
      .insert({ code: trimmedCode, name: name.trim() || 'Tablet' })
    if (error) {
      setError(`Código inválido ou já cadastrado.`)
    } else {
      setCode('')
      setName('')
      fetchScreens()
    }
  }

  async function toggleActive(s: Screen) {
    await supabase.from('screens').update({ is_active: !s.is_active }).eq('id', s.id)
    fetchScreens()
  }

  async function remove(s: Screen) {
    if (!confirm(`Remover a tela "${s.name}" (${s.code})?`)) return
    await supabase.from('screens').delete().eq('id', s.id)
    fetchScreens()
  }

  async function setGroup(s: Screen, groupId: string) {
    await supabase
      .from('screens')
      .update({ group_id: groupId || null })
      .eq('id', s.id)
    fetchScreens()
  }

  if (loading) {
    return <div className="loading">Carregando…</div>
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Telas</h1>
          <p className="muted">
            Tablets exibindo a playlist. No primeiro uso, o tablet mostra um
            código — registre aqui.
          </p>
        </div>
      </div>

      <form className="screen-form" onSubmit={register}>
        <input
          type="text"
          placeholder="Código do tablet (ex: 4K9X2T)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={10}
          required
        />
        <input
          type="text"
          placeholder="Nome (ex: Lobby Entrada)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="primary">
          <Plus size={18} />
          Registrar
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {screens.length === 0 ? (
        <div className="empty">
          Nenhuma tela registrada. Rode o app no tablet e digite o código exibido.
        </div>
      ) : (
        <div className="ad-list">
          {screens.map((s) => (
            <div key={s.id} className={`ad-row ${s.is_active ? '' : 'inactive'}`}>
              <div className="screen-icon">
                <MonitorPlay size={20} />
              </div>
              <div className="ad-info">
                <strong>
                  {s.name} <code className="code">{s.code}</code>
                </strong>
                <span className="muted">Visto por último: {relativeTime(s.last_seen_at)}</span>
              </div>
              <select
                className="group-select"
                value={s.group_id ?? ''}
                onChange={(e) => setGroup(s, e.target.value)}
                title="Grupo de telas"
              >
                <option value="">Sem grupo</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <span className={`badge ${isOnline(s) ? 'on' : 'off'}`}>
                {isOnline(s) ? 'Online' : 'Offline'}
              </span>
              <div className="row-actions">
                <button title={s.is_active ? 'Desativar' : 'Ativar'} onClick={() => toggleActive(s)}>
                  {s.is_active ? 'Desativar' : 'Ativar'}
                </button>
                <button title="Excluir" className="danger" onClick={() => remove(s)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ScreenManager
