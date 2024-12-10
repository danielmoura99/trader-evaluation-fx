import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client, clientSchema, TraderStatus } from "@/app/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getClientByCPF } from "../_actions";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ClientFormProps {
  initialData?: Client;
  onSubmit: (data: Client) => void;
  onCancel: () => void;
}

export function ClientForm({
  initialData,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const form = useForm<Client>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialData || {
      traderStatus: TraderStatus.WAITING,
    },
  });

  const searchClientByCPF = async (cpf: string) => {
    if (cpf.length < 11) return;

    setIsSearching(true);
    try {
      const client = await getClientByCPF(cpf);
      if (client) {
        // Removemos o id e as datas de criação/atualização
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          id,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          createdAt,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          updatedAt,
          ...clientData
        } = client;

        // Formata os dados antes de atualizar o formulário
        const formattedClient = {
          ...clientData,
          // Campos obrigatórios
          name: clientData.name,
          cpf: clientData.cpf,
          phone: clientData.phone,
          email: clientData.email,
          platform: clientData.platform,
          plan: clientData.plan,
          // Garante que campos opcionais de texto nunca sejam null
          address: clientData.address || "",
          zipCode: clientData.zipCode || "",
          observation: clientData.observation || "",
          // Converte datas
          birthDate: new Date(clientData.birthDate),
          startDate: undefined, // Nova avaliação, nova data
          endDate: undefined, // Nova avaliação, nova data
          cancellationDate: undefined, // Nova avaliação, sem data de cancelamento
          // Garante o status correto para nova avaliação
          traderStatus: TraderStatus.WAITING,
          contacts:
            client.contacts?.map((contact) => ({
              ...contact,
              date: new Date(contact.date),
              createdAt: new Date(contact.createdAt),
              status: contact.status as
                | "Sem contato"
                | "Contatado"
                | "Não Interessado"
                | "Convertido",
            })) || [],
        };

        form.reset(formattedClient);

        toast({
          title: "Cliente encontrado",
          description: "Os dados foram preenchidos automaticamente.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Monitora mudanças no campo CPF
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "cpf" && value.cpf) {
        const cpf = value.cpf.replace(/\D/g, "");
        if (cpf.length === 11) {
          searchClientByCPF(cpf);
        }
      }
    });

    return () => subscription.unsubscribe();
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informações Básicas</h3>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        disabled={isSearching}
                        className={isSearching ? "bg-gray-100" : ""}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Endereço</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Informações da Avaliação */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informações da Avaliação</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plataforma</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Profit One">Profit One</SelectItem>
                      <SelectItem value="Profit Plus">Profit Plus</SelectItem>
                      <SelectItem value="Profit Pro">Profit Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TC - 50K">TC - 50K</SelectItem>
                      <SelectItem value="TC - 100K">TC - 100K</SelectItem>
                      <SelectItem value="TC - 250K">TC - 250K</SelectItem>
                      <SelectItem value="TC - 500K">TC - 500K</SelectItem>
                      <SelectItem value="Trader Estrategista">
                        Trader Estrategista
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="traderStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Situação do Trader</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a situação" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TraderStatus.WAITING}>
                      Aguardando Início
                    </SelectItem>
                    <SelectItem value={TraderStatus.IN_PROGRESS}>
                      Em Curso
                    </SelectItem>
                    <SelectItem value={TraderStatus.APPROVED}>
                      Aprovado
                    </SelectItem>
                    <SelectItem value={TraderStatus.REJECTED}>
                      Reprovado
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Fim</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="cancellationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Cancelamento</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : null
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="observation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observação</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
