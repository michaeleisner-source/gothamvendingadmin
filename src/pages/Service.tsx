import ScaffoldPage from '@/components/ScaffoldPage';

export default function ServicePage() {
  return (
    <ScaffoldPage 
      title="Service & Maintenance"
      description="Track service logs, parts, and downtime."
      columns={['Date', 'Machine', 'Action', 'Notes', 'Parts Cost']}
    />
  );
}