import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Ad, Group, MediaType } from '../lib/types'
import { ArrowLeft, Upload } from 'lucide-react'

interface Props {
  ad: Ad | null
  onCancel: () => void
  onSaved: () => void
}

function AdForm({ ad, onCancel, onSaved }: Props) {
  const [title, setTitle] = useState(ad?.title ?? '')
  const [description, setDescription] = useState(ad?.description ?? '')
  const [duration, setDuration] = useState(ad?.duration?.toString() ?? '10')
  const [isActive, setIsActive] = useState(ad?.is_active ?? false)
  const [file, setFile] = useState<File | null>(null)
  const [mediaType, setMediaType] = useState<MediaType>(ad?.media_type ?? 'image')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data }) => setGroups(data ?? []))
    if (ad) {
      supabase
        .from('ad_groups')
        .select('group_id')
        .eq('ad_id', ad.id)
        .then(({ data }) =>
          setSelectedGroupIds((data ?? []).map((r) => r.group_id)),
        )
    }
  }, [ad])

  function toggleGroup(id: string) {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setMediaType(f.type.startsWith('video/') ? 'video' : 'image')
  }

  async function uploadMedia(): Promise<string | null> {
    if (file) {
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `ads/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('ad-media').upload(path, file)
      if (error) {
        setError(`Falha no upload: ${error.message}`)
        return null
      }
      return supabase.storage.from('ad-media').getPublicUrl(path).data.publicUrl
    }
    return ad?.media_url ?? null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const mediaUrl = await uploadMedia()
    if (!mediaUrl) {
      setSaving(false)
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      media_type: mediaType,
      media_url: mediaUrl,
      duration: mediaType === 'image' ? Number(duration) || 10 : null,
      is_active: isActive,
    }

    let adId = ad?.id
    if (ad) {
      const { error } = await supabase
        .from('ads')
        .update(payload)
        .eq('id', ad.id)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { data: max } = await supabase
        .from('ads')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
      const position = max && max[0] ? max[0].position + 1 : 0
      const { data, error } = await supabase
        .from('ads')
        .insert({ ...payload, position })
        .select('id')
        .single()
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
      adId = data.id
    }

    await supabase.from('ad_groups').delete().eq('ad_id', adId)
    if (selectedGroupIds.length > 0) {
      const { error } = await supabase.from('ad_groups').insert(
        selectedGroupIds.map((group_id) => ({ ad_id: adId, group_id })),
      )
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }
    onSaved()
    setSaving(false)
  }

  return (
    <div>
      <div className="page-head">
        <button className="ghost" onClick={onCancel}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <h1>{ad ? 'Editar anúncio' : 'Novo anúncio'}</h1>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Título
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label>
          Descrição
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>

        <div className="field-grid">
          {mediaType === 'image' && (
            <label>
              Duração (segundos)
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </label>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Exibir na playlist
          </label>
        </div>

        <div className="group-picker">
          <span className="group-picker-label">Exibir nos grupos</span>
          {groups.length === 0 ? (
            <p className="muted">
              Nenhum grupo cadastrado (aba Grupos). Sem grupo, o anúncio aparece
              em todas as telas.
            </p>
          ) : (
            <div className="group-picker-options">
              {groups.map((g) => (
                <label key={g.id} className="check">
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.includes(g.id)}
                    onChange={() => toggleGroup(g.id)}
                  />
                  {g.name}
                </label>
              ))}
            </div>
          )}
          <p className="muted group-picker-hint">
            {selectedGroupIds.length === 0
              ? 'Sem seleção: exibido em todas as telas.'
              : 'Exibido apenas nas telas dos grupos selecionados.'}
          </p>
        </div>

        <label>
          Mídia {mediaType === 'image' ? '(imagem)' : '(vídeo)'}
          <div className="drop-zone">
            {previewUrl || ad?.media_url ? (
              <>
                {mediaType === 'image' ? (
                  <img src={previewUrl ?? ad?.media_url} alt="Prévia" />
                ) : (
                  <video src={previewUrl ?? ad?.media_url} muted controls />
                )}
                <input
                  type="file"
                  accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileChange}
                />
              </>
            ) : (
              <label className="drop-hint">
                <Upload size={24} />
                <span>Clique para escolher imagem ou vídeo</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        </label>

        {error && <p className="error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdForm
