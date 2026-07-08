import { useState } from 'react';

import type {MetaAccountClientConfig} from '../../client';
import { usePhoneNumberActions } from '../../hooks';
import { obaStatusDisplay } from '../../lib/status-config';
import type {WhatsAppPhoneNumber} from '../../types';
import { InputError } from '../InputError';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

export interface ObaFormProps extends MetaAccountClientConfig {
  phoneNumberId: string;
  obaStatus: string;
  businessVerified: boolean;
  onSuccess?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

const RESUBMIT_STATES = ['REJECTED', 'EXPIRED', 'CANCELLED'];

const INITIAL = {
  business_website_url: '',
  primary_country_of_operation: '',
  primary_language: '',
  parent_business_or_brand: '',
  supporting_links: '',
  additional_supporting_information: '',
};

export function ObaForm({
  phoneNumberId,
  obaStatus,
  businessVerified,
  onSuccess,
  ...clientConfig
}: ObaFormProps) {
  const actions = usePhoneNumberActions({ phoneNumberId, onSuccess, ...clientConfig });
  const [data, setData] = useState(INITIAL);

  const isResubmit = RESUBMIT_STATES.includes(obaStatus);
  const showForm = obaStatus === 'NOT_STARTED' || isResubmit;
  const status = obaStatusDisplay(obaStatus);
  const errorFor = (field: string) => actions.errors?.[field]?.[0];

  const setField = (key: keyof typeof INITIAL, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    const supportingLinks = data.supporting_links
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');

    actions.applyForOba({
      business_website_url: data.business_website_url,
      primary_country_of_operation: data.primary_country_of_operation,
      primary_language: data.primary_language || null,
      parent_business_or_brand: data.parent_business_or_brand || null,
      supporting_links: supportingLinks.length ? supportingLinks : null,
      additional_supporting_information: data.additional_supporting_information || null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Official Business Account</p>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {obaStatus === 'APPROVED' && (
        <p className="text-sm text-muted-foreground">
          This number is an Official Business Account.
        </p>
      )}

      {(obaStatus === 'PENDING' || obaStatus === 'UNDER_REVIEW') && (
        <p className="text-sm text-muted-foreground">
          Your application is under review by Meta.
        </p>
      )}

      {showForm && !businessVerified && (
        <p className="text-sm text-destructive">
          Your business must be verified before applying.{' '}
          <a
            href="https://business.facebook.com/latest/settings/security_center/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Verify your business
          </a>
        </p>
      )}

      {showForm && businessVerified && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Business website URL</Label>
              <Input
                value={data.business_website_url}
                maxLength={256}
                onChange={(event) => setField('business_website_url', event.target.value)}
                placeholder="https://example.com"
              />
              {errorFor('business_website_url') && (
                <InputError message={errorFor('business_website_url')} className="mt-0.5" />
              )}
            </div>
            <div>
              <Label>Country of operation</Label>
              <Input
                value={data.primary_country_of_operation}
                maxLength={2}
                onChange={(event) =>
                  setField('primary_country_of_operation', event.target.value.toUpperCase())
                }
                placeholder="ID"
              />
              {errorFor('primary_country_of_operation') && (
                <InputError message={errorFor('primary_country_of_operation')} className="mt-0.5" />
              )}
            </div>
            <div>
              <Label>Primary language</Label>
              <Input
                value={data.primary_language}
                maxLength={10}
                onChange={(event) => setField('primary_language', event.target.value)}
                placeholder="id_ID"
              />
              {errorFor('primary_language') && (
                <InputError message={errorFor('primary_language')} className="mt-0.5" />
              )}
            </div>
            <div className="sm:col-span-2">
              <Label>Parent business or brand</Label>
              <Input
                value={data.parent_business_or_brand}
                maxLength={256}
                onChange={(event) => setField('parent_business_or_brand', event.target.value)}
                placeholder="Optional"
              />
              {errorFor('parent_business_or_brand') && (
                <InputError message={errorFor('parent_business_or_brand')} className="mt-0.5" />
              )}
            </div>
            <div className="sm:col-span-2">
              <Label>Supporting links</Label>
              <Textarea
                value={data.supporting_links}
                onChange={(event) => setField('supporting_links', event.target.value)}
                placeholder="One URL per line (5–10 links)"
                className="min-h-28"
              />
              {errorFor('supporting_links') && (
                <InputError message={errorFor('supporting_links')} className="mt-0.5" />
              )}
            </div>
            <div className="sm:col-span-2">
              <Label>Additional information</Label>
              <Textarea
                value={data.additional_supporting_information}
                maxLength={1024}
                onChange={(event) =>
                  setField('additional_supporting_information', event.target.value)
                }
                placeholder="Optional"
              />
              {errorFor('additional_supporting_information') && (
                <InputError
                  message={errorFor('additional_supporting_information')}
                  className="mt-0.5"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={submit} disabled={actions.isProcessing}>
              {isResubmit ? 'Resubmit' : 'Submit application'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
