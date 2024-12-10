// app/(dashboard)/reproved/page.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./_columns/columns";
import { addContact, getReprovedClients } from "./_actions";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Client, TraderStatusType } from "@/app/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContactForm, ContactFormData } from "./_components/contact-form";
import { ContactHistory } from "./_components/contact-history";

export default function ReprovedPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    try {
      const data = await getReprovedClients();
      const formattedClients = data.map((client) => ({
        ...client,
        // Campos obrigatórios
        name: client.name,
        email: client.email,
        cpf: client.cpf,
        phone: client.phone,
        platform: client.platform,
        plan: client.plan,
        // Garantir que campos opcionais nunca sejam null
        address: client.address || "",
        zipCode: client.zipCode || "",
        observation: client.observation || "",
        // Converter datas
        birthDate: new Date(client.birthDate),
        startDate: client.startDate ? new Date(client.startDate) : null,
        endDate: client.endDate ? new Date(client.endDate) : null,
        cancellationDate: client.cancellationDate
          ? new Date(client.cancellationDate)
          : null,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
        traderStatus: client.traderStatus as TraderStatusType,
        contacts:
          client.contacts?.map((contact) => ({
            ...contact,
            date: new Date(contact.date),
            createdAt: new Date(contact.createdAt),
            // Garante que o status seja um dos valores permitidos
            status: contact.status as
              | "Sem contato"
              | "Contatado"
              | "Não Interessado"
              | "Convertido",
          })) || [],
      }));
      setClients(formattedClients);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro ao carregar clientes",
        description:
          "Ocorreu um erro ao carregar a lista de clientes reprovados.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Expõe função para o botão da tabela
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.contactClient = (client: Client) => {
        setSelectedClient(client);
        setOpen(true);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleContactSubmit = async (data: ContactFormData) => {
    if (!selectedClient?.id) return;

    try {
      await addContact(selectedClient.id, {
        date: data.contactDate,
        notes: data.contactNotes,
        status: data.contactStatus,
      });

      setOpen(false);
      await fetchClients();
      toast({
        title: "Contato registrado",
        description: "As informações do contato foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao salvar contato:", error);
      toast({
        title: "Erro ao salvar contato",
        description:
          "Ocorreu um erro ao tentar salvar as informações do contato.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-zinc-100">
          Clientes Reprovados
        </h1>
      </div>

      <div className="w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
        <DataTable columns={columns} data={clients} searchColumn="name" />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Registrar Contato - {selectedClient?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <ContactForm
                onSubmit={handleContactSubmit}
                onCancel={() => setOpen(false)}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">
                Histórico de Contatos
              </h3>
              <ContactHistory contacts={selectedClient?.contacts || []} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
