import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAsset } from '../../test/fixtures'
import { loggedInAs, renderWithAuth } from '../../test/renderWithAuth'
import * as api from './api'
import { AssetFormPage } from './AssetFormPage'

vi.mock('./api', () => ({
  getAsset: vi.fn(),
  createAsset: vi.fn(),
  updateAsset: vi.fn(),
  listPeople: vi.fn(),
}))
const mocked = vi.mocked(api)

beforeEach(() => {
  vi.resetAllMocks()
  mocked.listPeople.mockResolvedValue([
    { id: 'employee-id', full_name: 'Eve Employee', email: 'employee@helpdesk.test' },
  ])
  mocked.createAsset.mockResolvedValue(99)
  mocked.updateAsset.mockResolvedValue()
})

function renderAt(route: string) {
  return renderWithAuth(
    <Routes>
      <Route path="/assets" element={<p>Asset list</p>} />
      <Route path="/assets/new" element={<AssetFormPage />} />
      <Route path="/assets/:id/edit" element={<AssetFormPage />} />
    </Routes>,
    { auth: loggedInAs('it_staff'), route },
  )
}

describe('AssetFormPage: add', () => {
  it('requires asset tag and serial number', async () => {
    const user = userEvent.setup()
    renderAt('/assets/new')

    await user.click(screen.getByRole('button', { name: 'Add asset' }))

    expect(screen.getByText('Asset tag is required.')).toBeInTheDocument()
    expect(screen.getByText('Serial number is required.')).toBeInTheDocument()
    expect(mocked.createAsset).not.toHaveBeenCalled()
  })

  it('creates the asset with cleaned-up values and returns to the list', async () => {
    const user = userEvent.setup()
    renderAt('/assets/new')

    await user.type(screen.getByLabelText('Asset tag'), ' MON-0010 ')
    await user.type(screen.getByLabelText('Serial number'), 'CN-77-XYZ')
    await user.selectOptions(screen.getByLabelText('Type'), 'monitor')
    await screen.findByRole('option', { name: 'Eve Employee' })
    await user.selectOptions(screen.getByLabelText('Assigned to'), 'employee-id')
    await user.click(screen.getByRole('button', { name: 'Add asset' }))

    expect(mocked.createAsset).toHaveBeenCalledWith({
      asset_tag: 'MON-0010',
      serial_number: 'CN-77-XYZ',
      type: 'monitor',
      brand: null,
      model: null,
      condition: 'new',
      assigned_to: 'employee-id',
      purchase_date: null,
      notes: null,
    })
    expect(await screen.findByText('Asset list')).toBeInTheDocument()
  })

  it('shows a friendly message for a duplicate tag or serial number', async () => {
    const user = userEvent.setup()
    mocked.createAsset.mockRejectedValue(
      new Error('An asset with this asset tag or serial number already exists.'),
    )
    renderAt('/assets/new')

    await user.type(screen.getByLabelText('Asset tag'), 'LAP-0001')
    await user.type(screen.getByLabelText('Serial number'), 'DUPLICATE')
    await user.click(screen.getByRole('button', { name: 'Add asset' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('already exists')
    expect(screen.queryByText('Asset list')).not.toBeInTheDocument()
  })
})

describe('AssetFormPage: edit', () => {
  it('loads the asset into the form and saves changes', async () => {
    const user = userEvent.setup()
    mocked.getAsset.mockResolvedValue(makeAsset({ id: 5, asset_tag: 'LAP-0005' }))
    renderAt('/assets/5/edit')

    expect(await screen.findByRole('heading', { name: 'Edit LAP-0005' })).toBeInTheDocument()
    expect(screen.getByLabelText('Brand (optional)')).toHaveValue('Dell')

    await user.selectOptions(screen.getByLabelText('Condition'), 'needs_repair')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(mocked.getAsset).toHaveBeenCalledWith(5)
    expect(mocked.updateAsset).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ asset_tag: 'LAP-0005', condition: 'needs_repair' }),
    )
    expect(await screen.findByText('Asset list')).toBeInTheDocument()
  })

  it('shows "not found" for an asset that does not exist', async () => {
    mocked.getAsset.mockResolvedValue(null)
    renderAt('/assets/404/edit')
    expect(await screen.findByRole('heading', { name: 'Asset not found' })).toBeInTheDocument()
  })
})
