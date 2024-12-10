// scripts/migrate-data.ts
import { PrismaClient as SourcePrisma } from "@prisma/client";
import { PrismaClient as TargetPrisma } from "@prisma/client";

const sourcePrisma = new SourcePrisma({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres@localhost:5432/trader_evaluation",
    },
  },
});

const targetPrisma = new TargetPrisma({
  datasources: {
    db: {
      url: process.env.NEON_DATABASE_URL,
    },
  },
});

async function migrateData() {
  console.log("Iniciando migração...");

  try {
    // Migrar clientes
    const clients = await sourcePrisma.client.findMany();
    console.log(`Encontrados ${clients.length} clientes para migrar`);

    // Migrar em lotes de 100 para evitar sobrecarga
    const batchSize = 100;
    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = clients.slice(i, i + batchSize);
      await Promise.all(
        batch.map((client) =>
          targetPrisma.client.create({
            data: {
              ...client,
              id: client.id, // mantém o mesmo ID
              createdAt: client.createdAt,
              updatedAt: client.updatedAt,
            },
          })
        )
      );
      console.log(`Migrados ${i + batch.length} de ${clients.length} clientes`);
    }

    console.log("Migração concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante a migração:", error);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

migrateData();
