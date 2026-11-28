import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { mealLabels } from './nutritionPlanApi'
import type { MealType, NutritionPlanResponse, PlanContentRequest } from './nutritionPlanApi'
import { blankItem, copyItems, draftContent, draftSignature, planDays, planDraft, validateDraft } from './planDraft'
import type { ItemForm, PlanDraft } from './planDraft'
import { PlanConfirmation } from './PlanConfirmation'

const shortDays = ['Her gün', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const statusLabels = { draft: 'Taslak', active: 'Aktif', archived: 'Arşiv' }
const mealTypes = Object.keys(mealLabels) as MealType[]
const IconSlot = () => <span className="plan-icon-slot" aria-hidden="true" />

// A group is one choice, not a list of foods to consume together.
function suggestionGroups(items: ItemForm[]) {
  const groups = new Map<string, ItemForm[]>()
  for (const item of items) {
    const key = item.group || item.key
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return [...groups.values()]
}

function SuggestionCards({ items, groups, selected, onSelect }: {
  items: ItemForm[]; groups: string[]; selected?: string; onSelect: (item: ItemForm) => void
}) {
  return suggestionGroups(items).map(rows => <div key={rows[0]!.key} className={rows[0]!.group ? 'plan-alternatives' : 'plan-independent'}>
    {rows[0]!.group && <small>Alternatif {groups.indexOf(rows[0]!.group) + 1} · Birini seçin</small>}
    {rows.map((item, index) => <div key={item.key}>
      {index > 0 && <span className="plan-or">veya</span>}
      <button type="button" className="plan-suggestion-card" aria-label={`${item.description || 'Boş öneri'} önerisini düzenle`} aria-pressed={selected === item.key} onClick={() => onSelect(item)}>
        <strong>{item.description || 'Açıklama ekleyin'}</strong>
        <span>{item.quantity || 'Miktar belirtilmemiş'}</span>
        {item.day === '' && <small>Her gün</small>}
      </button>
    </div>)}
  </div>)
}

export function NutritionPlanEditor({ initial, seed, clientName, busy, onDirtyChange, onSave, onCancel, onCopy, onPrint }: {
  initial?: NutritionPlanResponse; seed?: PlanDraft; clientName?: string; busy: boolean;
  onDirtyChange?: (dirty: boolean) => void; onSave: (value: PlanContentRequest) => Promise<void>; onCancel: () => void;
  onCopy?: () => void; onPrint?: () => void
}) {
  const [baseline] = useState(() => planDraft(initial))
  const [draft, setDraft] = useState(() => seed ?? baseline)
  const [day, setDay] = useState(() => draft.items[0]!.day)
  const [meal, setMeal] = useState<MealType>(() => draft.items[0]!.meal)
  const [selected, setSelected] = useState<string | undefined>(() => draft.items[0]!.key)
  const [groups, setGroups] = useState(() => [...new Set(draft.items.flatMap(row => row.group ? [row.group] : []))])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [focus, setFocus] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MealType | ''>('')
  const [copyDay, setCopyDay] = useState(() => day === '1' ? '2' : '1')
  const [replaceDay, setReplaceDay] = useState(false)
  const [message, setMessage] = useState('')
  const titleInput = useRef<HTMLInputElement>(null)
  const item = draft.items.find(row => row.key === selected)
  const index = item ? draft.items.indexOf(item) + 1 : 0
  useEffect(() => { titleInput.current?.focus() }, [])
  const dirty = draftSignature(draft) !== draftSignature(baseline)
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  useEffect(() => { if (focus) document.getElementById(focus)?.focus() }, [focus])
  const updateDraft = (value: Partial<PlanDraft>) => { setDraft(current => ({ ...current, ...value })); setErrors({}); setMessage('') }
  function selectCell(value: string, type = meal) {
    setDay(value); setMeal(type)
    setSelected(draft.items.find(row => row.day === value && row.meal === type)?.key)
    if (value === copyDay) setCopyDay(value === '7' ? '1' : String(Number(value) + 1))
  }
  function selectItem(row: ItemForm) {
    setDay(row.day); setMeal(row.meal); setSelected(row.key)
    if (row.day === copyDay) setCopyDay(row.day === '7' ? '1' : String(Number(row.day) + 1))
  }
  function update(key: string, value: Partial<ItemForm>) { updateDraft({ items: draft.items.map(row => row.key === key ? { ...row, ...value } : row) }) }
  function add(rows?: ItemForm[]) {
    const added = rows ? copyItems(rows, day).map(row => ({ ...row, meal })) : [{ ...blankItem(day), meal }]
    if (draft.items.length + added.length > 100) { setMessage('Lütfen 100 öğün önerisi sınırını aşmayın.'); return }
    updateDraft({ items: [...draft.items, ...added] }); setSelected(added[0]!.key)
    setGroups(current => [...new Set([...current, ...added.flatMap(row => row.group ? [row.group] : [])])])
    setFocus(`description-${added[0]!.key}`)
  }
  function copy(replace = false) {
    if (busy) return
    const source = draft.items.filter(row => row.day === day)
    const target = draft.items.filter(row => row.day === copyDay)
    if (!source.length || day === copyDay || day === '') { setMessage('Farklı bir haftalık kaynak ve hedef gün seçin.'); return }
    if (draft.items.length - (replace ? target.length : 0) + source.length > 100) { setMessage('Kopyalama 100 öğün önerisi sınırını aşıyor.'); return }
    if (target.length && !replace) { setReplaceDay(true); return }
    const copied = copyItems(source, copyDay)
    const targetIndex = draft.items.findIndex(row => row.day === copyDay)
    const kept = draft.items.filter(row => !replace || row.day !== copyDay)
    kept.splice(targetIndex < 0 ? kept.length : targetIndex, 0, ...copied)
    updateDraft({ items: kept }); setGroups(current => [...new Set([...current, ...copied.flatMap(row => row.group ? [row.group] : [])])])
    setDay(copyDay); setCopyDay(day); setMeal(copied[0]!.meal); setSelected(copied[0]!.key); setReplaceDay(false)
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return
    const found = validateDraft(draft); setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      const invalid = draft.items.find(row => first.endsWith(row.key))
      if (invalid) selectItem(invalid)
      setFocus(first); requestAnimationFrame(() => document.getElementById(first)?.focus()); return
    }
    await onSave(draftContent(draft))
  }
  function error(id: string) { return errors[id] ? <p id={`${id}-error`} className="error-message" role="alert">{errors[id]}</p> : null }
  function field(id: string) { return { 'aria-invalid': !!errors[id], 'aria-describedby': errors[id] ? `${id}-error` : undefined } }
  const reusable = suggestionGroups(draft.items).filter(rows => (!filter || rows[0]!.meal === filter) && rows.some(row => `${row.description} ${row.quantity}`.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR'))))
  const dayItems = draft.items.filter(row => row.day === '' || row.day === day)
  const cards = (rows: ItemForm[]) => <SuggestionCards items={rows} groups={groups} selected={selected} onSelect={selectItem} />
  return <form className="nutrition-editor plan-workbench" aria-label="Beslenme programı formu" noValidate onSubmit={event => { void submit(event) }}>
    <fieldset className="plan-workbench-fields" disabled={busy}>
      <legend className="sr-only">Program düzenleyici</legend>
      <button className="plan-return" type="button" onClick={onCancel}><IconSlot />{clientName ? `${clientName} · Programlara dön` : 'Programlara dön'}</button>
      <header className="plan-editor-heading">
        <h2>Beslenme programı oluşturucu</h2>
        <label className="sr-only" htmlFor="plan-title">Program başlığı</label><input ref={titleInput} className="plan-title-input" id="plan-title" {...field('plan-title')} value={draft.title} placeholder="Program adını yazın" required onChange={event => updateDraft({ title: event.target.value })} />{error('plan-title')}
        <p>{clientName && <strong>Hedef danışan: {clientName}</strong>}<span>{initial ? `${statusLabels[initial.status]} · Sürüm ${initial.versionNumber}` : 'Yeni taslak'}</span></p>
        <div className="plan-editor-actions">
          {onCopy && <button className="button button-secondary" type="button" onClick={onCopy}><IconSlot />Kendi programımdan kopyala</button>}
          {onPrint && <button className="button button-secondary" type="button" onClick={onPrint}><IconSlot />Yazdır</button>}
          <button className="button button-primary" type="submit"><IconSlot />{busy ? 'Kaydediliyor…' : initial ? 'Yeni sürüm kaydet' : 'Taslak oluştur'}</button>
          <button className="button button-secondary" type="button" onClick={onCancel}><IconSlot />Vazgeç</button>
        </div>
        <div className="plan-save-state" role="status">{dirty ? 'Kaydedilmemiş değişiklikler var' : 'Değişiklik yok'}</div>
        <small>Kaydetmek ayrı bir işlemdir. Taslağı danışana atamak için program listesinden etkinleştirin.</small>
        {onPrint && <small>Yazdır, kayıtlı sürümü açar. Bu sayfadaki değişiklikleri yazdırmadan önce kaydedin.</small>}
      </header>
      {seed && <p className="plan-editor-note">Yalnız öğün yapısı kopyalandı. Serbest metin kişiye özel bilgi içerebilir; açıklama ve miktarları kaydetmeden önce inceleyin. Başlık, tarihler ve hedefleri bu danışan için girin.</p>}
      <section className="plan-workbench-card plan-goals" aria-labelledby="plan-goals-title">
        <h3 id="plan-goals-title">Hedef</h3>
        <div className="plan-goal-fields">
          <div className="form-field"><label htmlFor="plan-start">Başlangıç tarihi</label><input id="plan-start" {...field('plan-start')} type="date" value={draft.start} required onChange={event => updateDraft({ start: event.target.value })} />{error('plan-start')}</div>
          <div className="form-field"><label htmlFor="plan-end">Bitiş tarihi <small>(isteğe bağlı)</small></label><input id="plan-end" {...field('plan-end')} type="date" value={draft.end} onChange={event => updateDraft({ end: event.target.value })} />{error('plan-end')}</div>
          <div className="form-field"><label htmlFor="plan-kcal">Günlük enerji hedefi <small>(kcal, isteğe bağlı)</small></label><input id="plan-kcal" {...field('plan-kcal')} inputMode="decimal" value={draft.calories} placeholder="Belirtilmemiş" onChange={event => updateDraft({ calories: event.target.value })} />{error('plan-kcal')}</div>
          <div className="form-field"><label htmlFor="plan-water">Günlük su hedefi <small>(mL, isteğe bağlı)</small></label><input id="plan-water" {...field('plan-water')} inputMode="decimal" value={draft.water} placeholder="Belirtilmemiş" onChange={event => updateDraft({ water: event.target.value })} />{error('plan-water')}</div>
        </div>
        <p>Hedefler otomatik hesaplanmaz. Ondalık için virgül veya nokta kullanabilirsiniz.</p>
      </section>
      <section className="plan-workbench-card plan-daily-summary" aria-labelledby="plan-summary-title">
        <header><h3 id="plan-summary-title">{planDays[Number(day)]} · program özeti</h3>
          <div className="plan-summary-days" role="group" aria-label="Program günü">{planDays.map((label, i) => <button key={label} type="button" aria-label={label} aria-pressed={day === (i ? String(i) : '')} onClick={() => selectCell(i ? String(i) : '')}>{shortDays[i]}</button>)}</div>
        </header>
        <div className="plan-summary-body">
          <div className="plan-summary-empty"><div className="plan-empty-ring">Veri yok</div><small>Makro dağılımı hesaplanamıyor</small></div>
          <div className="plan-summary-metrics">{['Enerji', 'Karbonhidrat', 'Protein', 'Yağ'].map(label => <div key={label}><div><strong>{label}</strong><span>Besin değeri yok</span></div><div className="plan-empty-track" aria-hidden="true" /></div>)}</div>
        </div>
        <p>{dayItems.length} geçerli öneri kaydı · Kalori ve makro bilgisi bulunmadığından toplam ve hedef yüzdesi hesaplanmaz. Gerçek tüketim bu özete dahil değildir.</p>
      </section>
      <div className="plan-work-area">
        <aside className="plan-workbench-card plan-suggestion-panel" aria-label="Program önerileri">
          <h3>Program önerileri</h3>
          <label className="plan-search"><IconSlot /><span className="sr-only">Öneri ara</span><input type="search" placeholder="Öneri ara" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <div className="plan-suggestion-filters" role="group" aria-label="Öneri filtresi">{(['', ...mealTypes] as const).map(type => <button key={type} type="button" aria-pressed={filter === type} onClick={() => setFilter(type)}>{type ? mealLabels[type] : 'Tümü'}</button>)}</div>
          <div className="plan-selected-cell" aria-live="polite"><IconSlot /><span>Seçili hücre<strong>{planDays[Number(day)]} · {mealLabels[meal]}</strong></span></div>
          <p className="plan-panel-caption">Bu programdaki önerileri seçin veya seçili hücreye ekleyin. Besin kataloğu bağlı değil.</p>
          <ul className="plan-reusable-list" aria-label="Mevcut öneriler">{reusable.map(rows => <li key={rows[0]!.key}>
            <span className="plan-food-slot" aria-hidden="true" />
            <div><strong>{rows.map(row => row.description || 'Boş öneri').join(' veya ')}</strong><small>{rows[0]!.group ? `Alternatif ${groups.indexOf(rows[0]!.group) + 1} · Birini seçin` : rows[0]!.quantity || 'Miktar belirtilmemiş'}</small>
              <div><button type="button" onClick={() => selectItem(rows[0]!)}>Düzenle</button><button type="button" disabled={draft.items.length + rows.length > 100} onClick={() => add(rows)}>{rows[0]!.group ? 'Grubu ekle' : 'Hücreye ekle'}</button></div>
            </div>
          </li>)}</ul>
          {reusable.length === 0 && <p>Aramaya uygun öneri yok.</p>}
          <button id="plan-add-item" className="button button-secondary" type="button" disabled={draft.items.length >= 100} onClick={() => add()}><IconSlot />Öğün önerisi ekle</button>{error('plan-add-item')}
          <section className="plan-item-form" aria-label="Seçili öneriyi düzenle">
            <h4>{item ? `Öğün ${index} önerisini düzenle` : 'Manuel öneri'}</h4>
            {item ? <>
              <div className="plan-item-location"><label>Gün<select aria-label={`Öğün ${index} günü`} value={item.day} onChange={event => { update(item.key, { day: event.target.value }); setDay(event.target.value) }}>{planDays.map((label, i) => <option key={label} value={i ? String(i) : ''}>{label}</option>)}</select></label>
                <label>Öğün türü<select aria-label={`Öğün ${index} türü`} value={item.meal} onChange={event => { update(item.key, { meal: event.target.value as MealType }); setMeal(event.target.value as MealType) }}>{mealTypes.map(type => <option key={type} value={type}>{mealLabels[type]}</option>)}</select></label></div>
              <label htmlFor={`description-${item.key}`}>Öğün {index} açıklaması</label><textarea id={`description-${item.key}`} {...field(`description-${item.key}`)} rows={3} value={item.description} required onChange={event => update(item.key, { description: event.target.value })} />{error(`description-${item.key}`)}
              <label htmlFor={`quantity-${item.key}`}>Öğün {index} miktar önerisi (isteğe bağlı)</label><input id={`quantity-${item.key}`} {...field(`quantity-${item.key}`)} value={item.quantity} onChange={event => update(item.key, { quantity: event.target.value })} />{error(`quantity-${item.key}`)}
              <label htmlFor={`group-${item.key}`}>Alternatif grubu</label><select id={`group-${item.key}`} {...field(`group-${item.key}`)} aria-label={`Öğün ${index} alternatif grubu`} value={item.group} onChange={event => {
                if (event.target.value === 'new') { const id = crypto.randomUUID(); setGroups(current => [...current, id]); update(item.key, { group: id }) }
                else update(item.key, { group: event.target.value })
              }}><option value="">Bağımsız öneri</option>{groups.map((group, i) => <option key={group} value={group}>Alternatif {i + 1}</option>)}<option value="new">Yeni alternatif grubu</option></select>{error(`group-${item.key}`)}
              <p>Aynı gün ve öğünde en az iki öneri bir alternatif oluşturur; birlikte tüketilmez.</p>
              <button className="button button-secondary" type="button" disabled={draft.items.length === 1} onClick={() => { updateDraft({ items: draft.items.filter(row => row.key !== item.key) }); setSelected(draft.items.find(row => row.key !== item.key && row.day === day && row.meal === meal)?.key) }}>Öğün {index} önerisini kaldır</button>
            </> : <p>Bir öneri kartını seçin veya bu hücreye yeni öneri ekleyin.</p>}
          </section>
        </aside>
        <section className="plan-workbench-card plan-week" aria-labelledby="plan-week-title">
          <header><h3 id="plan-week-title">Haftalık ızgara</h3><div className="plan-copy-day"><label>Hedef gün<select value={copyDay} onChange={event => setCopyDay(event.target.value)}>{planDays.slice(1).map((label, i) => <option key={label} value={String(i + 1)} disabled={day === String(i + 1)}>{label}</option>)}</select></label><button className="button button-secondary" type="button" disabled={day === ''} onClick={() => copy()}><IconSlot />Günü kopyala</button></div></header>
          <details className="plan-everyday" open={day === '' ? true : undefined}><summary><IconSlot />Her gün · {draft.items.filter(row => row.day === '').length} ortak öneri</summary>
            <p>Her gün önerileri haftanın tüm günlerinde geçerlidir; güne özel önerilerle birlikte gösterilir, onların yerine geçmez. Burada bir kez kaydedilir ve düzenlenir.</p>
            <div>{mealTypes.map(type => <section key={type}><button className="plan-cell-select" type="button" aria-pressed={day === '' && meal === type} onClick={() => selectCell('', type)}>Her gün · {mealLabels[type]} seç</button>{cards(draft.items.filter(row => row.day === '' && row.meal === type))}</section>)}</div>
          </details>
          <p className="plan-grid-hint">Bir hücreyi seçip sol panelden öneri ekleyin. Tabloyu yatay kaydırarak diğer günlere ulaşabilirsiniz.</p>
          <div className="plan-week-scroll" role="region" aria-label="Haftalık program tablosu" tabIndex={0}>
            <table className="plan-week-table" aria-label="Gün ve öğün ızgarası"><thead><tr><th scope="col"><span className="sr-only">Öğün</span></th>{planDays.slice(1).map((label, i) => <th scope="col" key={label}><button type="button" aria-label={`${label} sütununu seç`} aria-pressed={day === String(i + 1)} onClick={() => selectCell(String(i + 1))}>{label}</button></th>)}</tr></thead>
              <tbody>{mealTypes.map(type => <tr key={type}><th scope="row">{mealLabels[type]}</th>{planDays.slice(1).map((label, i) => {
                const value = String(i + 1), own = draft.items.filter(row => row.day === value && row.meal === type), shared = draft.items.filter(row => row.day === '' && row.meal === type)
                return <td key={label} className={day === value && meal === type ? 'is-selected' : ''}>
                  <button className="plan-cell-select" type="button" aria-label={`${label} ${mealLabels[type]} hücresini seç`} aria-pressed={day === value && meal === type} onClick={() => selectCell(value, type)}>{day === value && meal === type ? 'Seçili hücre' : 'Hücreyi seç'}</button>
                  {shared.length > 0 && <div className="plan-shared-cards">{cards(shared)}</div>}{cards(own)}
                  {!own.length && <small className="plan-cell-empty">Güne özel öneri yok</small>}
                </td>
              })}</tr>)}</tbody>
            </table>
          </div>
          <p className="plan-panel-caption">Miktarlar serbest metindir. Her gün etiketli kartı düzenlemek tüm günlere uygulanan tek öneriyi değiştirir.</p>
        </section>
      </div>
      {message && <p className="error-message" role="alert">{message}</p>}
    </fieldset>
    {replaceDay && <PlanConfirmation title="Hedef gün dolu" confirmLabel="Hedef günü değiştir" onCancel={() => setReplaceDay(false)} onConfirm={() => copy(true)}><p>{planDays[Number(copyDay)]} önerileri silinip {planDays[Number(day)]} önerileriyle değiştirilecek. Her gün önerileri korunacak.</p></PlanConfirmation>}
  </form>
}
