import {
  BusinessAccountList,
  OnboardingButton,
  PhoneNumberDetail,
  PhoneNumberManagement,
  PhoneNumberSelect,
  PhoneNumberSwitcher,
  PortfolioSwitcher,
  SectionCard,
} from '@officemap/react-meta-account';

const VERTICALS = [
  { value: 'PROF_SERVICES', label: 'Professional Services' },
  { value: 'RETAIL', label: 'Retail' },
];

const REGIONS = [{ value: 'ID', label: 'Indonesia' }];


function App() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 p-8">
      <h1 className="text-2xl font-bold">react-meta-account playground</h1>

      <SectionCard title="BusinessAccountList">
        <BusinessAccountList onSelect={(a) => console.log('select', a)} />
      </SectionCard>

      <SectionCard title="Phone Number Add">
        <OnboardingButton />
      </SectionCard>

      <SectionCard title="PhoneNumberSwitcher">
        <PhoneNumberSwitcher onSwitched={(c) => console.log('switched', c)} />
      </SectionCard>

      <SectionCard title="PortfolioSwitcher">
        <PortfolioSwitcher onSwitched={(c) => console.log('portfolio', c)} />
      </SectionCard>

      <SectionCard title="PhoneNumberSelect">
        <PhoneNumberSelect onSelect={(n) => console.log('select', n)} />
      </SectionCard>

      <SectionCard title="PhoneNumberDetail">
        <PhoneNumberDetail phoneNumberId="106540352242922" verticals={VERTICALS} />
      </SectionCard>

      <SectionCard title="PhoneNumberManagement">
        <PhoneNumberManagement phoneNumberId="106540352242922" regions={REGIONS} />
      </SectionCard>
    </main>
  );
}

export default App;
