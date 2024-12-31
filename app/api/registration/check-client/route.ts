// trader-evaluation-fx/app/api/registration/check-client/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const document = searchParams.get("document");

    if (!email && !document) {
      return Response.json(
        {
          error: "Email ou CPF são necessários",
        },
        { status: 400 }
      );
    }

    // Buscar cliente por email ou CPF
    const client = await prisma.client.findFirst({
      where: {
        OR: [{ email: email || undefined }, { cpf: document || undefined }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        birthDate: true,
        address: true,
        zipCode: true,
      },
    });

    if (!client) {
      return Response.json({ exists: false });
    }

    return Response.json({
      exists: true,
      clientData: client,
    });
  } catch (error) {
    console.error("[Check Client] Erro:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
