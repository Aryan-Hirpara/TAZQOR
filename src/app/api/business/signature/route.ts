import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";

export const runtime = "nodejs";

const PREFERRED_ROOT_NAMES = [
  "signature_transparent.png",
  "signature-transparent.png",
  "sign_transparent.png",
  "sign-transparent.png",
  "signature.png",
  "signature.webp",
  "sign.png",
  "sign.webp",
  "digital-signature.png",
  "digital-sign.png",
  "signature.jpg",
  "signature.jpeg",
  "sign.jpg",
  "sign.jpeg",
  "digital-signature.jpg",
  "digital-sign.jpg",
];

const PREFERRED_BRAND_NAMES = [
  "signature-custom.png",
  "signature-custom.jpg",
  "signature-custom.jpeg",
  "signature-custom.webp",
  "signature.png",
  "signature.jpg",
  "signature.jpeg",
  "signature.webp",
  "sign.png",
  "sign.jpg",
  "sign.jpeg",
  "sign.webp",
];

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const EXT_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const MAX_SIGNATURE_BYTES = 5 * 1024 * 1024;

interface ResolvedSignatureFile {
  fullPath: string;
  filename: string;
  source: "root" | "brand";
  mimeType: string;
  mtimeMs: number;
}

async function resolveSignatureFile(): Promise<ResolvedSignatureFile | null> {
  const cwd = process.cwd();
  const brandDir = path.join(cwd, "public", "brand");

  // 1. Check root directory first so placing `signature.png` or `*sign*.png` in project root works immediately
  for (const name of PREFERRED_ROOT_NAMES) {
    const candidate = path.join(cwd, name);
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        const ext = path.extname(name).toLowerCase();
        return {
          fullPath: candidate,
          filename: name,
          source: "root",
          mimeType: MIME_BY_EXT[ext] || "image/png",
          mtimeMs: Math.round(stat.mtimeMs),
        };
      }
    } catch {
      // ignore missing file
    }
  }

  try {
    const rootEntries = await fs.readdir(cwd, { withFileTypes: true });
    // Prefer transparent PNG/WEBP files before opaque JPG scans
    const sortedEntries = rootEntries
      .filter((entry) => entry.isFile())
      .sort((a, b) => {
        const extA = path.extname(a.name).toLowerCase();
        const extB = path.extname(b.name).toLowerCase();
        const rank = (ext: string, name: string) =>
          (ext === ".png" ? 0 : ext === ".webp" ? 1 : 2) * 10 +
          (name.toLowerCase().includes("transparent") ? 0 : 1);
        return rank(extA, a.name) - rank(extB, b.name);
      });
    for (const entry of sortedEntries) {
      const lower = entry.name.toLowerCase();
      const ext = path.extname(lower);
      if (!MIME_BY_EXT[ext]) continue;
      if (lower.includes("logo")) continue;
      if (lower.includes("sign") || lower.includes("autograph")) {
        const fullPath = path.join(cwd, entry.name);
        const stat = await fs.stat(fullPath);
        return {
          fullPath,
          filename: entry.name,
          source: "root",
          mimeType: MIME_BY_EXT[ext],
          mtimeMs: Math.round(stat.mtimeMs),
        };
      }
    }
  } catch {
    // ignore readdir failure
  }

  // 2. Fallback to uploaded/public brand signature file
  for (const name of PREFERRED_BRAND_NAMES) {
    const candidate = path.join(brandDir, name);
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        const ext = path.extname(name).toLowerCase();
        return {
          fullPath: candidate,
          filename: name,
          source: "brand",
          mimeType: MIME_BY_EXT[ext] || "image/png",
          mtimeMs: Math.round(stat.mtimeMs),
        };
      }
    } catch {
      // ignore missing file
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const metaOnly = url.searchParams.get("meta") === "1";
    const resolved = await resolveSignatureFile();

    if (metaOnly) {
      if (!resolved) {
        return NextResponse.json(
          { available: false, filename: null, source: null, url: null },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
      return NextResponse.json(
        {
          available: true,
          filename: resolved.filename,
          source: resolved.source,
          url: `/api/business/signature?v=${resolved.mtimeMs}`,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!resolved) {
      return NextResponse.json({ error: "No digital signature file found" }, { status: 404 });
    }

    const buffer = await fs.readFile(resolved.fullPath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": resolved.mimeType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Error reading digital signature:", err);
    return NextResponse.json({ error: "Failed to read digital signature" }, { status: 500 });
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
      return NextResponse.json({ error: "Signature image file is required" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_SIGNATURE_BYTES) {
      return NextResponse.json(
        { error: "Signature file must be under 5 MB" },
        { status: 400 }
      );
    }

    const ext = EXT_BY_MIME[file.type.toLowerCase()];
    if (!ext) {
      return NextResponse.json(
        { error: "Only PNG, JPG, or WebP signature images are supported" },
        { status: 400 }
      );
    }

    const brandDir = path.join(process.cwd(), "public", "brand");
    await fs.mkdir(brandDir, { recursive: true });

    // Remove previous custom signature variants cleanly
    for (const oldExt of Object.values(EXT_BY_MIME)) {
      const oldPath = path.join(brandDir, `signature-custom${oldExt}`);
      await fs.unlink(oldPath).catch(() => {});
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const targetPath = path.join(brandDir, `signature-custom${ext}`);
    await fs.writeFile(targetPath, bytes);
    const stat = await fs.stat(targetPath);

    return NextResponse.json({
      success: true,
      filename: `signature-custom${ext}`,
      source: "brand",
      url: `/api/business/signature?v=${Math.round(stat.mtimeMs)}`,
    });
  } catch (err) {
    console.error("Error uploading digital signature:", err);
    return NextResponse.json({ error: "Failed to save signature" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const brandDir = path.join(process.cwd(), "public", "brand");
    for (const ext of Object.values(EXT_BY_MIME)) {
      await fs.unlink(path.join(brandDir, `signature-custom${ext}`)).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting digital signature:", err);
    return NextResponse.json({ error: "Failed to remove uploaded signature" }, { status: 500 });
  }
}

