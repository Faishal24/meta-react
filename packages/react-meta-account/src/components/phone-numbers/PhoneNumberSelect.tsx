import type {MetaAccountClientConfig} from '../../client';
import { usePhoneNumbers } from '../../hooks';
import type {WhatsAppPhoneNumber} from '../../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export interface PhoneNumberSelectProps extends MetaAccountClientConfig {
  /** The currently selected `phone_number_id`, or null when none is chosen. */
  selectedId?: string | null;
  onSelect: (phoneNumber: WhatsAppPhoneNumber) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function PhoneNumberSelect({
  selectedId,
  onSelect,
  disabled,
  placeholder = 'Select a number',
  ...clientConfig
}: PhoneNumberSelectProps) {
  const { phoneNumbers, isLoading } = usePhoneNumbers(clientConfig);

  const handleChange = (value: string) => {
    const number = phoneNumbers.find((item) => item.phone_number_id === value);

    if (number) {
      onSelect(number);
    }
  };

  return (
    <Select
      value={selectedId ?? undefined}
      onValueChange={handleChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full min-w-0">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="end" position="popper">
        {phoneNumbers.map((number) => (
          <SelectItem key={number.id} value={number.phone_number_id}>
            <span className="flex items-center gap-2">
              <span className="font-medium">
                {number.verified_name ?? number.display_phone_number}
              </span>
              <span className="text-xs text-muted-foreground max-sm:hidden">
                {number.display_phone_number}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
