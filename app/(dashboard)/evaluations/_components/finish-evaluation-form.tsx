// app/evaluation/_components/finish-evaluation-form.tsx
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { getSubscriptionPlanId } from "@/utils/plataform-helper";

const finishEvaluationSchema = z.object({
  status: z.enum(["Aprovado", "Reprovado"]),
});

type FinishEvaluationForm = z.infer<typeof finishEvaluationSchema>;

interface FinishEvaluationFormProps {
  client: {
    id: string;
    cpf: string;
    platform: string;
  };
  onSubmit: (data: FinishEvaluationForm) => void;
  onCancel: () => void;
}

export function FinishEvaluationForm({
  client,
  onSubmit,
  onCancel,
}: FinishEvaluationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<FinishEvaluationForm>({
    resolver: zodResolver(finishEvaluationSchema),
  });

  const handleSubmit = async (data: FinishEvaluationForm) => {
    setIsLoading(true);
    try {
      // Primeiro, cancela a conta na corretora
      const cancelResponse = await axios.post("/api/broker/cancel-account", {
        document: client.cpf.replace(/\D/g, ""),
        subscriptionPlanId: getSubscriptionPlanId(client.platform),
        testAccount: "1000380752",
      });

      if (!cancelResponse.data.success) {
        throw new Error("Falha ao cancelar conta na corretora");
      }

      // Se o cancelamento foi bem sucedido, prossegue com a finalização
      await onSubmit(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Erro ao finalizar avaliação:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao finalizar avaliação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status Final</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Reprovado">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Finalizando..." : "Finalizar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
