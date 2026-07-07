import { type ReactNode } from 'react';
import { LoaderCircle, RefreshCw } from 'lucide-react';

import { type WhatsAppAccountClientConfig } from '../client';
import { useWhatsAppAccountActions } from '../hooks';
import { type WhatsAppAccount } from '../types';
import { Button } from './ui/button';

export interface RefreshTokenButtonProps extends WhatsAppAccountClientConfig {
  wabaId: string;
  /** Disabled when there is no token to refresh. */
  tokenStatus?: string;
  onSuccess?: (account: WhatsAppAccount) => void;
  children?: ReactNode;
}

export function RefreshTokenButton({
  wabaId,
  tokenStatus,
  onSuccess,
  children,
  ...clientConfig
}: RefreshTokenButtonProps) {
  const actions = useWhatsAppAccountActions({ wabaId, onSuccess, ...clientConfig });

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={actions.isProcessing || tokenStatus === 'no_token'}
      onClick={() => actions.refreshToken().catch(() => {})}
    >
      {actions.isProcessing ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      {children ?? 'Refresh token'}
    </Button>
  );
}
