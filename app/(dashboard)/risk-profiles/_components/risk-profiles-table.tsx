// app/(dashboard)/risk-profiles/_components/risk-profiles-table.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash, RefreshCw } from "lucide-react";
import { deleteRiskProfile } from "../_actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface RiskProfile {
  id: string;
  name: string;
  nelogicaProfileId: string;
  initialBalance: number;
  trailing: boolean;
  stopOutRule: number;
  leverage: number;
  enableLoss: boolean;
  lossRule: number;
  enableGain: boolean;
  gainRule: number;
  planMappings?: string[];
}

interface RiskProfilesTableProps {
  profiles: RiskProfile[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function RiskProfilesTable({
  profiles,
  isLoading,
  onRefresh,
}: RiskProfilesTableProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<RiskProfile | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (profile: RiskProfile) => {
    if (typeof window !== "undefined" && window.editRiskProfile) {
      window.editRiskProfile(profile);
    }
  };

  const handleDeleteClick = (profile: RiskProfile) => {
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!profileToDelete) return;

    setIsDeleting(true);
    try {
      await deleteRiskProfile(profileToDelete.id);
      toast({
        title: "Perfil excluído",
        description: "O perfil de risco foi excluído com sucesso.",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-zinc-100">
          Perfis Cadastrados
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      <div className="rounded-md border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-zinc-800/50">
              <TableHead className="text-zinc-400">Nome</TableHead>
              <TableHead className="text-zinc-400">Saldo Inicial</TableHead>
              <TableHead className="text-zinc-400">Perda Máx.</TableHead>
              <TableHead className="text-zinc-400">Ganho Máx.</TableHead>
              <TableHead className="text-zinc-400">Alavancagem</TableHead>
              <TableHead className="text-zinc-400">Trailing</TableHead>
              <TableHead className="text-zinc-400">Planos</TableHead>
              <TableHead className="text-zinc-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-6 text-zinc-500"
                >
                  {isLoading
                    ? "Carregando perfis..."
                    : "Nenhum perfil de risco cadastrado"}
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id} className="hover:bg-zinc-800/50">
                  <TableCell className="font-medium text-zinc-300">
                    {profile.name}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    ${profile.initialBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {profile.enableLoss
                      ? `$${profile.lossRule.toLocaleString()}`
                      : "Desativado"}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {profile.enableGain
                      ? `$${profile.gainRule.toLocaleString()}`
                      : "Desativado"}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {profile.leverage}x
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {profile.trailing ? "Sim" : "Não"}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {profile.planMappings && profile.planMappings.length > 0
                      ? profile.planMappings.join(", ")
                      : "Nenhum plano associado"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(profile)}
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(profile)}
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Confirmar exclusão
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Tem certeza que deseja excluir o perfil de risco
              {profileToDelete?.name}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir Perfil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
