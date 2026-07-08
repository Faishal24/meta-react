import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {AxiosInstance} from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { ObaForm } from './ObaForm';

function mockAxios(post: ReturnType<typeof vi.fn>): AxiosInstance {
  return { post } as unknown as AxiosInstance;
}

describe('ObaForm', () => {
  it('hides the form and shows a verify prompt when the business is not verified', () => {
    render(
      <ObaForm
        phoneNumberId="106"
        obaStatus="NOT_STARTED"
        businessVerified={false}
        axios={mockAxios(vi.fn())}
      />,
    );

    expect(screen.queryByText('Business website URL')).toBeNull();
    expect(screen.getByText(/business must be verified/)).toBeTruthy();
  });

  it('shows the form when verified and not yet applied', () => {
    render(
      <ObaForm
        phoneNumberId="106"
        obaStatus="NOT_STARTED"
        businessVerified
        axios={mockAxios(vi.fn())}
      />,
    );

    expect(screen.getByText('Business website URL')).toBeTruthy();
    expect(screen.getByRole('button').textContent).toBe('Submit application');
  });

  it('submits with supporting_links split from the textarea', async () => {
    const post = vi.fn().mockResolvedValue({ data: { data: {} } });
    render(
      <ObaForm
        phoneNumberId="106"
        obaStatus="NOT_STARTED"
        businessVerified
        axios={mockAxios(post)}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'https://acme.test' },
    });
    fireEvent.change(screen.getByPlaceholderText('ID'), {
      target: { value: 'id' },
    });
    fireEvent.change(screen.getByPlaceholderText(/One URL per line/), {
      target: { value: 'https://a.test\n\nhttps://b.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('api/whatsapp/phone-numbers/106/oba');
    expect(body.primary_country_of_operation).toBe('ID');
    expect(body.supporting_links).toEqual(['https://a.test', 'https://b.test']);
  });

  it('labels the action Resubmit for a rejected application', () => {
    render(
      <ObaForm
        phoneNumberId="106"
        obaStatus="REJECTED"
        businessVerified
        axios={mockAxios(vi.fn())}
      />,
    );

    expect(screen.getByRole('button').textContent).toBe('Resubmit');
  });
});
