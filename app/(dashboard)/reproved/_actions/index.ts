// app/(dashboard)/reproved/_actions/index.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getReprovedClients() {
  try {
    const clients = await prisma.client.findMany({
      where: {
        traderStatus: "Reprovado",
      },
      include: {
        contacts: {
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: {
        cancellationDate: "desc",
      },
    });

    //console.log("Clientes encontrados:", clients); // Debug
    return clients;
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    throw error;
  }
}

export async function addContact(
  clientId: string,
  data: {
    date: Date;
    notes: string;
    status: string;
  }
) {
  try {
    console.log("Adicionando contato:", { clientId, data }); // Debug

    const contact = await prisma.contact.create({
      data: {
        clientId,
        status: data.status,
        date: data.date,
        notes: data.notes,
      },
    });

    console.log("Contato criado:", contact); // Debug
    revalidatePath("/reproved");
    return contact;
  } catch (error) {
    console.error("Erro ao adicionar contato:", error);
    throw error;
  }
}

export async function getContactHistory(clientId: string) {
  return await prisma.contact.findMany({
    where: {
      clientId,
    },
    orderBy: {
      date: "desc",
    },
  });
}
