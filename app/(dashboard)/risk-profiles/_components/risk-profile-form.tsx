/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/risk-profiles/_components/risk-profile-form.tsx - VERSÃO OTIMIZADA
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  createRiskProfile,
  updateRiskProfile,
  getAvailablePlans,
  testRiskProfilesSingletonEconomy, // ✅ NOVO: Para testes
} from "../_actions";

/**
 * ✅ SCHEMA OTIMIZADO: Alinhado com documentação oficial da Nelogica
 * Baseado na documentação "NELOGICA BROKER API V2" v1.1
 */
const profileSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres"),

  // ✅ CAMPOS CONFORME DOCUMENTAÇÃO:
  initialBalance: z.coerce
    .number()
    .positive("Deve ser um valor positivo")
    .min(1000, "Saldo mínimo de $1,000")
    .max(1000000, "Saldo máximo de $1,000,000"), // Float ✅

  trailing: z.boolean(), // Bool ✅

  stopOutRule: z.coerce
    .number()
    .positive("Deve ser um valor positivo")
    .min(1, "Mínimo 1%")
    .max(100, "Máximo 100%"), // Float ✅

  // ✅ CORRIGIDO: Int conforme documentação
  leverage: z.coerce
    .number()
    .int("Deve ser um número inteiro")
    .positive("Deve ser um valor positivo")
    .min(1, "Alavancagem mínima: 1x")
    .max(100, "Alavancagem máxima: 100x"), // Int ✅

  commissionsEnabled: z.boolean(), // Bool ✅
  enableContractExposure: z.boolean(), // Bool ✅

  // ✅ CORRIGIDO: Int conforme documentação
  contractExposure: z.coerce
    .number()
    .int("Deve ser um número inteiro")
    .min(0, "Deve ser um valor não negativo")
    .max(1000, "Máximo 1000 contratos"), // Int ✅

  enableLoss: z.boolean(), // Bool ✅
  lossRule: z.coerce
    .number()
    .min(0, "Deve ser um valor não negativo")
    .max(1000000, "Valor máximo: $1,000,000"), // Float ✅

  enableGain: z.boolean(), // Bool ✅
  gainRule: z.coerce
    .number()
    .min(0, "Deve ser um valor não negativo")
    .max(1000000, "Valor máximo: $1,000,000"), // Float ✅

  planMappings: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof profileSchema>;

interface RiskProfileFormProps {
  profile?: any;
  onComplete: (success: boolean) => void;
}

export function RiskProfileForm({ profile, onComplete }: RiskProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<string[]>([]);
  const [isTestingOptimization, setIsTestingOptimization] = useState(false);

  // ✅ VALORES PADRÃO MELHORADOS: Baseados em perfis típicos
  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile
      ? {
          name: profile.name,
          initialBalance: profile.initialBalance,
          trailing: profile.trailing,
          stopOutRule: profile.stopOutRule,
          leverage: profile.leverage,
          commissionsEnabled: profile.commissionsEnabled,
          enableContractExposure: profile.enableContractExposure,
          contractExposure: profile.contractExposure,
          enableLoss: profile.enableLoss,
          lossRule: profile.lossRule,
          enableGain: profile.enableGain,
          gainRule: profile.gainRule,
          planMappings: profile.planMappings || [],
        }
      : {
          // ✅ VALORES PADRÃO REALISTAS:
          name: "",
          initialBalance: 25000, // $25K (valor comum)
          trailing: false,
          stopOutRule: 10, // 10% (padrão conservador)
          leverage: 10, // 10x (alavancagem moderada)
          commissionsEnabled: true,
          enableContractExposure: true,
          contractExposure: 5, // 5 contratos (conservador)
          enableLoss: true,
          lossRule: 2500, // 10% do saldo inicial
          enableGain: true,
          gainRule: 5000, // 20% do saldo inicial
          planMappings: [],
        },
  });

  // Carregar planos disponíveis
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await getAvailablePlans();
        setAvailablePlans(plans);
      } catch (error) {
        console.error("Erro ao carregar planos:", error);
        toast({
          title: "Aviso",
          description: "Não foi possível carregar os planos disponíveis.",
          variant: "destructive",
        });
      }
    };

    loadPlans();
  }, [toast]);

  // ✅ NOVA FUNÇÃO: Teste de otimização
  const handleTestOptimization = async () => {
    setIsTestingOptimization(true);
    try {
      const result = await testRiskProfilesSingletonEconomy();

      if (result.success) {
        toast({
          title: "🚀 Otimização Funcionando!",
          description: result.message,
        });
      } else {
        toast({
          title: "⚠️ Teste de Otimização",
          description: `Erro: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Não foi possível executar o teste de otimização.",
        variant: "destructive",
      });
    } finally {
      setIsTestingOptimization(false);
    }
  };

  // Submissão do formulário
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      console.log("📋 [Risk Profile Form] Dados do formulário:", values);
      console.log(
        "🎯 [Risk Profile Form] Usando actions otimizadas com Singleton"
      );

      if (profile) {
        // Atualizar perfil existente
        await updateRiskProfile(profile.id, values);
        toast({
          title: "✅ Perfil atualizado",
          description: `Perfil "${values.name}" atualizado com sucesso usando Singleton!`,
        });
      } else {
        // Criar novo perfil
        const result = await createRiskProfile(values);
        console.log("🆔 [Risk Profile Form] Perfil criado:", result);
        toast({
          title: "✅ Perfil criado",
          description: `Perfil "${values.name}" criado com sucesso usando Singleton!`,
        });
      }

      onComplete(true);
    } catch (error) {
      console.error("❌ [Risk Profile Form] Erro:", error);
      toast({
        title: "❌ Erro",
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
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome do perfil */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Perfil</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Perfil Conservador 25K"
                    {...field}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </FormControl>
                <FormDescription className="text-zinc-500 text-xs">
                  Nome identificador para este perfil de risco
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Configurações financeiras */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="25000"
                      {...field}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 text-xs">
                    Saldo inicial da conta
                  </FormDescription>
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
                      step="0.1"
                      placeholder="10"
                      {...field}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 text-xs">
                    Percentual de stop out
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Alavancagem e contratos */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="leverage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alavancagem (inteiro)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      placeholder="10"
                      {...field}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 text-xs">
                    Número inteiro (Ex: 10 = 10x)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractExposure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máx. Contratos (inteiro)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      placeholder="5"
                      {...field}
                      disabled={!form.watch("enableContractExposure")}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 text-xs">
                    Número inteiro
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Switches */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="trailing"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Trailing Stop</FormLabel>
                      <FormDescription className="text-zinc-500 text-xs">
                        Ativar trailing stop
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
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Comissões</FormLabel>
                      <FormDescription className="text-zinc-500 text-xs">
                        Habilitar comissões
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
                name="enableContractExposure"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Limitar Contratos</FormLabel>
                      <FormDescription className="text-zinc-500 text-xs">
                        Limitar número de contratos
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

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="enableLoss"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Perda Máxima</FormLabel>
                      <FormDescription className="text-zinc-500 text-xs">
                        Habilitar limite de perda
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
                name="enableGain"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Ganho Máximo</FormLabel>
                      <FormDescription className="text-zinc-500 text-xs">
                        Habilitar limite de ganho
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
          </div>

          {/* Regras de perda e ganho */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="lossRule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regra de Perda (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="2500"
                      {...field}
                      disabled={!form.watch("enableLoss")}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 text-xs">
                    Perda máxima permitida em USD
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gainRule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regra de Ganho (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="5000"
                      {...field}
                      disabled={!form.watch("enableGain")}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 text-xs">
                    Ganho máximo antes de parar
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Associação com planos */}
          <FormField
            control={form.control}
            name="planMappings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Planos Associados</FormLabel>
                <FormDescription className="text-zinc-500 text-xs">
                  Selecione os planos que usarão este perfil de risco
                </FormDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availablePlans.map((plan) => (
                    <div
                      key={plan}
                      className={`
                        px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors
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

          {/* Botões de ação */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onComplete(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting
                ? "Salvando..."
                : profile
                  ? "🔄 Atualizar Perfil"
                  : "✨ Criar Perfil"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
