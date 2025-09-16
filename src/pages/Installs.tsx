import ScaffoldPage from '@/components/ScaffoldPage';

export default function InstallsPage() {
  return (
    <ScaffoldPage 
      title="Installs Pipeline"
      description="Survey → Contract → Install Scheduled → Live."
      columns={['Location', 'Stage', 'Owner', 'Updated']}
    />
  );
}