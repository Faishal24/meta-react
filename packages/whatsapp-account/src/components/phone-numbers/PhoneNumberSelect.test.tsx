import { render, screen, waitFor } from '@testing-library/react';
import { type AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { PhoneNumberSelect } from './PhoneNumberSelect';

function mockAxios(get: ReturnType<typeof vi.fn>): AxiosInstance {
  return { get } as unknown as AxiosInstance;
}

const numbers = {
  data: [
    { id: 34, phone_number_id: '106', display_phone_number: '+62 812', verified_name: 'Sales' },
  ],
  meta: {},
};

describe('PhoneNumberSelect', () => {
  it('renders the placeholder and enables once numbers load', async () => {
    const get = vi.fn().mockResolvedValue({ data: numbers });
    render(<PhoneNumberSelect onSelect={vi.fn()} axios={mockAxios(get)} />);

    expect(screen.getByText('Select a number')).toBeTruthy();
    await waitFor(() => expect(get).toHaveBeenCalled());
  });

  it('honors a custom placeholder', () => {
    const get = vi.fn().mockResolvedValue({ data: numbers });
    render(
      <PhoneNumberSelect
        onSelect={vi.fn()}
        placeholder="Pick one"
        axios={mockAxios(get)}
      />,
    );

    expect(screen.getByText('Pick one')).toBeTruthy();
  });
});
