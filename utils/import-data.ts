import { parse } from "csv-parse";
import { prisma } from "@/lib/prisma";

type TraderStatusType =
  | "Aguardando Inicio"
  | "Em Curso"
  | "Aprovado"
  | "Reprovado";

interface RawClientData {
  Nome: string;
  CPF: string;
  Telefone: string;
  "Data de Nascimento": string;
  Endereço: string;
  CEP: string;
  "E-mail": string;
  Plataforma: string;
  "Plano Contratado": string;
  "SITUAÇÃO DO TRADER": string;
  "Inicio da Avaliação": string;
  "Fim da Avaliação": string;
  OBS: string;
  "DATA DE CANCELAMENTO": string;
}

function formatDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "-") return null;

  try {
    // Trata datas no formato "dd/MM/yyyy"
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      // Garante que o ano tenha 4 dígitos
      const fullYear = year.length === 2 ? `20${year}` : year;
      const date = new Date(
        `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      );
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function formatCPF(cpf: string): string {
  // Remove caracteres não numéricos e completa com zeros à esquerda
  const numbersOnly = cpf.replace(/\D/g, "");
  return numbersOnly.padStart(11, "0");
}

function formatPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function mapTraderStatus(status: string): TraderStatusType {
  const statusMap: Record<string, TraderStatusType> = {
    "Aguardando Inicio": "Aguardando Inicio",
    "Em Curso": "Em Curso",
    Aprovado: "Aprovado",
    Reprovado: "Reprovado",
  };

  return statusMap[status] || "Aguardando Inicio";
}

// Constantes para controle de lotes e timeout
const BATCH_SIZE = 100; // Tamanho do lote para processamento
const TRANSACTION_TIMEOUT = 30000; // 30 segundos

async function processBatch(records: any[], validationLog: any) {
  await prisma.$transaction(
    async (tx) => {
      for (const record of records) {
        try {
          await tx.client.create({
            data: record,
          });
          validationLog.created.push(`${record.name} (${record.cpf})`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Erro desconhecido";
          validationLog.errors.push(
            `Erro ao criar ${record.name} (${record.cpf}): ${errorMessage}`
          );
        }
      }
    },
    {
      timeout: TRANSACTION_TIMEOUT,
    }
  );
}

export async function importClients(csvContent: string) {
  const records: RawClientData[] = [];
  const validationLog = {
    totalRows: 0,
    processed: [] as string[],
    invalid: [] as string[],
    created: [] as string[],
    errors: [] as string[],
    cpfErrors: [] as string[],
    dateErrors: [] as string[],
    otherErrors: [] as string[],
  };

  // Parse do CSV
  const parser = parse(csvContent, {
    delimiter: ";",
    columns: true,
    skip_empty_lines: true,
  });

  for await (const record of parser) {
    validationLog.totalRows++;
    records.push(record);
  }

  // Processar registros
  const processedRecords = records.map((record) => {
    const cpf = formatCPF(record.CPF || "");
    const birthDate = formatDate(record["Data de Nascimento"]);

    // Log específico para problemas
    if (!birthDate) {
      validationLog.dateErrors.push(
        `Data de nascimento inválida para ${record.Nome} (${cpf}): ${record["Data de Nascimento"]}`
      );
    }

    if (cpf.length !== 11) {
      validationLog.cpfErrors.push(
        `CPF inválido para ${record.Nome}: ${cpf} (original: ${record.CPF})`
      );
    }

    const address = record.Endereço?.trim();
    if (!address) {
      validationLog.otherErrors.push(
        `Endereço não fornecido para ${record.Nome} (${cpf})`
      );
    }

    return {
      name: record.Nome?.trim() || "",
      cpf,
      phone: formatPhone(record.Telefone || ""),
      birthDate: birthDate || new Date("1900-01-01"),
      address: address || "Não informado", // Valor padrão para endereço
      zipCode: record.CEP?.replace(/\D/g, "") || null,
      email: record["E-mail"]?.trim() || "",
      platform: record.Plataforma?.trim() || "",
      plan: record["Plano Contratado"]?.trim() || "",
      traderStatus: mapTraderStatus(record["SITUAÇÃO DO TRADER"]),
      startDate: formatDate(record["Inicio da Avaliação"]),
      endDate: formatDate(record["Fim da Avaliação"]),
      observation: record.OBS?.trim() || null,
      cancellationDate: formatDate(record["DATA DE CANCELAMENTO"]),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  console.log(`Total de registros lidos: ${validationLog.totalRows}`);
  console.log(`Registros processados: ${processedRecords.length}`);

  // Importar para o banco
  try {
    const batches = [];
    for (let i = 0; i < processedRecords.length; i += BATCH_SIZE) {
      batches.push(processedRecords.slice(i, i + BATCH_SIZE));
    }

    console.log(
      `Processando ${batches.length} lotes de ${BATCH_SIZE} registros`
    );

    // Processar cada lote
    for (let i = 0; i < batches.length; i++) {
      console.log(`Processando lote ${i + 1} de ${batches.length}`);
      await processBatch(batches[i], validationLog);

      // Pequeno delay entre os lotes para evitar sobrecarga
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const summary = {
      success: true,
      totalRows: validationLog.totalRows,
      totalProcessed: processedRecords.length,
      totalCreated: validationLog.created.length,
      totalErrors: validationLog.errors.length,
      details: {
        cpfErrors: validationLog.cpfErrors,
        dateErrors: validationLog.dateErrors,
        creationErrors: validationLog.errors,
        successfullyCreated: validationLog.created,
      },
      errorSummary: {
        cpfErrors: validationLog.cpfErrors.length,
        dateErrors: validationLog.dateErrors.length,
        creationErrors: validationLog.errors.length,
      },
    };

    console.log("Resumo da importação:", JSON.stringify(summary, null, 2));

    return summary;
  } catch (error) {
    console.error("Erro na importação:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      validationLog,
    };
  }
}
