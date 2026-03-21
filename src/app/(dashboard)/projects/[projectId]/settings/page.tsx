import { MembersTable } from '@/features/projects/components/members-table';
import { LabelsManager } from '@/features/projects/components/labels-manager';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <MembersTable />
      <Separator />
      <LabelsManager />
    </div>
  );
}
