"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./_columns/columns";
import { getClients } from "./_actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientForm } from "./_components/client-form";
import { useState, useEffect, useCallback } from "react";
import { createClient, updateClient, deleteClient } from "./_actions";
import { useToast } from "@/hooks/use-toast";
import { Client, TraderStatusType } from "@/app/types";

function ClientsContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    try {
      const data = await getClients();
      const formattedClients = data.map((client) => ({
        ...client,
        // Campos obrigatórios permanecem como estão
        name: client.name,
        email: client.email,
        cpf: client.cpf,
        phone: client.phone,
        platform: client.platform,
        plan: client.plan,
        // Garantir que address e zipCode nunca sejam null
        address: client.address || "",
        zipCode: client.zipCode || "",
        // Converter datas
        birthDate: new Date(client.birthDate),
        startDate: client.startDate ? new Date(client.startDate) : null,
        endDate: client.endDate ? new Date(client.endDate) : null,
        cancellationDate: client.cancellationDate
          ? new Date(client.cancellationDate)
          : null,
        createdAt: client.createdAt ? new Date(client.createdAt) : new Date(),
        updatedAt: client.updatedAt ? new Date(client.updatedAt) : new Date(),
        // Garantir que observation seja string
        observation: client.observation || "",
        // Garantir que traderStatus seja do tipo correto
        traderStatus: client.traderStatus as TraderStatusType,
        contacts:
          client.contacts?.map((contact) => ({
            ...contact,
            date: new Date(contact.date),
            createdAt: new Date(contact.createdAt),
            status: contact.status as
              | "Sem contato"
              | "Contatado"
              | "Não Interessado"
              | "Convertido",
          })) || [],
      }));
      setClients(formattedClients);
    } catch {
      toast({
        title: "Erro ao carregar clientes",
        description: "Ocorreu um erro ao carregar a lista de clientes.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSubmit = async (data: Client) => {
    try {
      if (selectedClient?.id) {
        await updateClient(selectedClient.id, data);
        toast({
          title: "Cliente atualizado com sucesso!",
          description: "As informações do cliente foram atualizadas.",
        });
      } else {
        await createClient(data);
        toast({
          title: "Cliente criado com sucesso!",
          description: "O novo cliente foi adicionado ao sistema.",
        });
      }
      setOpen(false);
      await fetchClients();
    } catch {
      toast({
        title: "Erro ao salvar cliente",
        description: "Ocorreu um erro ao tentar salvar as informações.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      await deleteClient(id);
      toast({
        title: "Cliente excluído com sucesso!",
        description: "O cliente foi removido do sistema.",
      });
      await fetchClients();
    } catch {
      toast({
        title: "Erro ao excluir cliente",
        description: "Ocorreu um erro ao tentar excluir o cliente.",
        variant: "destructive",
      });
    }
  };

  // Expose functions to window for table actions
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.editClient = (client: Client) => {
        setSelectedClient(client);
        setOpen(true);
      };
      window.deleteClient = handleDelete;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mantemos a dependência vazia porque essas funções não precisam ser recriadas

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4">
        <h1 className="text-2xl font-semibold text-zinc-100">Clientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setSelectedClient(undefined)}
              className="bg-green-400 hover:bg-zinc-800 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 w-[95%] sm:w-full mx-auto">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">
                {selectedClient ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <ClientForm
              initialData={selectedClient}
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
        <div className="min-w-full overflow-auto">
          <DataTable columns={columns} data={clients} searchColumn="name" />
        </div>
      </div>
    </div>
  );
}
export default function ClientsPage() {
  return (
    <div className="w-full">
      <ClientsContent />
    </div>
  );
}
