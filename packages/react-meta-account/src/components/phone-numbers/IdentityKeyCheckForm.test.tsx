import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {AxiosInstance} from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { IdentityKeyCheckForm } from './IdentityKeyCheckForm';

function mockAxios(patch: ReturnType<typeof vi.fn>): AxiosInstance {
  return { patch } as unknown as AxiosInstance;
}

describe('IdentityKeyCheckForm', () => {
  it('reflects the initial enabled state', () => {
    render(
      <IdentityKeyCheckForm
        phoneNumberId="106"
        enabled
        axios={mockAxios(vi.fn())}
      />,
    );

    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('toggles via updateIdentityKeyCheck', async () => {
    const patch = vi.fn().mockResolvedValue({ data: { data: {} } });
    render(
      <IdentityKeyCheckForm
        phoneNumberId="106"
        enabled={false}
        axios={mockAxios(patch)}
      />,
    );

    fireEvent.click(screen.getByRole('switch'));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        'api/whatsapp/phone-numbers/106/identity-key-check',
        { enabled: true },
        undefined,
      ),
    );
  });

  it('reverts the toggle when the request fails', async () => {
    const patch = vi.fn().mockRejectedValue(new Error('boom'));
    render(
      <IdentityKeyCheckForm
        phoneNumberId="106"
        enabled={false}
        axios={mockAxios(patch)}
      />,
    );

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(toggle.getAttribute('aria-checked')).toBe('false'),
    );
  });
});
