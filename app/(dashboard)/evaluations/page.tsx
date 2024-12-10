/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { columns as awaitingColumns } from "./_columns/awaiting-columns";
import { columns as evaluationColumns } from "./_columns/evaluation-columns";
import {
  getAwaitingClients,
  getEvaluationClients,
  startEvaluation,
  finishEvaluation,
} from "./_actions";
import { Client, TraderStatusType } from "../../types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FinishEvaluationForm } from "./_components/finish-evaluation-form";

export default function EvaluationsPage() {
  const [awaitingClients, setAwaitingClients] = useState<Client[]>([]);
  const [evaluationClients, setEvaluationClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const [awaitingData, evaluationData] = await Promise.all([
        getAwaitingClients(),
        getEvaluationClients(),
      ]);

      // Convertendo datas e garantindo o tipo correto do traderStatus
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatClientData = (client: any): Client => ({
        ...client,
        birthDate: new Date(client.birthDate),
        startDate: client.startDate ? new Date(client.startDate) : null,
        endDate: client.endDate ? new Date(client.endDate) : null,
        cancellationDate: client.cancellationDate
          ? new Date(client.cancellationDate)
          : null,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
        traderStatus: client.traderStatus as TraderStatusType,
      });

      setAwaitingClients(awaitingData.map(formatClientData));
      setEvaluationClients(evaluationData.map(formatClientData));
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao carregar as avaliações.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchClients();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartEvaluation = async (clientId: string) => {
    try {
      await startEvaluation(clientId);
      await fetchClients();
      toast({
        title: "Avaliação iniciada",
        description: "A plataforma foi liberada e a avaliação iniciada.",
      });
    } catch (error) {
      toast({
        title: "Erro ao iniciar avaliação",
        description: "Ocorreu um erro ao tentar iniciar a avaliação.",
        variant: "destructive",
      });
    }
  };

  const handleFinishEvaluation = async (data: {
    status: "Aprovado" | "Reprovado";
  }) => {
    if (!selectedClient?.id) return;

    try {
      await finishEvaluation(selectedClient.id, data.status);
      setFinishDialogOpen(false);
      await fetchClients();
      toast({
        title: "Avaliação finalizada",
        description: `O trader foi ${data.status.toLowerCase()} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao finalizar avaliação",
        description: "Ocorreu um erro ao tentar finalizar a avaliação.",
        variant: "destructive",
      });
    }
  };

  // Expõe funções para os botões da tabela
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.startEvaluation = handleStartEvaluation;
      window.openFinishEvaluation = (client: Client) => {
        setSelectedClient(client);
        setFinishDialogOpen(true);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Clientes Aguardando Início */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">
          Clientes Aguardando Início
        </h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
          <DataTable
            columns={awaitingColumns}
            data={awaitingClients}
            searchColumn="name"
          />
        </div>
      </div>

      {/* Clientes em Avaliação */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">
          Clientes em Avaliação
        </h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
          <DataTable
            columns={evaluationColumns}
            data={evaluationClients}
            searchColumn="name"
          />
        </div>
      </div>

      {/* Modal de Finalização */}
      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Finalizar Avaliação
            </DialogTitle>
          </DialogHeader>
          <FinishEvaluationForm
            client={{
              id: selectedClient?.id ?? "",
              cpf: selectedClient?.cpf ?? "",
              platform: selectedClient?.platform ?? "",
            }}
            onSubmit={handleFinishEvaluation}
            onCancel={() => setFinishDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
