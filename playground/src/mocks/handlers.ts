import { http, HttpResponse } from 'msw';

const PAGINATION = { current_page: 1, last_page: 1, per_page: 15, total: 1 };

const ACCOUNT = {
  id: 12,
  waba_id: '102290129340398',
  name: 'Acme Sales',
  token_status: 'valid',
  phone_numbers_count: 2,
  account_review_status: 'approved',
  health_status: { can_send_message: 'available' },
};

const NUMBER = {
  id: 34,
  whatsapp_account_id: 12,
  phone_number_id: '106540352242922',
  display_phone_number: '+62 812-3456-7890',
  verified_name: 'Acme Sales',
  name_status: 'APPROVED',
  status: 'connected',
  registered: true,
  has_pin: true,
  business_profile: {
    about: 'We ship maps.',
    address: 'Jl. Sudirman 1',
    description: 'Office mapping.',
    email: 'sales@acme.test',
    websites: ['https://acme.test'],
    vertical: 'PROF_SERVICES',
    profile_picture_url: null,
    synced_at: null,
  },
  display_name: {
    pending_name: null,
    rejection_reason: null,
    rejected_at: null,
    recent_change_timestamps: [],
  },
  settings: { identity_key_check: true, storage: { status: 'DEFAULT' } },
  oba: { status: 'NOT_STARTED' },
};

const SECOND_NUMBER = {
  ...NUMBER,
  id: 35,
  phone_number_id: '106540352242999',
  display_phone_number: '+62 811-2222-3333',
  verified_name: 'Acme Support',
};

const PORTFOLIOS = [
  {
    business_portfolio_id: '102938475610293',
    name: 'Acme Inc.',
    verification_status: 'verified',
  },
  {
    business_portfolio_id: '102938475610777',
    name: 'Acme Labs',
    verification_status: null,
  },
];

const base = '/api/whatsapp';

export const handlers = [
  http.get(`${base}/whatsapp-accounts`, () =>
    HttpResponse.json({ data: [ACCOUNT], meta: PAGINATION }),
  ),
  http.get(`${base}/phone-numbers`, () =>
    HttpResponse.json({
      data: [NUMBER, SECOND_NUMBER],
      meta: { ...PAGINATION, total: 2 },
    }),
  ),
  http.get(`${base}/phone-numbers/:id`, () =>
    HttpResponse.json({ data: NUMBER }),
  ),
  http.get(`${base}/onboarding/config`, () =>
    HttpResponse.json({ app_id: '123', configuration_id: '988' }),
  ),
  http.get(`${base}/context`, () =>
    HttpResponse.json({
      business_portfolio_id: PORTFOLIOS[0].business_portfolio_id,
      waba_id: ACCOUNT.waba_id,
      phone_number_id: NUMBER.phone_number_id,
      available_portfolios: PORTFOLIOS,
    }),
  ),
  // Switching echoes a context pointing at the requested number.
  http.patch(`${base}/context/phone-number/:id`, ({ params }) =>
    HttpResponse.json({
      business_portfolio_id: PORTFOLIOS[0].business_portfolio_id,
      waba_id: ACCOUNT.waba_id,
      phone_number_id: params.id,
      available_portfolios: PORTFOLIOS,
    }),
  ),
  http.patch(`${base}/context/portfolio/:id`, ({ params }) =>
    HttpResponse.json({
      business_portfolio_id: params.id,
      waba_id: ACCOUNT.waba_id,
      phone_number_id: NUMBER.phone_number_id,
      available_portfolios: PORTFOLIOS,
    }),
  ),
  // Mutations echo the number back so components see a success.
  http.patch(`${base}/phone-numbers/:id/*`, () =>
    HttpResponse.json({ data: NUMBER }),
  ),
  http.post(`${base}/phone-numbers/:id/*`, () =>
    HttpResponse.json({ data: NUMBER }),
  ),
];
