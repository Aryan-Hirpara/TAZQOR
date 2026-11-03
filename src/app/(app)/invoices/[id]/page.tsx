import { Suspense } from "react";
import InvoiceDetailClient from "./InvoiceDetailClient";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading invoice...</div>}>
      <InvoiceDetailClient id={id} />
    </Suspense>
  );
}

