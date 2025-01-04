import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Users,
  Clock,
  PlayCircle,
  CheckCircle2,
  ChartBar,
  PieChart,
} from "lucide-react";

interface PlanApprovalRate {
  plan: string;
  rate: string;
}

interface StatsCardsProps {
  totalClients: number;
  awaitingClients: number;
  inEvaluationClients: number;
  completedClients: number;
  approvalRate: string;
  planApprovalRates: PlanApprovalRate[];
}

export function StatsCards({
  totalClients,
  awaitingClients,
  inEvaluationClients,
  completedClients,
  approvalRate,
  planApprovalRates,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Total de Clientes
          </CardTitle>
          <Users className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-100">{totalClients}</div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Aguardando Início
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-100">
            {awaitingClients}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Em Avaliação
          </CardTitle>
          <PlayCircle className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-100">
            {inEvaluationClients}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Finalizados
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-100">
            {completedClients}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Taxa de Aprovação
          </CardTitle>
          <ChartBar className="h-4 w-4 text-violet-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-100">
            {approvalRate}%
          </div>
        </CardContent>
      </Card>
      {/* Novo card para taxas de aprovação por plano */}
      <Card className="bg-zinc-900 border-zinc-800 md:col-span-2 lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-2 pb-2">
          <CardTitle className="text-base font-medium text-zinc-200">
            Taxa de Aprovação por Plano
          </CardTitle>
          <PieChart className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {planApprovalRates.map((planRate) => (
              <div
                key={planRate.plan}
                className="flex-1 min-w-[200px] space-y-1"
              >
                <p className="text-sm text-zinc-400">{planRate.plan}</p>
                <p className="text-xl font-bold text-zinc-100">
                  {planRate.rate}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
