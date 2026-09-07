import { notFound } from "next/navigation";
import { getCaseById } from "@/lib/cases";
import CasePrepFlow from "./CasePrepFlow";

export default async function CasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const caseData = getCaseById(caseId);

  if (!caseData) {
    notFound();
  }

  return <CasePrepFlow caseData={caseData} />;
}
