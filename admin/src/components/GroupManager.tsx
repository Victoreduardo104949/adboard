import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Group } from '../lib/types'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'

function GroupManager() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<Group | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchGroups = useCallback(async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true })
    if (error) {
      setError(error.message)
      return
    }
    setGroups(data ?? [])
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  async function create(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const name = newName.trim()
    if (!name) return
    const { error } = await supabase.from('groups').insert({ name })
    if (error) setError('Já existe um grupo com esse nome.')
    else {
      setNewName('')
      fetchGroups()
    }
  }

  async function rename(group: Group) {
    const name = editName.trim()
    if (!name) return
    const { error } = await supabase.from('groups').update({ name }).eq('id', group.id)
    if (error) setError('Já existe um grupo com esse nome.')
    else {
      setEditing(null)
      fetchGroups()
    }
  }

  async function remove(group: Group) {
    if (!confirm(`Excluir o grupo "${group.name}"?\n\nAs telas do grupo ficarão sem grupo e os anúncios vinculados a ele deixarão de ser exibidos nele.`)) return
    await supabase.from('groups').delete().eq('id', group.id)
    fetchGroups()
  }

  if (loading) {
    return <div className="loading">Carregando…</div>
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Grupos</h1>
          <p className="muted">
            Agrupe telas (ex: Lobby, Restaurantes) e escolha em quais grupos cada
            anúncio é exibido. Anúncio sem grupo aparece em todas as telas.
          </p>
        </div>
      </div>

      <form className="screen-form" onSubmit={create}>
        <input
          type="text"
          placeholder="Nome do grupo (ex: Lobby)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={40}
          required
        />
        <button type="submit" className="primary">
          <Plus size={18} />
          Criar grupo
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {groups.length === 0 ? (
        <div className="empty">
          Nenhum grupo ainda. Crie o primeiro para segmentar os anúncios por tela.
        </div>
      ) : (
        <div className="ad-list">
          {groups.map((g) => (
            <div key={g.id} className="ad-row">
              <div className="screen-icon">
                <Users size={20} />
              </div>
              <div className="ad-info">
                {editing?.id === g.id ? (
                  <input
                    type="text"
                    className="group-edit"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') rename(g)
                      if (e.key === 'Escape') setEditing(null)
                    }}
                    autoFocus
                  />
                ) : (
                  <strong>{g.name}</strong>
                )}
              </div>
              <div className="row-actions">
                {editing?.id === g.id ? (
                  <>
                    <button className="primary" onClick={() => rename(g)}>
                      Salvar
                    </button>
                    <button onClick={() => setEditing(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button
                      title="Renomear"
                      onClick={() => {
                        setEditing(g)
                        setEditName(g.name)
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button title="Excluir" className="danger" onClick={() => remove(g)}>
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GroupManager