import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const assetDirectory = path.join(process.cwd(), "asserts");

const contentTypes: Record<string, string> = {
  ".mp4": "video/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

export async function GET(
  _request: Request,
  { params }: { params: { file: string } }
) {
  const filename = params.file;

  if (filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Invalid file path", { status: 400 });
  }

  const assetPath = path.join(assetDirectory, filename);
  const extension = path.extname(filename).toLowerCase();
  const contentType = contentTypes[extension];

  if (!contentType) {
    return new NextResponse("Unsupported asset type", { status: 415 });
  }

  try {
    const fileBuffer = await readFile(assetPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new NextResponse("Asset not found", { status: 404 });
  }
}
