import { CloudSync, LoaderCircle } from 'lucide-react';
import type {ReactNode} from 'react';

import type {MetaAccountClientConfig} from '../client';
import { useBusinessAccounts } from '../hooks';
import {
  TOKEN_STATUS,
  healthStatusDisplay,
  reviewStatusDisplay,
} from '../lib/status-config';
import type {WhatsAppAccount} from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

export interface BusinessAccountListProps extends MetaAccountClientConfig {
  page?: number;
  onSelect?: (businessAccount: WhatsAppAccount) => void;
  /** Omit to hide the sync column. `syncingId` marks the row currently syncing. */
  onSync?: (businessAccount: WhatsAppAccount) => void;
  syncingId?: number | null;
  emptyState?: ReactNode;
}

export function BusinessAccountList({
  page,
  onSelect,
  onSync,
  syncingId,
  emptyState,
  ...clientConfig
}: BusinessAccountListProps) {
  const { businessAccounts, isLoading, error } = useBusinessAccounts({
    page,
    ...clientConfig,
  });

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Failed to load business accounts.
      </p>
    );
  }

  if (businessAccounts.length === 0) {
    return (
      <>
        {emptyState ?? (
          <p className="text-sm text-muted-foreground">
            No business accounts yet.
          </p>
        )}
      </>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>WABA ID</TableHead>
          <TableHead>Token</TableHead>
          <TableHead>Numbers</TableHead>
          <TableHead>Review</TableHead>
          <TableHead>Health</TableHead>
          {onSync && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {businessAccounts.map((account) => {
          const token = TOKEN_STATUS[account.token_status];
          const review = reviewStatusDisplay(account.account_review_status);
          const health = healthStatusDisplay(account.health_status);

          return (
            <TableRow
              key={account.id}
              onClick={onSelect ? () => onSelect(account) : undefined}
              className={onSelect ? 'cursor-pointer' : undefined}
            >
              <TableCell className="font-medium">{account.name}</TableCell>
              <TableCell className="font-mono text-xs">
                {account.waba_id}
              </TableCell>
              <TableCell>
                <Badge variant={token.variant}>{token.label}</Badge>
              </TableCell>
              <TableCell>{account.phone_numbers_count}</TableCell>
              <TableCell>
                {review ? (
                  <Badge variant={review.variant}>{review.label}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {health ? (
                  <Badge variant={health.variant}>{health.label}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              {onSync && (
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSync(account);
                    }}
                    disabled={
                      account.token_status === 'no_token' ||
                      syncingId === account.id
                    }
                    aria-label={`Sync ${account.name}`}
                  >
                    {syncingId === account.id ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <CloudSync className="size-4" />
                    )}
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
