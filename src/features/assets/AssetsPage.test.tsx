import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAsset } from '../../test/fixtures'
import { loggedInAs, renderWithAuth } from '../../test/renderWithAuth'
import * as api from './api'
import { AssetsPage } from './AssetsPage'

vi.mock('./api', () => ({ listAssets: vi.fn() }))
const listAssets = vi.mocked(api.listAssets)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('AssetsPage', () => {
  it('shows staff the inventory with condition, assignee, and edit links', async () => {
    listAssets.mockResolvedValue([
      makeAsset({ id: 1, asset_tag: 'LAP-0001', condition: 'needs_repair' }),
      makeAsset({
        id: 2,
        asset_tag: 'MON-0002',
        type: 'monitor',
        assigned_to: 'employee-id',
        assignee: { id: 'employee-id', full_name: 'Eve Employee', email: 'e@x.test' },
      }),
    ])
    renderWithAuth(<AssetsPage />, { auth: loggedInAs('it_staff') })

    // Ask for the table cell specifically: more precise than "any element
    // containing this text", which can match more than one thing.
    expect(await screen.findByRole('cell', { name: 'LAP-0001' })).toBeInTheDocument()
    expect(screen.getByText('Needs Repair')).toBeInTheDocument()
    expect(screen.getByText('In stock')).toBeInTheDocument()
    expect(screen.getByText('Eve Employee')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit MON-0002' })).toHaveAttribute(
      'href',
      '/assets/2/edit',
    )
    expect(screen.getByRole('link', { name: 'Add asset' })).toBeInTheDocument()
  })

  it('shows employees "My Assets" with no add, edit, or assignee column', async () => {
    listAssets.mockResolvedValue([makeAsset()])
    renderWithAuth(<AssetsPage />, { auth: loggedInAs('employee') })

    expect(await screen.findByRole('heading', { name: 'My Assets' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Add asset' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Assigned to' })).not.toBeInTheDocument()
  })

  it('shows a dash when brand and model are both missing', async () => {
    listAssets.mockResolvedValue([makeAsset({ brand: null, model: null })])
    renderWithAuth(<AssetsPage />, { auth: loggedInAs('it_staff') })
    expect(await screen.findByText('—')).toBeInTheDocument()
  })

  it('tells employees when nothing is assigned to them', async () => {
    listAssets.mockResolvedValue([])
    renderWithAuth(<AssetsPage />, { auth: loggedInAs('employee') })
    expect(await screen.findByText('No equipment is assigned to you.')).toBeInTheDocument()
  })
})
