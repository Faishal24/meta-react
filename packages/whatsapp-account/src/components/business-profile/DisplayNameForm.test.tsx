import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type AxiosInstance } from 'axios';
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
});
