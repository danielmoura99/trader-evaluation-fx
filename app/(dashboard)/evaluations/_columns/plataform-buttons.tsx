// app/(dashboard)/evaluations/_columns/plataform-buttons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { startEvaluation } from "../_actions";

interface Client {
  id?: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: Date;
  platform: string;
  plan: string;
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
  const [isLoading, setIsLoading] = useState(false);

  const handleReleasePlatform = async () => {
    if (!client.id) return;

    setIsLoading(true);

    try {
      // Chama a action do servidor diretamente
      await startEvaluation(client.id);

      toast({
        title: "Sucesso",
        description: "Plataforma liberada com sucesso",
      });

      // Chama a função de callback que atualiza o status na interface
      onStartEvaluation(client.id);
    } catch (error) {
      console.error("Erro na liberação de plataforma:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Falha ao liberar a plataforma",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleReleasePlatform}
      variant="outline"
      size="sm"
      disabled={isLoading}
      className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
    >
      <Play className="h-4 w-4 mr-2" />
      {isLoading ? "Liberando..." : "Liberar Plataforma"}
    </Button>
  );
}
