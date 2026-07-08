import {
  AlignLeft,
  BadgeCheck,
  Globe,
  Info,
  Mail,
  MapPin,
  Tag,
} from 'lucide-react';
import type {ReactNode} from 'react';

import type {useBusinessProfileForm} from '../../hooks';
import { accountStageDisplay } from '../../lib/status-config';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import type {VerticalOption} from './BusinessProfileForm';

export interface SummaryCardProps {
  form: ReturnType<typeof useBusinessProfileForm>;
  verifiedName: string | null;
  nameStatus: string | null;
  obaStatus?: string | null;
  businessVerified: boolean;
  verticals: VerticalOption[];
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const NAME_STATUS_VARIANT: Record<string, BadgeVariant> = {
  APPROVED: 'default',
  PENDING_REVIEW: 'secondary',
  DECLINED: 'destructive',
  EXPIRED: 'destructive',
};

function SummaryRow({ icon, value }: { icon: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0 break-words">
        {value || <span className="text-muted-foreground/60">Not set</span>}
      </div>
    </div>
  );
}

export function SummaryCard({
  form,
  verifiedName,
  nameStatus,
  obaStatus,
  businessVerified,
  verticals,
}: SummaryCardProps) {
  const stage = accountStageDisplay(obaStatus, businessVerified);
  const categoryLabel = verticals.find((option) => option.value === form.vertical)?.label;
  const websites = form.websites.filter((url) => url.trim() !== '');

  return (
    <Card className="shadow-none">
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <Avatar className="size-14">
            <AvatarImage
              src={form.photoPreview ?? undefined}
              alt=""
              className="object-cover"
            />
            <AvatarFallback>WA</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{verifiedName ?? '—'}</p>
            {nameStatus && (
              <div className="mt-1">
                <Badge variant={NAME_STATUS_VARIANT[nameStatus] ?? 'outline'}>
                  {nameStatus}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <BadgeCheck className="size-4" /> Account status
          </span>
          <Badge variant={stage.variant}>{stage.label}</Badge>
        </div>

        <Separator />

        <div className="space-y-3">
          <SummaryRow icon={<AlignLeft className="size-4" />} value={form.description} />
          <SummaryRow icon={<Tag className="size-4" />} value={categoryLabel} />
          <SummaryRow icon={<MapPin className="size-4" />} value={form.address} />
          <SummaryRow icon={<Mail className="size-4" />} value={form.email} />
          <SummaryRow
            icon={<Globe className="size-4" />}
            value={
              websites.length
                ? websites.map((url, index) => (
                    <span key={index} className="block">
                      {url}
                    </span>
                  ))
                : null
            }
          />
          <SummaryRow icon={<Info className="size-4" />} value={form.about} />
        </div>
      </CardContent>
    </Card>
  );
}
