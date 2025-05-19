// app/(dashboard)/accounts/page.tsx
import { getAccounts } from "./_actions";
import { AccountsClient } from "./_components/accounts-client";
import { DashboardHeader } from "@/components/dashboard-header";
import { Shell } from "@/components/shell";

export const metadata = {
  title: "Contas Nelogica",
  description: "Gerencie suas contas na plataforma Nelogica",
};

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <Shell>
      <DashboardHeader
        title="Contas Nelogica"
        description="Visualize e gerencie as contas na plataforma Nelogica"
      />

      <AccountsClient initialAccounts={accounts} />
    </Shell>
  );
}
