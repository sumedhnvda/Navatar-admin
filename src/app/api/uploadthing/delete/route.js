import { UTApi } from "uploadthing/server";
import { NextResponse } from "next/server";

const utapi = new UTApi();

export async function POST(req) {
  try {
    const { fileKeys } = await req.json();
    
    if (!fileKeys || !Array.isArray(fileKeys)) {
      return NextResponse.json({ error: "Invalid file keys" }, { status: 400 });
    }

    await utapi.deleteFiles(fileKeys);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UT deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
