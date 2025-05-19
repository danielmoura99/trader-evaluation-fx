// app/(dashboard)/accounts/page.tsx
import { getAccounts } from "./_actions";
import { AccountsClient } from "./_components/accounts-client";

export const metadata = {
  title: "Contas Nelogica",
  description: "Gerencie suas contas na plataforma Nelogica",
};

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Contas Nelogica</h2>
      </div>
      <div className="grid gap-4">
        <AccountsClient initialAccounts={accounts} />
      </div>
    </div>
  );
}
