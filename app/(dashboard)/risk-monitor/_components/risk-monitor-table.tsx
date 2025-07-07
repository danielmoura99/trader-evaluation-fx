/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/risk-monitor/_components/risk-monitor-table.tsx
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { RiskMonitorData, RiskStatus } from "../_types";

interface RiskMonitorTableProps {
  data: RiskMonitorData[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function RiskMonitorTable({
  data,
  isLoading,
  onRefresh,
}: RiskMonitorTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<keyof RiskMonitorData>("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Função para formatar valores monetários
  const formatCurrency = (value: number | string) => {
    if (value === "Pendente") return value;
    if (typeof value === "string") return value;

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Função para formatar percentual
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Função para obter cor baseada no valor
  const getValueColor = (value: number, isProfit: boolean = true) => {
    if (value === 0) return "text-zinc-400";
    if (isProfit) {
      return value > 0 ? "text-green-500" : "text-red-500";
    } else {
      return value > 0 ? "text-red-500" : "text-green-500";
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: RiskStatus) => {
    switch (status) {
      case "Normal":
        return "text-green-500";
      case "Alert":
        return "text-yellow-500";
      case "Critical":
        return "text-red-500";
      default:
        return "text-zinc-400";
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: RiskStatus) => {
    switch (status) {
      case "Normal":
        return <CheckCircle className="h-4 w-4" />;
      case "Alert":
        return <AlertTriangle className="h-4 w-4" />;
      case "Critical":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  // Filtrar e ordenar dados
  const filteredAndSortedData = data
    .filter((item) => {
      const matchesSearch =
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subconta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.perfilRisco.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

  // Função para alternar ordenação
  const handleSort = (column: keyof RiskMonitorData) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  // Calcular estatísticas dos dados filtrados
  const stats = {
    total: filteredAndSortedData.length,
    normal: filteredAndSortedData.filter((d) => d.status === "Normal").length,
    alert: filteredAndSortedData.filter((d) => d.status === "Alert").length,
    critical: filteredAndSortedData.filter((d) => d.status === "Critical")
      .length,
  };

  return (
    <div className="space-y-4">
      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar por nome, subconta ou perfil..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-72 bg-zinc-800 border-zinc-700"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Alert">Alerta</SelectItem>
              <SelectItem value="Critical">Crítico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-4 text-sm text-zinc-400">
          <span>Total: {stats.total}</span>
          <span className="text-green-500">Normal: {stats.normal}</span>
          <span className="text-yellow-500">Alerta: {stats.alert}</span>
          <span className="text-red-500">Crítico: {stats.critical}</span>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-zinc-800/50 border-zinc-800">
                <TableHead className="text-zinc-400 font-medium">
                  Status
                </TableHead>

                <TableHead className="text-zinc-400 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("subconta")}
                    className="h-auto p-0 font-medium text-zinc-400 hover:text-zinc-100"
                  >
                    Subconta
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>

                <TableHead className="text-zinc-400 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("nome")}
                    className="h-auto p-0 font-medium text-zinc-400 hover:text-zinc-100"
                  >
                    Nome
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>

                <TableHead className="text-zinc-400 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("perfilRisco")}
                    className="h-auto p-0 font-medium text-zinc-400 hover:text-zinc-100"
                  >
                    Perfil de Risco
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>

                <TableHead className="text-zinc-400 font-medium text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("operacoesFechadas")}
                    className="h-auto p-0 font-medium text-zinc-400 hover:text-zinc-100"
                  >
                    Op. Fechadas
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>

                <TableHead className="text-zinc-400 font-medium text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("operacoesAbertas")}
                    className="h-auto p-0 font-medium text-zinc-400 hover:text-zinc-100"
                  >
                    Op. Abertas
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>

                <TableHead className="text-zinc-400 font-medium text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("resultadoBruto")}
                    className="h-auto p-0 font-medium text-zinc-400 hover:text-zinc-100"
                  >
                    Resultado Bruto
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>

                <TableHead className="text-zinc-400 font-medium text-right">
                  Taxa Corretagem
                </TableHead>

                <TableHead className="text-zinc-400 font-medium text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("resultadoLiquido")}
                    className="h-auto p-0 font-medium text-zinc-400 hover:text-zinc-100"
                  >
                    Resultado Líquido
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>

                <TableHead className="text-zinc-400 font-medium text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("limitePerdaDiaria")}
                    className="h-auto p-0 font-medium text-zinc-400 hover:text-zinc-100"
                  >
                    Limite Perda
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>

                <TableHead className="text-zinc-400 font-medium text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("drawdownDiario")}
                    className="h-auto p-0 font-medium text-zinc-400 hover:text-zinc-100"
                  >
                    Drawdown
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>

                <TableHead className="text-zinc-400 font-medium text-right">
                  Saldo Mensal
                </TableHead>

                <TableHead className="text-zinc-400 font-medium text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("saldoTotal")}
                    className="h-auto p-0 font-medium text-zinc-400 hover:text-zinc-100"
                  >
                    Saldo Total
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="text-center py-8 text-zinc-400"
                  >
                    Carregando dados...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="text-center py-8 text-zinc-400"
                  >
                    Nenhuma conta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedData.map((row) => (
                  <TableRow
                    key={row.subconta}
                    className="hover:bg-zinc-800/50 border-zinc-800"
                  >
                    {/* Status */}
                    <TableCell>
                      <div
                        className={`flex items-center ${getStatusColor(row.status)}`}
                      >
                        {getStatusIcon(row.status)}
                        <span className="ml-2 text-xs font-medium">
                          {row.status}
                        </span>
                      </div>
                    </TableCell>

                    {/* Subconta */}
                    <TableCell className="font-mono text-zinc-300">
                      {row.subconta}
                    </TableCell>

                    {/* Nome */}
                    <TableCell className="text-zinc-100 font-medium">
                      {row.nome}
                    </TableCell>

                    {/* Perfil de Risco */}
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {row.perfilRisco}
                      </Badge>
                    </TableCell>

                    {/* Operações Fechadas */}
                    <TableCell
                      className={`text-right font-medium ${getValueColor(row.operacoesFechadas)}`}
                    >
                      <div className="flex items-center justify-end">
                        {row.operacoesFechadas > 0 && (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        )}
                        {row.operacoesFechadas < 0 && (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {formatCurrency(row.operacoesFechadas)}
                      </div>
                    </TableCell>

                    {/* Operações Abertas */}
                    <TableCell
                      className={`text-right font-medium ${getValueColor(row.operacoesAbertas)}`}
                    >
                      <div className="flex items-center justify-end">
                        {row.operacoesAbertas > 0 && (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        )}
                        {row.operacoesAbertas < 0 && (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {formatCurrency(row.operacoesAbertas)}
                      </div>
                    </TableCell>

                    {/* Resultado Bruto */}
                    <TableCell
                      className={`text-right font-bold ${getValueColor(row.resultadoBruto)}`}
                    >
                      <div className="flex items-center justify-end">
                        {row.resultadoBruto > 0 && (
                          <TrendingUp className="mr-1 h-4 w-4" />
                        )}
                        {row.resultadoBruto < 0 && (
                          <TrendingDown className="mr-1 h-4 w-4" />
                        )}
                        {formatCurrency(row.resultadoBruto)}
                      </div>
                    </TableCell>

                    {/* Taxa Corretagem */}
                    <TableCell className="text-right text-zinc-400">
                      {typeof row.taxaCorretagem === "string" ? (
                        <Badge variant="secondary" className="text-xs">
                          {row.taxaCorretagem}
                        </Badge>
                      ) : (
                        formatCurrency(row.taxaCorretagem)
                      )}
                    </TableCell>

                    {/* Resultado Líquido */}
                    <TableCell
                      className={`text-right font-bold ${getValueColor(row.resultadoLiquido)}`}
                    >
                      <div className="flex items-center justify-end">
                        {row.resultadoLiquido > 0 && (
                          <TrendingUp className="mr-1 h-4 w-4" />
                        )}
                        {row.resultadoLiquido < 0 && (
                          <TrendingDown className="mr-1 h-4 w-4" />
                        )}
                        {formatCurrency(row.resultadoLiquido)}
                      </div>
                    </TableCell>

                    {/* Limite Perda Diária */}
                    <TableCell className="text-right text-red-400 font-medium">
                      {formatCurrency(row.limitePerdaDiaria)}
                    </TableCell>

                    {/* Drawdown Diário */}
                    <TableCell
                      className={`text-right font-medium ${
                        row.drawdownDiario >= row.limitePerdaDiaria
                          ? "text-red-500"
                          : row.drawdownDiario >= row.limitePerdaDiaria * 0.8
                            ? "text-yellow-500"
                            : "text-green-500"
                      }`}
                    >
                      <div className="flex items-center justify-end">
                        <TrendingDown className="mr-1 h-3 w-3" />
                        {formatCurrency(row.drawdownDiario)}
                        <span className="ml-1 text-xs">
                          (
                          {(
                            (row.drawdownDiario / row.limitePerdaDiaria) *
                            100
                          ).toFixed(0)}
                          %)
                        </span>
                      </div>
                    </TableCell>

                    {/* Saldo Mensal */}
                    <TableCell className="text-right text-zinc-400">
                      {typeof row.saldoMensal === "string" ? (
                        <Badge variant="secondary" className="text-xs">
                          {row.saldoMensal}
                        </Badge>
                      ) : (
                        formatCurrency(row.saldoMensal)
                      )}
                    </TableCell>

                    {/* Saldo Total */}
                    <TableCell className="text-right font-bold text-zinc-100">
                      {formatCurrency(row.saldoTotal)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Rodapé com última atualização */}
      {filteredAndSortedData.length > 0 && (
        <div className="text-xs text-zinc-500 text-center">
          Última atualização: {new Date().toLocaleString("pt-BR")} • Dados
          atualizados em tempo real via WebSocket
        </div>
      )}
    </div>
  );
}
