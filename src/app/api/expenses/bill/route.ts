import { NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import {
  ALLOWED_BILL_MIME_TYPES,
  EXPENSE_BILLS_BUCKET,
  extractBillFileName,
  inferBillKind,
  isAllowedBillMimeType,
  isOwnedBillPath,
  MAX_BILL_SIZE_BYTES,
} from "@/lib/expenses/expense-record";

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  pdf: "application/pdf",
};

async function ensureExpenseBillsBucket(db: any) {
  const { data: existing } = await db.storage.getBucket(EXPENSE_BILLS_BUCKET);
  if (existing) return;
  const { error } = await db.storage.createBucket(EXPENSE_BILLS_BUCKET, {
    public: false,
    fileSizeLimit: MAX_BILL_SIZE_BYTES,
    allowedMimeTypes: [...ALLOWED_BILL_MIME_TYPES],
  });
  if (error && !error.message?.toLowerCase().includes("already exists")) {
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No bill file uploaded." }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
    }

    if (file.size > MAX_BILL_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Bill file size must be 10 MB or smaller." },
        { status: 400 }
      );
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const resolvedMime =
      file.type && isAllowedBillMimeType(file.type)
        ? file.type
        : EXTENSION_TO_MIME[ext] || "";

    if (!resolvedMime || !isAllowedBillMimeType(resolvedMime)) {
      return NextResponse.json(
        { error: "Only image files (JPG, PNG, WEBP, GIF, HEIC) and PDF bills are supported." },
        { status: 400 }
      );
    }

    await ensureExpenseBillsBucket(auth.db);

    const safeBaseName = file.name
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || `bill.${ext || "bin"}`;

    const uniqueId = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const objectPath = `${auth.session.businessId}/${Date.now()}-${uniqueId}-${safeBaseName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await auth.db.storage
      .from(EXPENSE_BILLS_BUCKET)
      .upload(objectPath, bytes, {
        contentType: resolvedMime,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    return NextResponse.json({
      path: objectPath,
      fileName: extractBillFileName(objectPath) || safeBaseName,
      mimeType: resolvedMime,
      billKind: inferBillKind(objectPath, resolvedMime),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload expense bill" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const forceDownload = searchParams.get("download") === "1";

    if (!isOwnedBillPath(path, auth.session.businessId)) {
      return NextResponse.json({ error: "Invalid or unauthorized bill path." }, { status: 400 });
    }

    const { data, error } = await auth.db.storage
      .from(EXPENSE_BILLS_BUCKET)
      .download(path!);

    if (error || !data) {
      const { data: pubData } = auth.db.storage
        .from(EXPENSE_BILLS_BUCKET)
        .getPublicUrl(path!);
      if (pubData?.publicUrl) {
        return NextResponse.redirect(pubData.publicUrl);
      }
      return NextResponse.json(
        { error: error?.message || "Bill file not found." },
        { status: 404 }
      );
    }

    const fileName = (extractBillFileName(path) || "expense-bill").replace(/"/g, "");
    const ext = (fileName.split(".").pop() || "").toLowerCase();
    const contentType = EXTENSION_TO_MIME[ext] || data.type || "application/octet-stream";

    return new NextResponse(await data.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${fileName}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load expense bill" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!isOwnedBillPath(path, auth.session.businessId)) {
      return NextResponse.json({ error: "Invalid or unauthorized bill path." }, { status: 400 });
    }

    const { error } = await auth.db.storage
      .from(EXPENSE_BILLS_BUCKET)
      .remove([path!]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove bill file" },
      { status: 500 }
    );
  }
}

