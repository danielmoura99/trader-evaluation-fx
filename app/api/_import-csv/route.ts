import { NextResponse } from "next/server";
import { importClients } from "@/utils/import-data";

// Nova sintaxe de configuração
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60; // 60 segundos para plano hobby

// Reduzindo o tamanho do lote para processar mais rápido
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo fornecido" },
        { status: 400 }
      );
    }

    // Verifica tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "Arquivo muito grande. Limite de 8MB.",
          suggestion: "Divida o arquivo em partes menores.",
        },
        { status: 413 }
      );
    }

    const content = await file.text();
    const result = await importClients(content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro na importação:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao processar arquivo",
      },
      { status: 500 }
    );
  }
}
