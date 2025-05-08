/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/risk-profiles/_components/risk-profile-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm /*Controller*/ } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {} from //Select,
//SelectContent,
//SelectItem,
//SelectTrigger,
//SelectValue
"@/components/ui/select";
import {
  createRiskProfile,
  updateRiskProfile,
  getAvailablePlans,
} from "../_actions";

// Schema de validação
const profileSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  initialBalance: z.coerce.number().positive("Deve ser um valor positivo"),
  trailing: z.boolean(),
  stopOutRule: z.coerce.number().positive("Deve ser um valor positivo"),
  leverage: z.coerce.number().positive("Deve ser um valor positivo"),
  commissionsEnabled: z.boolean(),
  enableContractExposure: z.boolean(),
  contractExposure: z.coerce.number().min(0, "Deve ser um valor não negativo"),
  enableLoss: z.boolean(),
  lossRule: z.coerce.number().min(0, "Deve ser um valor não negativo"),
  enableGain: z.boolean(),
  gainRule: z.coerce.number().min(0, "Deve ser um valor não negativo"),
  planMappings: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof profileSchema>;

interface RiskProfileFormProps {
  profile?: any; // O perfil a ser editado, se existir
  onComplete: (success: boolean) => void;
}

export function RiskProfileForm({ profile, onComplete }: RiskProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<string[]>([]);

  // Inicializar o formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile
      ? {
          ...profile,
          planMappings: profile.planMappings || [],
        }
      : {
          name: "",
          initialBalance: 5000,
          trailing: false,
          stopOutRule: 30,
          leverage: 10,
          commissionsEnabled: true,
          enableContractExposure: true,
          contractExposure: 10,
          enableLoss: true,
          lossRule: 500,
          enableGain: true,
          gainRule: 1000,
          planMappings: [],
        },
  });

  // Carregar planos disponíveis
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await getAvailablePlans();
        setAvailablePlans(plans);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast({
          title: "Erro ao carregar planos",
          description:
            "Não foi possível carregar a lista de planos disponíveis.",
          variant: "destructive",
        });
      }
    };

    loadPlans();
  }, [toast]);

  // Enviar o formulário
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (profile) {
        // Atualizar perfil existente
        await updateRiskProfile(profile.id, values);
        toast({
          title: "Perfil atualizado",
          description: "O perfil de risco foi atualizado com sucesso.",
        });
      } else {
        // Criar novo perfil
        await createRiskProfile(values);
        toast({
          title: "Perfil criado",
          description: "O perfil de risco foi criado com sucesso.",
        });
      }

      onComplete(true);
    } catch (error) {
      toast({
        title: "Erro ao salvar perfil",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      onComplete(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Perfil</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Avaliação FX 5K"
                      {...field}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="5000"
                      {...field}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stopOutRule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stop Out Rule (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      {...field}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 text-xs">
                    Percentual máximo de margem utilizada
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leverage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alavancagem</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10"
                      {...field}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 text-xs">
                    Multiplicador aplicado ao saldo para margem
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trailing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Trailing</FormLabel>
                    <FormDescription className="text-zinc-500 text-xs">
                      Apenas aumenta valores máximos de ganho/perda
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commissionsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Comissões</FormLabel>
                    <FormDescription className="text-zinc-500 text-xs">
                      Ativar cobrança de comissões
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Regras de ganho/perda e limites */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="enableLoss"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Perda Máxima</FormLabel>
                    <FormDescription className="text-zinc-500 text-xs">
                      Ativar regra de perda máxima
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("enableLoss") && (
              <FormField
                control={form.control}
                name="lossRule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Perda Máxima ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500"
                        {...field}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="enableGain"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Ganho Máximo</FormLabel>
                    <FormDescription className="text-zinc-500 text-xs">
                      Ativar regra de ganho máximo
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("enableGain") && (
              <FormField
                control={form.control}
                name="gainRule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Ganho Máximo ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000"
                        {...field}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="enableContractExposure"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Limite de Contratos</FormLabel>
                    <FormDescription className="text-zinc-500 text-xs">
                      Limitar número de contratos simultâneos
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("enableContractExposure") && (
              <FormField
                control={form.control}
                name="contractExposure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Máximo de Contratos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Associação com planos */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="planMappings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Planos associados</FormLabel>
                <FormDescription className="text-zinc-500 text-xs">
                  Selecione os planos que usarão este perfil de risco
                </FormDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availablePlans.map((plan) => (
                    <div
                      key={plan}
                      className={`
                        px-3 py-1.5 rounded-md cursor-pointer text-sm
                        ${
                          field.value?.includes(plan)
                            ? "bg-blue-900/50 border border-blue-500/50 text-blue-200"
                            : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700/50"
                        }
                      `}
                      onClick={() => {
                        const newValue = field.value?.includes(plan)
                          ? field.value.filter((p) => p !== plan)
                          : [...(field.value || []), plan];
                        field.onChange(newValue);
                      }}
                    >
                      {plan}
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onComplete(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Salvando..."
              : profile
                ? "Atualizar Perfil"
                : "Criar Perfil"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
