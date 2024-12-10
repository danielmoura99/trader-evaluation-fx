import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentClient {
  id: string;
  name: string;
  platform: string;
  plan: string;
  traderStatus: string;
  createdAt: Date;
}

export function RecentClients({ clients }: { clients: RecentClient[] }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">Clientes Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {clients.map((client) => (
            <div key={client.id} className="flex items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-zinc-100">
                  {client.name}
                </p>
                <p className="text-sm text-zinc-400">
                  {client.platform} • {client.plan}
                </p>
                <div className="flex items-center pt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      client.traderStatus === "Aguardando Inicio"
                        ? "bg-yellow-400/10 text-yellow-500"
                        : client.traderStatus === "Em Curso"
                        ? "bg-blue-400/10 text-blue-500"
                        : client.traderStatus === "Aprovado"
                        ? "bg-green-400/10 text-green-500"
                        : "bg-red-400/10 text-red-500"
                    }`}
                  >
                    {client.traderStatus}
                  </span>
                  <span className="ml-4 text-xs text-zinc-500">
                    {format(new Date(client.createdAt), "dd 'de' MMMM", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
