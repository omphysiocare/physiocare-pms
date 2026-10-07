import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ReportView from "@/features/reports/ReportView";
import { getReportDefinition, REPORT_DEFINITIONS } from "@/lib/reports/definitions";

export function generateStaticParams() {
  return REPORT_DEFINITIONS.map((definition) => ({ slug: definition.slug }));
}

export async function generateMetadata(props: PageProps<"/reports/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: getReportDefinition(slug)?.title ?? "Report" };
}

export default async function ReportPage(props: PageProps<"/reports/[slug]">) {
  const { slug } = await props.params;
  const definition = getReportDefinition(slug);
  if (!definition) notFound();
  return <ReportView key={slug} definition={definition} />;
}
