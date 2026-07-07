import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { TwoStepPinForm } from './TwoStepPinForm';

function mockAxios(patch: ReturnType<typeof vi.fn>): AxiosInstance {
  return { patch } as unknown as AxiosInstance;
}

describe('TwoStepPinForm', () => {
  it('strips non-digits and disables submit until 6 digits', () => {
    render(<TwoStepPinForm phoneNumberId="106" axios={mockAxios(vi.fn())} />);

    const input = screen.getByPlaceholderText('6-digit PIN') as HTMLInputElement;
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: '12ab34' } });
    expect(input.value).toBe('1234');
    expect(button).toHaveProperty('disabled', true);

    fireEvent.change(input, { target: { value: '123456' } });
    expect(button).toHaveProperty('disabled', false);
  });

  it('labels the action Set vs Update from pinSet', () => {
    const { rerender } = render(
      <TwoStepPinForm phoneNumberId="106" axios={mockAxios(vi.fn())} />,
    );
    expect(screen.getByRole('button').textContent).toBe('Set PIN');

    rerender(
      <TwoStepPinForm phoneNumberId="106" pinSet axios={mockAxios(vi.fn())} />,
    );
    expect(screen.getByRole('button').textContent).toBe('Update');
  });

  it('submits the PIN via updateTwoStepPin', async () => {
    const patch = vi.fn().mockResolvedValue({ data: { data: {} } });
    render(<TwoStepPinForm phoneNumberId="106" axios={mockAxios(patch)} />);

    fireEvent.change(screen.getByPlaceholderText('6-digit PIN'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        'api/whatsapp/phone-numbers/106/two-step-pin',
        { pin: '123456' },
        undefined,
      ),
    );
  });
});
