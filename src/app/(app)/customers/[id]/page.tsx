import { Suspense } from "react";
import CustomerDetailClient from "./CustomerDetailClient";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading customer...</div>}>
      <CustomerDetailClient id={id} />
    </Suspense>
  );
}
