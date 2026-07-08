import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {AxiosInstance} from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { RefreshTokenButton } from './RefreshTokenButton';

function mockAxios(post: ReturnType<typeof vi.fn>): AxiosInstance {
  return { post } as unknown as AxiosInstance;
}

describe('RefreshTokenButton', () => {
  it('refreshes the token via useWhatsAppAccountActions', async () => {
    const post = vi.fn().mockResolvedValue({ data: { data: {} } });
    render(<RefreshTokenButton wabaId="102" axios={mockAxios(post)} />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        'api/whatsapp/whatsapp-accounts/102/refresh-token',
      ),
    );
  });

  it('is disabled when there is no token', () => {
    render(
      <RefreshTokenButton
        wabaId="102"
        tokenStatus="no_token"
        axios={mockAxios(vi.fn())}
      />,
    );

    expect(screen.getByRole('button')).toHaveProperty('disabled', true);
  });
});
