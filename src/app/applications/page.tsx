import { NewApplicationWorkflow } from "@/components/NewApplicationWorkflow";
import { ApplicationShell } from "@/components/ui";

export default function ApplicationsPage() {
  return (
    <ApplicationShell>
      <NewApplicationWorkflow />
    </ApplicationShell>
  );
}
