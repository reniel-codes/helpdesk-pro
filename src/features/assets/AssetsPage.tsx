import { Link } from 'react-router'
import { Badge } from '../../components/Badge'
import { PageHeader } from '../../components/PageHeader'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage'
import { useQuery } from '../../lib/useQuery'
import { useAuth } from '../auth/AuthContext'
import { listAssets } from './api'
import { CONDITION_COLORS, CONDITION_LABELS, TYPE_LABELS } from './labels'

export function AssetsPage() {
  const { profile } = useAuth()
  const isStaff = profile?.role === 'admin' || profile?.role === 'it_staff'
  const { data: assets, error, loading, reload } = useQuery('assets', listAssets)

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={isStaff ? 'Assets' : 'My Assets'}
          description={isStaff ? 'Company equipment inventory.' : 'Equipment assigned to you.'}
        />
        {isStaff && (
          <Link
            to="/assets/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add asset
          </Link>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={reload} />}
      {loading && !assets && <LoadingMessage label="Loading assets…" />}

      {assets && assets.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-900">No assets yet</p>
          <p className="mt-1 text-sm text-slate-600">
            {isStaff
              ? 'Add laptops, monitors, and other equipment to start tracking them.'
              : 'No equipment is assigned to you.'}
          </p>
        </div>
      )}

      {assets && assets.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">Asset tag</th>
                <th scope="col" className="px-4 py-3">Type</th>
                <th scope="col" className="px-4 py-3">Brand / model</th>
                <th scope="col" className="px-4 py-3">Serial number</th>
                <th scope="col" className="px-4 py-3">Condition</th>
                {isStaff && <th scope="col" className="px-4 py-3">Assigned to</th>}
                {isStaff && <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{asset.asset_tag}</td>
                  <td className="px-4 py-3 text-slate-600">{TYPE_LABELS[asset.type]}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {[asset.brand, asset.model].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {asset.serial_number}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={CONDITION_COLORS[asset.condition]}>
                      {CONDITION_LABELS[asset.condition]}
                    </Badge>
                  </td>
                  {isStaff && (
                    <td className="px-4 py-3 text-slate-600">
                      {asset.assignee ? (
                        asset.assignee.full_name || asset.assignee.email
                      ) : (
                        <span className="text-slate-400">In stock</span>
                      )}
                    </td>
                  )}
                  {isStaff && (
                    <td className="px-4 py-3 text-right">
                      {/* aria-label: screen readers hear "Edit LAP-0001" instead of
                          a page full of identical "Edit" links. */}
                      <Link
                        to={`/assets/${asset.id}/edit`}
                        aria-label={`Edit ${asset.asset_tag}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
