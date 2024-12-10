// Modifique o arquivo create-admin.mjs
import pkg from "bcryptjs";
const { hash } = pkg;
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const password = await hash("Software3009TH*", 12);

    const admin = await prisma.user.create({
      data: {
        name: "Adminfx",
        email: "danielmoura@tradershouse.com.br",
        password,
        role: "ADMIN",
      },
    });

    console.log(`Admin criado com sucesso:`);
    console.log(`Email: ${admin.email}`);
    console.log(`Nome: ${admin.name}`);
  } catch (error) {
    console.error("Erro ao criar admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
