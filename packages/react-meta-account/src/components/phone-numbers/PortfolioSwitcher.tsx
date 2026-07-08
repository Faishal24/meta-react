import { Building2, Check, ChevronsUpDown } from 'lucide-react';

import type { MetaAccountClientConfig } from '../../client';
import { useContext, useContextActions } from '../../hooks';
import type { AvailablePortfolio, ContextResponse } from '../../types';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface PortfolioSwitcherProps extends MetaAccountClientConfig {
  onSwitched?: (context: ContextResponse) => void;
}

/**
 * Self-contained switcher for the active business portfolio, mirroring the CRM's
 * StoreSwitcher. Reads the active portfolio and switchable list from `/context`,
 * and switches on click — refetching context after.
 */
export function PortfolioSwitcher({
  onSwitched,
  ...clientConfig
}: PortfolioSwitcherProps) {
  const { context, refetch } = useContext(clientConfig);
  const { switchPortfolio, isProcessing } = useContextActions({
    ...clientConfig,
    onSuccess: (next) => {
      refetch();
      onSwitched?.(next);
    },
  });

  const portfolios = context?.available_portfolios ?? [];
  const activeId = context?.business_portfolio_id ?? null;
  const activePortfolio = portfolios.find(
    (portfolio) => portfolio.business_portfolio_id === activeId,
  );

  const handleSelect = (portfolio: AvailablePortfolio) => {
    if (portfolio.business_portfolio_id === activeId) {
      return;
    }

    void switchPortfolio(portfolio.business_portfolio_id);
  };

  if (portfolios.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-1 px-2" disabled={isProcessing}>
          <Building2 className="size-4" />
          <span className="max-w-37.5 truncate">
            {activePortfolio?.name ?? 'Select a portfolio'}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-55">
        <DropdownMenuLabel>Business Portfolios</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {portfolios.map((portfolio) => (
          <DropdownMenuItem
            key={portfolio.business_portfolio_id}
            onClick={() => handleSelect(portfolio)}
            className="cursor-pointer"
          >
            <Check
              className={
                portfolio.business_portfolio_id === activeId
                  ? 'opacity-100'
                  : 'opacity-0'
              }
            />
            <span className="truncate">
              {portfolio.name ?? portfolio.business_portfolio_id}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
