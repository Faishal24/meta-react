import {
  Globe,
  ImageUp,
  Info,
  Mail,
  MapPin,
  Plus,
  Tag,
  Text,
  X,
} from 'lucide-react';
import type {ReactNode} from 'react';

import type {useBusinessProfileForm} from '../../hooks';
import { cn } from '../../lib/utils';
import { InputError } from '../InputError';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';

export interface VerticalOption {
  value: string;
  label: string;
}

export interface BusinessProfileFormProps {
  form: ReturnType<typeof useBusinessProfileForm>;
  /** Meta business verticals to choose from (value + display label). */
  verticals: VerticalOption[];
}

const FIELD_CLASS = 'border-0 bg-input/30 shadow-none break-all focus-visible:ring-0';

function Row({
  icon,
  error,
  children,
}: {
  icon: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="py-3.5">
      <div className="flex items-start gap-4">
        <div className="mt-2 shrink-0 text-muted-foreground">{icon}</div>
        <div className="flex-1">{children}</div>
      </div>
      {error && <InputError message={error} className="mt-0.5 pl-9" />}
    </div>
  );
}

export function BusinessProfileForm({ form, verticals }: BusinessProfileFormProps) {
  const errorFor = (field: string) => form.errors?.[field]?.[0];

  return (
    <div className="space-y-6">
      <div>
        <label
          className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-input p-6 text-center transition-colors hover:bg-muted/50"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            form.pickPhoto(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <Avatar className="size-16">
            <AvatarImage
              src={form.photoPreview ?? undefined}
              alt=""
              className="object-cover"
            />
            <AvatarFallback>
              <ImageUp className="size-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">Upload profile photo</p>
            <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => form.pickPhoto(event.target.files?.[0] ?? null)}
          />
        </label>
        {errorFor('photo') && (
          <InputError message={errorFor('photo')} className="mt-1.5" />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="space-y-1 px-6 py-4">
          <h3 className="text-base font-semibold">Business info</h3>

          <div className="divide-y">
            <Row icon={<Text className="size-5" />} error={errorFor('description')}>
              <Textarea
                value={form.description}
                maxLength={512}
                onChange={(event) => form.setDescription(event.target.value)}
                placeholder="Description"
                className={cn('min-h-9', FIELD_CLASS)}
              />
            </Row>

            <Row icon={<MapPin className="size-5" />} error={errorFor('address')}>
              <Input
                value={form.address}
                maxLength={256}
                onChange={(event) => form.setAddress(event.target.value)}
                placeholder="Address"
                className={FIELD_CLASS}
              />
            </Row>

            <Row icon={<Tag className="size-5" />} error={errorFor('vertical')}>
              <p className="text-xs text-muted-foreground">Category</p>
              <Select value={form.vertical || undefined} onValueChange={form.setVertical}>
                <SelectTrigger className={FIELD_CLASS}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {verticals.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          </div>
        </div>
      </div>

      <div className="rounded-xl border px-6 py-2">
        <h3 className="py-3 text-base font-semibold">Websites</h3>
        <Separator />
        {form.websites.map((url, index) => (
          <Row
            key={index}
            icon={<Globe className="size-5" />}
            error={errorFor(`websites.${index}`)}
          >
            <div className="flex items-center gap-2">
              <Input
                value={url}
                maxLength={256}
                onChange={(event) => form.setWebsiteAt(index, event.target.value)}
                placeholder="https://example.com"
                className={FIELD_CLASS}
              />
              {form.websites.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => form.removeWebsite(index)}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </Row>
        ))}
        {form.websites.length < 2 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={form.addWebsite}
          >
            <Plus className="size-4" /> Add website
          </Button>
        )}
      </div>

      <div className="rounded-xl border px-6 py-2">
        <h3 className="py-3 text-base font-semibold">Contact</h3>
        <Separator />
        <div className="divide-y">
          <Row icon={<Mail className="size-5" />} error={errorFor('email')}>
            <Input
              type="email"
              value={form.email}
              maxLength={128}
              onChange={(event) => form.setEmail(event.target.value)}
              placeholder="Email"
              className={FIELD_CLASS}
            />
          </Row>
          <Row icon={<Info className="size-5" />} error={errorFor('about')}>
            <Input
              value={form.about}
              maxLength={139}
              onChange={(event) => form.setAbout(event.target.value)}
              placeholder="About"
              className={FIELD_CLASS}
            />
          </Row>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={form.submit} disabled={form.isProcessing}>
          Save
        </Button>
      </div>
    </div>
  );
}
