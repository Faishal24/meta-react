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

const base = '/api/whatsapp';

export const handlers = [
  http.get(`${base}/whatsapp-accounts`, () =>
    HttpResponse.json({ data: [ACCOUNT], meta: PAGINATION }),
  ),
  http.get(`${base}/phone-numbers`, () =>
    HttpResponse.json({ data: [NUMBER], meta: PAGINATION }),
  ),
  http.get(`${base}/phone-numbers/:id`, () =>
    HttpResponse.json({ data: NUMBER }),
  ),
  http.get(`${base}/onboarding/config`, () =>
    HttpResponse.json({ app_id: '123', configuration_id: '988' }),
  ),
  // Mutations echo the number back so components see a success.
  http.patch(`${base}/phone-numbers/:id/*`, () =>
    HttpResponse.json({ data: NUMBER }),
  ),
  http.post(`${base}/phone-numbers/:id/*`, () =>
    HttpResponse.json({ data: NUMBER }),
  ),
];
