import { NextResponse } from "next/server";
import { importClients } from "@/utils/import-data";

// Aumenta o limite de tempo da requisição para 5 minutos
export const maxDuration = 300; // segundos

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
