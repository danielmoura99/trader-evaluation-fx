// trader-evaluation-fx/lib/services/evaluations.ts
import { prisma } from "@/lib/prisma";

interface GetClientEvaluationsParams {
  email?: string;
  cpf?: string;
}

export async function getClientEvaluations({
  email,
  cpf,
}: GetClientEvaluationsParams) {
  if (!email && !cpf) {
    throw new Error("Email ou CPF são necessários para buscar avaliações");
  }

  const client = await prisma.client.findFirst({
    where: {
      OR: [{ email: email }, { cpf: cpf }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      platform: true,
      plan: true,
      traderStatus: true,
      startDate: true,
      endDate: true,
      observation: true,
    },
  });

  if (!client) {
    return null;
  }

  return {
    client,
    evaluation: {
      status: client.traderStatus,
      startDate: client.startDate,
      endDate: client.endDate,
      platform: client.platform,
      plan: client.plan,
    },
  };
}
