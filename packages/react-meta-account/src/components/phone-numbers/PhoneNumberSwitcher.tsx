import { Check, ChevronsUpDown, Phone } from 'lucide-react';

import type { MetaAccountClientConfig } from '../../client';
import { useContext, useContextActions, usePhoneNumbers } from '../../hooks';
import type { ContextResponse, WhatsAppPhoneNumber } from '../../types';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface PhoneNumberSwitcherProps extends MetaAccountClientConfig {
  onSwitched?: (context: ContextResponse) => void;
}

/**
 * Self-contained switcher for the active phone number, mirroring the CRM's
 * WhatsAppPhoneNumberSwitcher. Reads the active number from `/context`, lists
 * the caller's numbers, and switches on click — refetching context after.
 */
export function PhoneNumberSwitcher({
  onSwitched,
  ...clientConfig
}: PhoneNumberSwitcherProps) {
  const { context, refetch } = useContext(clientConfig);
  const { phoneNumbers } = usePhoneNumbers(clientConfig);
  const { switchPhoneNumber, isProcessing } = useContextActions({
    ...clientConfig,
    onSuccess: (next) => {
      refetch();
      onSwitched?.(next);
    },
  });

  const activeId = context?.phone_number_id ?? null;
  const activeNumber = phoneNumbers.find(
    (number) => number.phone_number_id === activeId,
  );

  const handleSelect = (number: WhatsAppPhoneNumber) => {
    if (number.phone_number_id === activeId) {
      return;
    }

    void switchPhoneNumber(number.phone_number_id);
  };

  if (phoneNumbers.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-1 px-2" disabled={isProcessing}>
          <Phone className="size-4" />
          <span className="max-w-37.5 truncate">
            {activeNumber?.display_phone_number ?? 'Select a number'}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-55">
        <DropdownMenuLabel>WhatsApp Numbers</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {phoneNumbers.map((number) => (
          <DropdownMenuItem
            key={number.id}
            onClick={() => handleSelect(number)}
            className="cursor-pointer"
          >
            <Check
              className={
                number.phone_number_id === activeId
                  ? 'opacity-100'
                  : 'opacity-0'
              }
            />
            <span className="truncate">{number.display_phone_number}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
