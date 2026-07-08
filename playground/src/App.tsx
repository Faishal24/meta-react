import {
  BusinessAccountList,
  PhoneNumberDetail,
  PhoneNumberManagement,
  PhoneNumberSelect,
} from '@officemap/react-meta-account';
import type {ReactNode} from 'react';

const VERTICALS = [
  { value: 'PROF_SERVICES', label: 'Professional Services' },
  { value: 'RETAIL', label: 'Retail' },
];

const REGIONS = [{ value: 'ID', label: 'Indonesia' }];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function App() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 p-8">
      <h1 className="text-2xl font-bold">react-meta-account playground</h1>

      <Section title="BusinessAccountList">
        <BusinessAccountList onSelect={(a) => console.log('select', a)} />
      </Section>

      <Section title="PhoneNumberSelect">
        <PhoneNumberSelect onSelect={(n) => console.log('select', n)} />
      </Section>

      <Section title="PhoneNumberDetail">
        <PhoneNumberDetail phoneNumberId="106540352242922" verticals={VERTICALS} />
      </Section>

      <Section title="PhoneNumberManagement">
        <PhoneNumberManagement phoneNumberId="106540352242922" regions={REGIONS} />
      </Section>
    </main>
  );
}

export default App;
