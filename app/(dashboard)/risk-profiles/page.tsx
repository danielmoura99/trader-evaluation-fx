// app/(dashboard)/risk-profiles/page.tsx (atualização da tipagem)
"use client";

import { useState, useEffect } from "react";
import { getRiskProfiles } from "./_actions";
import { RiskProfilesTable } from "./_components/risk-profiles-table";
import { RiskProfileForm } from "./_components/risk-profile-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface RiskProfile {
  id: string;
  name: string;
  nelogicaProfileId: string;
  initialBalance: number;
  trailing: boolean;
  stopOutRule: number;
  leverage: number;
  commissionsEnabled: boolean;
  enableContractExposure: boolean;
  contractExposure: number;
  enableLoss: boolean;
  lossRule: number;
  enableGain: boolean;
  gainRule: number;
  planMappings?: string[];
}

export default function RiskProfilesPage() {
  const [profiles, setProfiles] = useState<RiskProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<RiskProfile | null>(
    null
  );
  const { toast } = useToast();

  // Carregar perfis
  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const data = await getRiskProfiles();
      setProfiles(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Erro ao carregar perfis",
        description: "Não foi possível carregar os perfis de risco.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  // Abrir formulário para novo perfil
  const handleNewProfile = () => {
    setSelectedProfile(null);
    setFormOpen(true);
  };

  // Abrir formulário para editar perfil
  const handleEditProfile = (profile: RiskProfile) => {
    setSelectedProfile(profile);
    setFormOpen(true);
  };

  // Expor funções para a tabela
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.editRiskProfile = handleEditProfile;
    }
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-zinc-100">
          Perfis de Risco
        </h1>
        <Button
          onClick={handleNewProfile}
          className="bg-green-400 hover:bg-zinc-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Perfil
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <RiskProfilesTable
            profiles={profiles}
            isLoading={isLoading}
            onRefresh={loadProfiles}
          />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {selectedProfile
                ? "Editar Perfil de Risco"
                : "Novo Perfil de Risco"}
            </DialogTitle>
          </DialogHeader>
          <RiskProfileForm
            profile={selectedProfile}
            onComplete={(success) => {
              setFormOpen(false);
              if (success) loadProfiles();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
