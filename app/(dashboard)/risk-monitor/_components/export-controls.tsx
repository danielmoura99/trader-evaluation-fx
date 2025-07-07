// app/(dashboard)/risk-monitor/_components/export-controls.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Download,
  FileSpreadsheet,
  FileText,
  File,
  //Calendar,
  //Filter,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RiskMonitorData, ExportOptions } from "../_types";

interface ExportControlsProps {
  data: RiskMonitorData[];
  onExport: (
    format: "excel" | "pdf" | "csv",
    options: ExportOptions
  ) => Promise<void>;
}

export function ExportControls({ data, onExport }: ExportControlsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "excel",
    includeAlerts: true,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
      end: new Date(),
    },
  });

  const { toast } = useToast();

  // Função para realizar a exportação
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(exportOptions.format, exportOptions);

      toast({
        title: "Exportação Concluída",
        description: `Relatório em ${exportOptions.format.toUpperCase()} gerado com sucesso`,
      });

      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Exportação rápida (Excel simples)
  const handleQuickExport = async (format: "excel" | "pdf" | "csv") => {
    setIsExporting(true);
    try {
      await onExport(format, {
        format,
        includeAlerts: false,
      });

      toast({
        title: "Exportação Rápida",
        description: `Dados exportados em ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Gerar dados da exportação
  const generateExportData = () => {
    // Filtrar dados por período se especificado
    let filteredData = data;

    if (exportOptions.dateRange) {
      filteredData = data.filter((item) => {
        const itemDate = item.lastUpdate;
        return (
          itemDate >= exportOptions.dateRange!.start &&
          itemDate <= exportOptions.dateRange!.end
        );
      });
    }

    return filteredData;
  };

  // Obter estatísticas dos dados
  const getDataStats = () => {
    const exportData = generateExportData();
    return {
      totalRecords: exportData.length,
      criticalAlerts: exportData.filter((d) => d.status === "Critical").length,
      mediumAlerts: exportData.filter((d) => d.status === "Alert").length,
      normalStatus: exportData.filter((d) => d.status === "Normal").length,
      totalProfit: exportData.reduce((acc, d) => acc + d.resultadoLiquido, 0),
    };
  };

  const stats = getDataStats();

  return (
    <div className="flex items-center space-x-2">
      {/* Exportação Rápida */}
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickExport("excel")}
          disabled={isExporting || data.length === 0}
          className="text-green-600 hover:text-green-700"
        >
          <FileSpreadsheet className="h-4 w-4 mr-1" />
          Excel
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickExport("pdf")}
          disabled={isExporting || data.length === 0}
          className="text-red-600 hover:text-red-700"
        >
          <FileText className="h-4 w-4 mr-1" />
          PDF
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickExport("csv")}
          disabled={isExporting || data.length === 0}
          className="text-blue-600 hover:text-blue-700"
        >
          <File className="h-4 w-4 mr-1" />
          CSV
        </Button>
      </div>

      {/* Exportação Avançada */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm" disabled={data.length === 0}>
            <Settings className="h-4 w-4 mr-2" />
            Exportação Avançada
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Configurar Exportação
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Estatísticas dos Dados */}
            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-zinc-100 mb-3">
                Resumo dos Dados
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-zinc-400">Total de Registros</div>
                  <div className="text-zinc-100 font-medium">
                    {stats.totalRecords}
                  </div>
                </div>

                <div>
                  <div className="text-zinc-400">Alertas Críticos</div>
                  <div className="text-red-500 font-medium">
                    {stats.criticalAlerts}
                  </div>
                </div>

                <div>
                  <div className="text-zinc-400">Alertas Médios</div>
                  <div className="text-yellow-500 font-medium">
                    {stats.mediumAlerts}
                  </div>
                </div>

                <div>
                  <div className="text-zinc-400">Status Normal</div>
                  <div className="text-green-500 font-medium">
                    {stats.normalStatus}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-700">
                <div className="text-zinc-400 text-xs">Resultado Total</div>
                <div
                  className={`font-medium ${stats.totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {stats.totalProfit.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "USD",
                  })}
                </div>
              </div>
            </div>

            {/* Formato de Exportação */}
            <div className="space-y-2">
              <Label className="text-zinc-100">Formato</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: "excel" | "pdf" | "csv") =>
                  setExportOptions((prev) => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-red-600" />
                      PDF (.pdf)
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center">
                      <File className="h-4 w-4 mr-2 text-blue-600" />
                      CSV (.csv)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opções Adicionais */}
            <div className="space-y-3">
              <Label className="text-zinc-100">Opções</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAlerts"
                  checked={exportOptions.includeAlerts}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeAlerts: checked as boolean,
                    }))
                  }
                />
                <Label
                  htmlFor="includeAlerts"
                  className="text-sm text-zinc-300"
                >
                  Incluir histórico de alertas
                </Label>
              </div>
            </div>

            {/* Período */}
            <div className="space-y-3">
              <Label className="text-zinc-100">Período</Label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-zinc-400">Data Início</Label>
                  <Input
                    type="date"
                    value={
                      exportOptions.dateRange?.start.toISOString().split("T")[0]
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        setExportOptions((prev) => ({
                          ...prev,
                          dateRange: {
                            ...prev.dateRange!,
                            start: new Date(e.target.value),
                          },
                        }));
                      }
                    }}
                    className="bg-zinc-800 border-zinc-700 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs text-zinc-400">Data Fim</Label>
                  <Input
                    type="date"
                    value={
                      exportOptions.dateRange?.end.toISOString().split("T")[0]
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        setExportOptions((prev) => ({
                          ...prev,
                          dateRange: {
                            ...prev.dateRange!,
                            end: new Date(e.target.value),
                          },
                        }));
                      }
                    }}
                    className="bg-zinc-800 border-zinc-700 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isExporting}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleExport}
                disabled={isExporting || stats.totalRecords === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isExporting ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar {stats.totalRecords} registros
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Badge com contador */}
      {data.length > 0 && (
        <Badge variant="outline" className="text-zinc-400">
          {data.length} registros
        </Badge>
      )}
    </div>
  );
}
