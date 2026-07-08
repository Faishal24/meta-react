import type {TokenStatus} from '../types';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface StatusDisplay {
  label: string;
  variant: BadgeVariant;
}

export const TOKEN_STATUS: Record<TokenStatus, StatusDisplay> = {
  valid: { label: 'Valid', variant: 'default' },
  expiring_soon: { label: 'Expiring soon', variant: 'secondary' },
  expired: { label: 'Expired', variant: 'destructive' },
  no_token: { label: 'No token', variant: 'outline' },
};

// account_review_status is a free-form string in the contract; map the known
// Meta values and fall back to outline for anything else.
export const REVIEW_STATUS: Record<string, StatusDisplay> = {
  APPROVED: { label: 'Approved', variant: 'default' },
  approved: { label: 'Approved', variant: 'default' },
  PENDING: { label: 'Pending', variant: 'secondary' },
  pending: { label: 'Pending', variant: 'secondary' },
  DEFERRED: { label: 'Deferred', variant: 'outline' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

export function reviewStatusDisplay(status: string | null): StatusDisplay | null {
  if (!status) {
    return null;
  }

  return REVIEW_STATUS[status] ?? { label: status, variant: 'outline' };
}

// health_status is an object like { can_send_message: "available" }; derive a
// single badge from the messaging capability.
const HEALTH_VARIANT: Record<string, BadgeVariant> = {
  available: 'default',
  limited: 'secondary',
  blocked: 'destructive',
};

export function healthStatusDisplay(health: Record<string, unknown> | null): StatusDisplay | null {
  const capability = health?.can_send_message;

  if (typeof capability !== 'string') {
    return null;
  }

  return {
    label: capability.charAt(0).toUpperCase() + capability.slice(1),
    variant: HEALTH_VARIANT[capability] ?? 'outline',
  };
}

const OBA_STATUS: Record<string, StatusDisplay> = {
  NOT_STARTED: { label: 'Not started', variant: 'outline' },
  PENDING: { label: 'Pending', variant: 'secondary' },
  UNDER_REVIEW: { label: 'Under review', variant: 'secondary' },
  APPROVED: { label: 'Approved', variant: 'default' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  EXPIRED: { label: 'Expired', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export function obaStatusDisplay(status: string): StatusDisplay {
  return OBA_STATUS[status] ?? { label: status, variant: 'outline' };
}

// Collapse the OBA lifecycle + business-verification gate into one onboarding
// stage badge (verify business → ready → under review → official).
export function accountStageDisplay(
  obaStatus: string | null | undefined,
  businessVerified: boolean,
): StatusDisplay {
  switch (obaStatus) {
    case 'APPROVED':
      return { label: 'Official', variant: 'default' };
    case 'PENDING':
    case 'UNDER_REVIEW':
      return { label: 'Under review', variant: 'secondary' };
    case 'REJECTED':
      return { label: 'Rejected', variant: 'destructive' };
    case 'EXPIRED':
      return { label: 'Expired', variant: 'destructive' };
    case 'CANCELLED':
      return { label: 'Cancelled', variant: 'destructive' };
    default:
      return businessVerified
        ? { label: 'Ready to apply', variant: 'secondary' }
        : { label: 'Business unverified', variant: 'outline' };
  }
}
