// app/api/evaluations/release-platform/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NelogicaService } from "@/lib/services/nelogica-service";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json(
        { success: false, message: "ID do cliente não fornecido" },
        { status: 400 }
      );
    }

    // Busca o cliente no banco de dados
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, message: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // Verifica se o cliente já tem uma plataforma ativa
    if (client.nelogicaLicenseId && client.nelogicaAccount) {
      return NextResponse.json(
        { success: false, message: "Cliente já possui plataforma ativa" },
        { status: 400 }
      );
    }

    // Instancia o serviço Nelogica
    const nelogicaService = new NelogicaService();

    // Inicia o fluxo completo de liberação de plataforma
    const result = await nelogicaService.releaseTraderPlatform({
      id: client.id,
      name: client.name,
      email: client.email,
      cpf: client.cpf,
      phone: client.phone,
      birthDate: client.birthDate,
      address: client.address || undefined,
      zipCode: client.zipCode || undefined,
      plan: client.plan,
    });

    logger.info(
      `Plataforma liberada com sucesso para cliente ${clientId}`,
      result
    );

    return NextResponse.json({
      success: true,
      message: "Plataforma liberada com sucesso",
      data: {
        customerId: result.customerId,
        licenseId: result.licenseId,
        account: result.account,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";

    logger.error(`Erro ao liberar plataforma: ${errorMessage}`);

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
