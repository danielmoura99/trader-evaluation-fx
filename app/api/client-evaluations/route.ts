// trader-evaluation-fx/app/api/client-evaluations/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const API_KEY = process.env.API_KEY;

export async function GET(req: NextRequest) {
  try {
    // Validar API Key
    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!apiKey || apiKey !== API_KEY) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obter parâmetros da query
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get("email");
    const cpf = searchParams.get("cpf");

    if (!email && !cpf) {
      return Response.json(
        { error: "Email ou CPF são necessários" },
        { status: 400 }
      );
    }

    // Buscar todos os registros que correspondem ao email ou CPF
    const evaluations = await prisma.client.findMany({
      where: {
        OR: [{ email: email || undefined }, { cpf: cpf || undefined }],
      },
      select: {
        id: true,
        name: true,
        cpf: true,
        phone: true,
        birthDate: true,
        address: true,
        zipCode: true,
        email: true,
        platform: true,
        plan: true,
        traderStatus: true,
        startDate: true,
        endDate: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!evaluations.length) {
      return Response.json({ evaluations: [] }, { status: 200 });
    }

    return Response.json({ evaluations });
  } catch (error) {
    console.error("[API] Erro ao buscar avaliações:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
