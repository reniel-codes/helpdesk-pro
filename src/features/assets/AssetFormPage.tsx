import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  errorTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/formStyles'
import { PageHeader } from '../../components/PageHeader'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage'
import { errorMessage, useQuery } from '../../lib/useQuery'
import { createAsset, getAsset, listPeople, updateAsset, type AssetCondition, type AssetType } from './api'
import {
  ASSET_TAG_MAX,
  BRAND_MODEL_MAX,
  EMPTY_ASSET_FORM,
  NOTES_MAX,
  SERIAL_MAX,
  todayLocal,
  toAssetInput,
  toFormValues,
  validateAsset,
  type AssetFieldErrors,
  type AssetFormValues,
} from './assetForm'
import { ASSET_CONDITIONS, ASSET_TYPES, CONDITION_LABELS, TYPE_LABELS } from './labels'

/**
 * One page for both "Add asset" (/assets/new) and "Edit asset" (/assets/:id/edit).
 * If the URL has an :id we're editing; otherwise we're creating.
 */
export function AssetFormPage() {
  const { id: idParam } = useParams()
  const isEdit = idParam !== undefined
  const id = Number(idParam)
  const validId = Number.isInteger(id) && id > 0

  const {
    data: asset,
    error,
    loading,
    reload,
  } = useQuery(`asset:${idParam ?? 'new'}`, () =>
    isEdit && validId ? getAsset(id) : Promise.resolve(null),
  )

  if (isEdit) {
    if (error) return <ErrorMessage message={error} onRetry={reload} />
    if (loading && !asset) return <LoadingMessage label="Loading asset…" />
    if (!asset) {
      return (
        <div className="py-12 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Asset not found</h1>
          <Link to="/assets" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to assets
          </Link>
        </div>
      )
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={asset ? `Edit ${asset.asset_tag}` : 'Add asset'}
        description={asset ? 'Update details, condition, or who has it.' : 'Register a new piece of equipment.'}
      />
      {/* key: start the form fresh if we switch between different assets. */}
      <AssetForm
        key={asset?.id ?? 'new'}
        assetId={asset?.id ?? null}
        initial={asset ? toFormValues(asset) : EMPTY_ASSET_FORM}
      />
    </div>
  )
}

type FormProps = { assetId: number | null; initial: AssetFormValues }

function AssetForm({ assetId, initial }: FormProps) {
  const navigate = useNavigate()
  const { data: people, error: peopleError } = useQuery('people', listPeople)

  // One state object for the whole form instead of nine separate useStates.
  const [values, setValues] = useState(initial)
  const [fieldErrors, setFieldErrors] = useState<AssetFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Returns a change handler for one field. `...values` copies every other field
  // unchanged, then [field] overwrites just this one.
  function update<K extends keyof AssetFormValues>(field: K) {
    return (e: { target: { value: string } }) =>
      setValues({ ...values, [field]: e.target.value as AssetFormValues[K] })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const errors = validateAsset(values)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const input = toAssetInput(values)
      if (assetId === null) await createAsset(input)
      else await updateAsset(assetId, input)
      navigate('/assets')
    } catch (err) {
      setFormError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-lg border border-slate-200 bg-white p-6"
    >
      {formError && <ErrorMessage message={formError} />}
      {peopleError && <ErrorMessage message={`Could not load people: ${peopleError}`} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="asset_tag"
          label="Asset tag"
          value={values.asset_tag}
          onChange={update('asset_tag')}
          maxLength={ASSET_TAG_MAX}
          placeholder="e.g. LAP-0042"
          error={fieldErrors.asset_tag}
        />
        <TextField
          id="serial_number"
          label="Serial number"
          value={values.serial_number}
          onChange={update('serial_number')}
          maxLength={SERIAL_MAX}
          error={fieldErrors.serial_number}
        />

        <div>
          <label htmlFor="type" className={labelClass}>
            Type
          </label>
          <select id="type" value={values.type} onChange={update('type')} className={inputClass}>
            {ASSET_TYPES.map((t: AssetType) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="condition" className={labelClass}>
            Condition
          </label>
          <select
            id="condition"
            value={values.condition}
            onChange={update('condition')}
            className={inputClass}
          >
            {ASSET_CONDITIONS.map((c: AssetCondition) => (
              <option key={c} value={c}>
                {CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <TextField
          id="brand"
          label="Brand (optional)"
          value={values.brand}
          onChange={update('brand')}
          maxLength={BRAND_MODEL_MAX}
          placeholder="e.g. Dell"
          error={fieldErrors.brand}
        />
        <TextField
          id="model"
          label="Model (optional)"
          value={values.model}
          onChange={update('model')}
          maxLength={BRAND_MODEL_MAX}
          placeholder="e.g. Latitude 5440"
          error={fieldErrors.model}
        />

        <div>
          <label htmlFor="assigned_to" className={labelClass}>
            Assigned to
          </label>
          <select
            id="assigned_to"
            value={values.assigned_to}
            onChange={update('assigned_to')}
            className={inputClass}
          >
            <option value="">Nobody (in stock)</option>
            {people?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.email}
              </option>
            ))}
          </select>
        </div>

        <TextField
          id="purchase_date"
          label="Purchase date (optional)"
          type="date"
          value={values.purchase_date}
          onChange={update('purchase_date')}
          max={todayLocal()}
          error={fieldErrors.purchase_date}
        />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes (optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={values.notes}
          onChange={update('notes')}
          maxLength={NOTES_MAX}
          aria-invalid={!!fieldErrors.notes}
          className={inputClass}
        />
        {fieldErrors.notes && <p className={errorTextClass}>{fieldErrors.notes}</p>}
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : assetId === null ? 'Add asset' : 'Save changes'}
        </button>
        <Link to="/assets" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  )
}

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (e: { target: { value: string } }) => void
  error?: string
  type?: string
  maxLength?: number
  max?: string
  placeholder?: string
}

/** A labelled input with its error message wired up for screen readers. */
function TextField({ id, label, error, ...inputProps }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
      />
      {error && (
        <p id={`${id}-error`} className={errorTextClass}>
          {error}
        </p>
      )}
    </div>
  )
}
