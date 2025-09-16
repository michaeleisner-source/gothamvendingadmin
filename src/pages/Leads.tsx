import ScaffoldPage from '@/components/ScaffoldPage';

export default function LeadsPage() {
  return (
    <ScaffoldPage 
      title="Leads (Prospects)"
      description="Manage prospects and convert to Locations."
      columns={['Name', 'Type', 'Status', 'Contact', 'Created']}
    />
  );
}