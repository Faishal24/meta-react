import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {AxiosInstance} from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { DisplayNameForm } from './DisplayNameForm';

function mockAxios(patch: ReturnType<typeof vi.fn>): AxiosInstance {
  return { patch } as unknown as AxiosInstance;
}

describe('DisplayNameForm', () => {
  it('shows the current name and status', () => {
    render(
      <DisplayNameForm
        phoneNumberId="106"
        verifiedName="Acme Sales"
        nameStatus="APPROVED"
        axios={mockAxios(vi.fn())}
      />,
    );

    expect(screen.getByText('Acme Sales')).toBeTruthy();
    expect(screen.getByText('APPROVED')).toBeTruthy();
  });

  it('locks the form when the number is an Official Business Account', () => {
    render(
      <DisplayNameForm
        phoneNumberId="106"
        verifiedName="Acme"
        nameStatus="APPROVED"
        obaStatus="APPROVED"
        axios={mockAxios(vi.fn())}
      />,
    );

    expect(screen.queryByPlaceholderText('New display name')).toBeNull();
    expect(
      screen.getByText(/Official Business Account; renames go through Meta/),
    ).toBeTruthy();
  });

  it('submits a new display name', async () => {
    const patch = vi.fn().mockResolvedValue({ data: { data: {} } });
    render(
      <DisplayNameForm
        phoneNumberId="106"
        verifiedName="Old"
        nameStatus="APPROVED"
        axios={mockAxios(patch)}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('New display name'), {
      target: { value: 'New Name' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        'api/whatsapp/phone-numbers/106/display-name',
        { new_display_name: 'New Name' },
        undefined,
      ),
    );
  });

  it('shows the pending name and disables submit while pending', () => {
    render(
      <DisplayNameForm
        phoneNumberId="106"
        verifiedName="Current"
        nameStatus="APPROVED"
        displayName={{
          pending_name: 'New Pending',
          rejection_reason: null,
          rejected_at: null,
          recent_change_timestamps: [],
        }}
        axios={mockAxios(vi.fn())}
      />,
    );

    expect(screen.getByText('New Pending')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('shows a rejection reason when the last change was rejected', () => {
    render(
      <DisplayNameForm
        phoneNumberId="106"
        verifiedName="Current"
        nameStatus="DECLINED"
        displayName={{
          pending_name: null,
          rejection_reason: 'Name violates policy',
          rejected_at: '2026-07-01T00:00:00+00:00',
          recent_change_timestamps: [],
        }}
        axios={mockAxios(vi.fn())}
      />,
    );

    expect(screen.getByText('Name violates policy')).toBeTruthy();
  });

  it('blocks submit when the 10-change / 30-day limit is reached', () => {
    // 10 recent timestamps (now-ish) → over the cap.
    const now = new Date('2026-07-05T00:00:00Z').toISOString();
    render(
      <DisplayNameForm
        phoneNumberId="106"
        verifiedName="Current"
        nameStatus="APPROVED"
        displayName={{
          pending_name: null,
          rejection_reason: null,
          rejected_at: null,
          recent_change_timestamps: Array(10).fill(now),
        }}
        axios={mockAxios(vi.fn())}
      />,
    );

    expect(screen.getByText(/Rename limit reached/)).toBeTruthy();
  });
});
