import { Suspense } from "react";
import OrderDetailClient from "./OrderDetailClient";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-500">Loading order...</div>}>
      <OrderDetailClient id={id} />
    </Suspense>
  );
}

