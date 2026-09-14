import { NextResponse } from "next/server";
import { getTemplate, saveTemplate } from "@/server/templates.repository";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const record = await getTemplate(id);

  if (!record) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json();
  const result = await saveTemplate(id, body);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 422 });
  }

  return NextResponse.json(result.record);
}
