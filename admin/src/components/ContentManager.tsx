import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Ad } from '../lib/types'
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Play,
  Pause,
  Image as ImageIcon,
  Film,
} from 'lucide-react'
import AdForm from './AdForm'

function ContentManager() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Ad | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAds = useCallback(async () => {
    const { data, error } = await supabase
      .from('ads')
      .select('*, ad_groups(groups(name))')
      .order('position', { ascending: true })
    if (error) {
      setError(error.message)
      return
    }
    setAds(data ?? [])
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  async function toggleActive(ad: Ad) {
    await supabase.from('ads').update({ is_active: !ad.is_active }).eq('id', ad.id)
    fetchAds()
  }

  async function remove(ad: Ad) {
    if (!confirm(`Excluir "${ad.title}"?`)) return
    await supabase.from('ads').delete().eq('id', ad.id)
    fetchAds()
  }

  async function move(ad: Ad, dir: -1 | 1) {
    const idx = ads.findIndex((a) => a.id === ad.id)
    const other = ads[idx + dir]
    if (!other) return
    await supabase.from('ads').update({ position: other.position }).eq('id', ad.id)
    await supabase.from('ads').update({ position: ad.position }).eq('id', other.id)
    fetchAds()
  }

  if (loading) {
    return <div className="loading">Carregando…</div>
  }

  if (creating || editing) {
    return (
      <AdForm
        ad={editing}
        onCancel={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSaved={() => {
          setCreating(false)
          setEditing(null)
          fetchAds()
        }}
      />
    )
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Conteúdos</h1>
          <p className="muted">
            Playlist segmentada por grupo: anúncio sem grupo aparece em todas as
            telas.
          </p>
        </div>
        <button className="primary" onClick={() => setCreating(true)}>
          <Plus size={18} />
          Novo anúncio
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {ads.length === 0 ? (
        <div className="empty">
          Nenhum anúncio ainda. Crie o primeiro para começar a exibir.
        </div>
      ) : (
        <div className="ad-list">
          {ads.map((ad, i) => (
            <div key={ad.id} className={`ad-row ${ad.is_active ? '' : 'inactive'}`}>
              <div className="thumb">
                {ad.media_type === 'image' ? (
                  <img src={ad.media_url} alt={ad.title} />
                ) : (
                  <video src={ad.media_url} muted preload="metadata" />
                )}
                {ad.media_type === 'image' ? (
                  <ImageIcon size={14} />
                ) : (
                  <Film size={14} />
                )}
              </div>
              <div className="ad-info">
                <strong>{ad.title}</strong>
                <span className="muted">
                  {ad.media_type === 'image'
                    ? `Imagem · ${ad.duration ?? 10}s`
                    : 'Vídeo'}
                  {ad.play_count ? ` · ${ad.play_count} reproduções` : ' · nunca reproduzido'}
                </span>
                {ad.description && <p>{ad.description}</p>}
              </div>
              {(() => {
                const groupNames =
                  ad.ad_groups
                    ?.map((ag) => ag.groups?.name)
                    .filter((n): n is string => Boolean(n)) ?? []
                return groupNames.length === 0 ? (
                  <span className="badge group-all" title="Exibido em todas as telas">
                    Todas as telas
                  </span>
                ) : (
                  <span className="badge group-list" title="Exibido apenas nestes grupos">
                    {groupNames.join(', ')}
                  </span>
                )
              })()}
              <span className={`badge ${ad.is_active ? 'on' : 'off'}`}>
                {ad.is_active ? 'Ativo' : 'Inativo'}
              </span>
              <div className="row-actions">
                <button
                  title="Mover para cima"
                  disabled={i === 0}
                  onClick={() => move(ad, -1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  title="Mover para baixo"
                  disabled={i === ads.length - 1}
                  onClick={() => move(ad, 1)}
                >
                  <ArrowDown size={16} />
                </button>
                <button title="Editar" onClick={() => setEditing(ad)}>
                  <Pencil size={16} />
                </button>
                <button
                  title={ad.is_active ? 'Desativar' : 'Ativar'}
                  onClick={() => toggleActive(ad)}
                >
                  {ad.is_active ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button title="Excluir" className="danger" onClick={() => remove(ad)}>
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

export default ContentManager
