"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ImportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Importação concluída",
          description: `${result.totalProcessed} registros importados com sucesso. ${result.totalInvalid} registros inválidos.`,
        });
      } else {
        throw new Error(result.error);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleImport}
        className="hidden"
        id="csv-upload"
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
            Importar CSV
          </span>
        </Button>
      </label>
    </div>
  );
}
