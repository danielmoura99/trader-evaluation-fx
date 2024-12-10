/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { Client } from "@/app/types";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClients() {
  return await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      contacts: {
        orderBy: {
          date: "desc",
        },
      },
    },
  });
}

export async function createClient(data: Client) {
  // Removemos contacts antes de criar o cliente
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const { contacts, ...clientData } = data as any;

  await prisma.client.create({
    data: clientData,
  });
  revalidatePath("/clients");
}

export async function updateClient(id: string, data: Client) {
  // Removemos contacts antes de atualizar o cliente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { contacts, ...clientData } = data as any;

  await prisma.client.update({
    where: { id },
    data: clientData,
  });
  revalidatePath("/clients");
}

export async function deleteClient(id: string) {
  // Contatos serão deletados automaticamente por causa da relação CASCADE
  await prisma.client.delete({
    where: { id },
  });
  revalidatePath("/clients");
}

export async function getClientByCPF(cpf: string) {
  try {
    const client = await prisma.client.findFirst({
      where: {
        cpf: cpf.replace(/\D/g, ""),
      },
      include: {
        contacts: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });
    return client;
  } catch (error) {
    console.error("Erro ao buscar cliente por CPF:", error);
    return null;
  }
}
