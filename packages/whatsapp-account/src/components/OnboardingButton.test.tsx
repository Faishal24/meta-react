import { render, screen, waitFor } from '@testing-library/react';
import { type AxiosInstance } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OnboardingButton } from './OnboardingButton';
import * as facebookSdk from '../onboarding/facebookSdk';

function mockAxios(get: ReturnType<typeof vi.fn>): AxiosInstance {
  return { get } as unknown as AxiosInstance;
}

const config = { app_id: '123', configuration_id: '988' };

afterEach(() => vi.restoreAllMocks());

describe('OnboardingButton', () => {
  it('is disabled until the SDK is ready, then enables', async () => {
    const get = vi.fn().mockResolvedValue({ data: config });
    vi.spyOn(facebookSdk, 'loadFacebookSdk').mockResolvedValue({} as never);

    render(<OnboardingButton axios={mockAxios(get)} />);

    const button = screen.getByRole('button');
    expect(button).toHaveProperty('disabled', true);

    await waitFor(() => expect(button).toHaveProperty('disabled', false));
  });

  it('renders the add-number label in add-number mode', async () => {
    const get = vi.fn().mockResolvedValue({ data: config });
    vi.spyOn(facebookSdk, 'loadFacebookSdk').mockResolvedValue({} as never);

    render(<OnboardingButton mode="add-number" axios={mockAxios(get)} />);

    expect(await screen.findByText('Add number')).toBeTruthy();
  });

  it('renders custom children over the default label', async () => {
    const get = vi.fn().mockResolvedValue({ data: config });
    vi.spyOn(facebookSdk, 'loadFacebookSdk').mockResolvedValue({} as never);

    render(<OnboardingButton axios={mockAxios(get)}>Sign up</OnboardingButton>);

    expect(await screen.findByText('Sign up')).toBeTruthy();
  });
});
