import { AddressPage } from "@/components/RouteStage";
export default async function StagePage({ params }: { params: Promise<{ stage: string }> }) { const { stage } = await params; return <AddressPage stage={stage} />; }
