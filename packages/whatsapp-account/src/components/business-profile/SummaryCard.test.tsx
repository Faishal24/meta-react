import { render, screen } from '@testing-library/react';
import { type AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { SummaryCard } from './SummaryCard';
import { useBusinessProfileForm } from '../../hooks';
import { type BusinessProfile } from '../../types';

const profile: BusinessProfile = {
  about: null,
  address: 'Jl. Sudirman 1',
  description: 'Office mapping.',
  email: null,
  websites: null,
  vertical: null,
  profile_picture_url: null,
  synced_at: null,
};

function mockAxios(): AxiosInstance {
  return { patch: vi.fn() } as unknown as AxiosInstance;
}

function Harness({ obaStatus, businessVerified }: { obaStatus?: string; businessVerified: boolean }) {
  const form = useBusinessProfileForm({ phoneNumberId: '106', profile, axios: mockAxios() });
  return (
    <SummaryCard
      form={form}
      verifiedName="Acme Sales"
      nameStatus="APPROVED"
      obaStatus={obaStatus}
      businessVerified={businessVerified}
      verticals={[]}
    />
  );
}

describe('SummaryCard', () => {
  it('mirrors profile fields and the verified name', () => {
    render(<Harness businessVerified obaStatus="NOT_STARTED" />);

    expect(screen.getByText('Acme Sales')).toBeTruthy();
    expect(screen.getByText('Office mapping.')).toBeTruthy();
    expect(screen.getByText('Jl. Sudirman 1')).toBeTruthy();
  });

  it('derives the account stage badge — Official when OBA approved', () => {
    render(<Harness businessVerified obaStatus="APPROVED" />);
    expect(screen.getByText('Official')).toBeTruthy();
  });

  it('shows Business unverified when not verified and no OBA', () => {
    render(<Harness businessVerified={false} obaStatus="NOT_STARTED" />);
    expect(screen.getByText('Business unverified')).toBeTruthy();
  });
});
