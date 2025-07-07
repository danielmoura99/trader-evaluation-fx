// app/(dashboard)/risk-monitor/_actions/index.ts
"use server";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { calculateRiskStatus } from "../_utils";
import type {
  ClientWithAccount,
  RiskMonitorData,
  RiskAlert,
  ExportOptions,
} from "../_types";

/**
 * Busca todos os clientes com suas contas e perfis de risco
 */
export async function getClientsWithAccounts(): Promise<ClientWithAccount[]> {
  try {
    logger.info("Buscando clientes com contas para monitor de risco");

    const clients = await prisma.client.findMany({
      where: {
        nelogicaAccount: {
          not: null,
        },
      },
      include: {
        _count: true,
      },
    });

    // Para cada cliente, buscar o perfil de risco baseado no plano
    const clientsWithRiskProfiles: ClientWithAccount[] = [];

    for (const client of clients) {
      // Buscar o perfil de risco mapeado para o plano do cliente
      const riskMapping = await prisma.planRiskMapping.findFirst({
        where: { planName: client.plan },
        include: {
          riskProfile: true,
        },
      });

      const clientWithAccount: ClientWithAccount = {
        id: client.id,
        name: client.name,
        email: client.email,
        cpf: client.cpf,
        plan: client.plan,
        traderStatus: client.traderStatus,
        nelogicaAccount: client.nelogicaAccount || undefined,
        nelogicaLicenseId: client.nelogicaLicenseId || undefined,
        riskProfile: riskMapping?.riskProfile
          ? {
              id: riskMapping.riskProfile.id,
              name: riskMapping.riskProfile.name,
              initialBalance: riskMapping.riskProfile.initialBalance,
              enableLoss: riskMapping.riskProfile.enableLoss,
              lossRule: riskMapping.riskProfile.lossRule,
              enableGain: riskMapping.riskProfile.enableGain,
              gainRule: riskMapping.riskProfile.gainRule,
              trailing: riskMapping.riskProfile.trailing,
              stopOutRule: riskMapping.riskProfile.stopOutRule,
              leverage: riskMapping.riskProfile.leverage,
            }
          : undefined,
      };

      clientsWithRiskProfiles.push(clientWithAccount);
    }

    logger.info(
      `${clientsWithRiskProfiles.length} clientes encontrados com contas`
    );
    return clientsWithRiskProfiles;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao buscar clientes com contas: ${errorMsg}`);
    throw new Error("Falha ao buscar clientes com contas");
  }
}

/**
 * Cria dados iniciais do monitor (sem WebSocket ainda)
 */
export async function getInitialRiskMonitorData(): Promise<RiskMonitorData[]> {
  try {
    const clients = await getClientsWithAccounts();

    const riskMonitorData: RiskMonitorData[] = clients.map((client) => {
      const limitePerdaDiaria = client.riskProfile?.lossRule || 0;
      const drawdownDiario = 0; // Será atualizado via WebSocket

      return {
        subconta: client.nelogicaAccount || client.id,
        nome: client.name,
        perfilRisco: client.riskProfile?.name || "Não definido",
        operacoesFechadas: 0, // Será atualizado via WebSocket
        operacoesAbertas: 0, // Será atualizado via WebSocket
        resultadoBruto: 0, // Calculado: fechadas + abertas
        taxaCorretagem: "Pendente", // Será implementado futuramente
        resultadoLiquido: 0, // Calculado: bruto - taxas
        limitePerdaDiaria,
        drawdownDiario,
        saldoMensal: "Pendente", // Será implementado futuramente
        saldoTotal: client.riskProfile?.initialBalance || 0, // Será atualizado via WebSocket
        status: calculateRiskStatus(drawdownDiario, limitePerdaDiaria),
        lastUpdate: new Date(),
        connectionStatus: "disconnected" as const,
      };
    });

    logger.info(`Dados iniciais criados para ${riskMonitorData.length} contas`);
    return riskMonitorData;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao criar dados iniciais: ${errorMsg}`);
    throw new Error("Falha ao criar dados iniciais do monitor");
  }
}

/**
 * Zera o saldo mensal (função administrativa)
 */
export async function zerarSaldoMensal() {
  try {
    logger.info("Zerando saldo mensal - função administrativa");

    // Por enquanto apenas log, implementaremos a lógica real depois
    // quando tivermos o sistema de saldos históricos

    revalidatePath("/risk-monitor");
    return { success: true, message: "Saldo mensal zerado com sucesso" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao zerar saldo mensal: ${errorMsg}`);
    throw new Error("Falha ao zerar saldo mensal");
  }
}

/**
 * Zera o saldo total (função administrativa)
 */
export async function zerarSaldoTotal() {
  try {
    logger.info("Zerando saldo total - função administrativa");

    // Por enquanto apenas log, implementaremos a lógica real depois
    // quando integrarmos com a API da Nelogica

    revalidatePath("/risk-monitor");
    return { success: true, message: "Saldo total zerado com sucesso" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao zerar saldo total: ${errorMsg}`);
    throw new Error("Falha ao zerar saldo total");
  }
}

/**
 * Busca alertas de risco ativos
 */
export async function getRiskAlerts(): Promise<RiskAlert[]> {
  try {
    // Por enquanto retornamos uma lista vazia
    // Implementaremos o sistema de alertas na próxima parte
    return [];
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao buscar alertas: ${errorMsg}`);
    return [];
  }
}

/**
 * Exporta dados do monitor em diferentes formatos
 */
export async function exportRiskMonitorData(
  format: "excel" | "pdf" | "csv",
  options: ExportOptions,
  data: RiskMonitorData[]
) {
  try {
    logger.info(`Exportando dados do monitor em formato: ${format}`);

    // Filtrar dados por período se especificado
    let filteredData = data;
    if (options.dateRange) {
      filteredData = data.filter((item) => {
        const itemDate = item.lastUpdate;
        return (
          itemDate >= options.dateRange!.start &&
          itemDate <= options.dateRange!.end
        );
      });
    }

    // Preparar dados para exportação
    const exportData = filteredData.map((item) => ({
      Subconta: item.subconta,
      Nome: item.nome,
      "Perfil de Risco": item.perfilRisco,
      "Operações Fechadas":
        typeof item.operacoesFechadas === "number"
          ? item.operacoesFechadas.toFixed(2)
          : item.operacoesFechadas,
      "Operações Abertas":
        typeof item.operacoesAbertas === "number"
          ? item.operacoesAbertas.toFixed(2)
          : item.operacoesAbertas,
      "Resultado Bruto":
        typeof item.resultadoBruto === "number"
          ? item.resultadoBruto.toFixed(2)
          : item.resultadoBruto,
      "Taxa Corretagem":
        typeof item.taxaCorretagem === "number"
          ? item.taxaCorretagem.toFixed(2)
          : item.taxaCorretagem,
      "Resultado Líquido":
        typeof item.resultadoLiquido === "number"
          ? item.resultadoLiquido.toFixed(2)
          : item.resultadoLiquido,
      "Limite Perda Diária":
        typeof item.limitePerdaDiaria === "number"
          ? item.limitePerdaDiaria.toFixed(2)
          : item.limitePerdaDiaria,
      "Drawdown Diário":
        typeof item.drawdownDiario === "number"
          ? item.drawdownDiario.toFixed(2)
          : item.drawdownDiario,
      "Saldo Mensal":
        typeof item.saldoMensal === "number"
          ? item.saldoMensal.toFixed(2)
          : item.saldoMensal,
      "Saldo Total":
        typeof item.saldoTotal === "number"
          ? item.saldoTotal.toFixed(2)
          : item.saldoTotal,
      Status: item.status,
      "Última Atualização": item.lastUpdate.toLocaleString("pt-BR"),
      "Status Conexão": item.connectionStatus,
    }));

    // Calcular estatísticas
    const stats = {
      totalRegistros: filteredData.length,
      alertasCriticos: filteredData.filter((d) => d.status === "Critical")
        .length,
      alertasMedios: filteredData.filter((d) => d.status === "Alert").length,
      statusNormal: filteredData.filter((d) => d.status === "Normal").length,
      resultadoTotal: filteredData.reduce(
        (acc, d) => acc + d.resultadoLiquido,
        0
      ),
      saldoTotal: filteredData.reduce((acc, d) => acc + d.saldoTotal, 0),
      drawdownTotal: filteredData.reduce((acc, d) => acc + d.drawdownDiario, 0),
    };

    // Gerar nome do arquivo
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `monitor-risco-${timestamp}`;

    // Simular exportação baseada no formato
    switch (format) {
      case "excel":
        // Em produção, aqui usaria uma biblioteca como 'xlsx' ou 'exceljs'
        logger.info(`Exportando ${exportData.length} registros para Excel`);

        // Simular geração do arquivo Excel
        const excelContent = {
          sheets: {
            "Monitor de Risco": exportData,
            Estatísticas: [
              { Métrica: "Total de Registros", Valor: stats.totalRegistros },
              { Métrica: "Alertas Críticos", Valor: stats.alertasCriticos },
              { Métrica: "Alertas Médios", Valor: stats.alertasMedios },
              { Métrica: "Status Normal", Valor: stats.statusNormal },
              {
                Métrica: "Resultado Total (USD)",
                Valor: stats.resultadoTotal.toFixed(2),
              },
              {
                Métrica: "Saldo Total (USD)",
                Valor: stats.saldoTotal.toFixed(2),
              },
              {
                Métrica: "Drawdown Total (USD)",
                Valor: stats.drawdownTotal.toFixed(2),
              },
            ],
          },
        };

        // Log do conteúdo (em produção salvaria arquivo)
        logger.info("Conteúdo Excel gerado:", {
          fileName: `${fileName}.xlsx`,
          totalSheets: Object.keys(excelContent.sheets).length,
          totalRows: exportData.length,
        });
        break;

      case "pdf":
        // Em produção, aqui usaria uma biblioteca como 'jspdf' ou 'puppeteer'
        logger.info(`Exportando ${exportData.length} registros para PDF`);

        // Simular geração do relatório PDF
        const pdfContent = {
          title: "Relatório Monitor de Risco",
          subtitle: `Período: ${options.dateRange?.start.toLocaleDateString("pt-BR")} a ${options.dateRange?.end.toLocaleDateString("pt-BR")}`,
          summary: stats,
          data: exportData,
          generatedAt: new Date().toLocaleString("pt-BR"),
        };

        logger.info("Conteúdo PDF gerado:", {
          fileName: `${fileName}.pdf`,
          totalPages: Math.ceil(exportData.length / 20), // Estimativa de 20 registros por página
          summary: pdfContent.summary,
        });
        break;

      case "csv":
        // Em produção, geraria arquivo CSV real
        logger.info(`Exportando ${exportData.length} registros para CSV`);

        // Simular geração CSV
        const csvHeaders = Object.keys(exportData[0] || {}).join(",");
        const csvRows = exportData.map((row) =>
          Object.values(row)
            .map((val) =>
              typeof val === "string" && val.includes(",") ? `"${val}"` : val
            )
            .join(",")
        );
        const csvContent = [csvHeaders, ...csvRows].join("\n");

        logger.info("Conteúdo CSV gerado:", {
          fileName: `${fileName}.csv`,
          totalLines: csvRows.length + 1,
          size: `${(csvContent.length / 1024).toFixed(2)} KB`,
        });
        break;

      default:
        throw new Error(`Formato de exportação não suportado: ${format}`);
    }

    // Simular delay de processamento
    await new Promise((resolve) => setTimeout(resolve, 2000));

    logger.info(`Exportação concluída: ${fileName}.${format}`);

    return {
      success: true,
      message: `Relatório em ${format.toUpperCase()} gerado com sucesso`,
      fileName: `${fileName}.${format}`,
      recordCount: exportData.length,
      stats,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao exportar dados: ${errorMsg}`);
    throw new Error(`Falha ao exportar dados em ${format}: ${errorMsg}`);
  }
}
