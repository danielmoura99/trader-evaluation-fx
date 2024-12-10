import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function main() {
  const password = await hash("Software3009TH*", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Adminfx",
      email: "danielmoura@tradershouse.com.br",
      password,
      role: "ADMIN",
    },
  });

  console.log(`Admin criado com sucesso: ${admin.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
