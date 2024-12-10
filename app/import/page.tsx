"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function ImportPage() {
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import-csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Erro ao importar arquivo",
      });
    } finally {
      setIsLoading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Importar Clientes (CSV)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                id="csv-upload"
                disabled={isLoading}
              />
              <label htmlFor="csv-upload">
                <Button
                  variant="outline"
                  disabled={isLoading}
                  className="cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {isLoading ? "Importando..." : "Selecionar arquivo CSV"}
                  </span>
                </Button>
              </label>
            </div>

            {result && (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-zinc-900 p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Resumo da Importação
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p>Total de linhas: {result.totalRows}</p>
                      <p>Processados: {result.totalProcessed}</p>
                      <p>Criados com sucesso: {result.totalCreated}</p>
                    </div>
                    <div>
                      <p>Erros de CPF: {result.errorSummary?.cpfErrors}</p>
                      <p>Erros de data: {result.errorSummary?.dateErrors}</p>
                      <p>
                        Erros de criação: {result.errorSummary?.creationErrors}
                      </p>
                    </div>
                  </div>
                </div>

                {result.details?.cpfErrors?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-red-400">
                      Erros de CPF:
                    </h4>
                    <ul className="list-disc pl-5 mt-2"></ul>
                  </div>
                )}

                {result.details?.dateErrors?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-yellow-400">
                      Erros de Data:
                    </h4>
                    <ul className="list-disc pl-5 mt-2"></ul>
                  </div>
                )}

                {result.details?.creationErrors?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-red-400">
                      Erros de Criação:
                    </h4>
                    <ul className="list-disc pl-5 mt-2"></ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
