// components/platform-buttons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { getSubscriptionPlanId } from "@/utils/plataform-helper";

// Crie uma API route local para fazer a requisição
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createBrokerAccount = async (payload: any) => {
  const response = await axios.post("/api/broker/create-account", payload);
  return response.data;
};

interface Client {
  id?: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: Date;
  platform: string;
}

interface PlatformButtonsProps {
  client: Client;
  onStartEvaluation: (id: string) => void;
}

export function PlatformButtons({
  client,
  onStartEvaluation,
}: PlatformButtonsProps) {
  const { toast } = useToast();

  const handleCreateAccount = async () => {
    try {
      const [firstName, ...lastNameParts] = client.name.split(" ");
      const lastName = lastNameParts.join(" ");

      const payload = {
        request: "prop_trading_user_subscription",
        email: client.email,
        documentType: 1,
        document: client.cpf.replace(/\D/g, ""),
        firstName,
        lastName,
        dateOfBirth: client.birthDate.toISOString().split("T")[0],
        subscriptionPlanId: getSubscriptionPlanId(client.platform),
        testAccount: "1000380752",
        authenticationCode: "2B295526980F475BA2A608C8C1C4F8DF",
      };

      const response = await createBrokerAccount(payload);

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Conta criada na corretora",
        });
        if (client.id) onStartEvaluation(client.id);
      }
    } catch (error) {
      console.error("Erro na integração:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar conta na corretora",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleCreateAccount}
      variant="outline"
      size="sm"
      className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
    >
      <Play className="h-4 w-4 mr-2" />
      Liberar Plataforma
    </Button>
  );
}
