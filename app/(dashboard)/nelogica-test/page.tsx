/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/nelogica-test/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  testNelogicaAuth,
  testNelogicaCreateSubscription,
  testNelogicaCreateAccount,
  testNelogicaSetRisk,
  testNelogicaBlockAccount,
  testNelogicaUnblockAccount,
  testNelogicaConnectivity,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  testNelogicaListEnvironments,
  testNelogicaListSubscriptions,
} from "./_actions/index";
import { NelogicaMonitor } from "./_components/nelogica-monitor";
import { RiskProfileForm } from "./_components/risk-profile-form";

export default function NelogicaTestPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("connection");
  const [accountType, setAccountType] = useState<number>(0); // 0: Desafio (padrão)
  const [createdProfileId, setCreatedProfileId] = useState("");

  // Dados do formulário para criação de cliente/assinatura
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    cpf: "",
    phone: "",
    plan: "FX - 5K",
  });

  // IDs retornados pelas operações
  const [responseData, setResponseData] = useState({
    customerId: "",
    subscriptionId: "",
    licenseId: "",
    account: "",
    profileId: "",
  });

  // Dados das listas (para exibição)
  const [listData, setListData] = useState({
    environments: [] as any[],
    subscriptions: [] as any[],
    accounts: [] as any[],
  });

  const addLog = (message: string) => {
    setLogs((prev) => [message, ...prev]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleResponseDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResponseData({ ...responseData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      addLog("Testando autenticação na API da Nelogica...");
      const result = await testNelogicaAuth();

      if (result.success) {
        addLog(
          `✅ Autenticação bem-sucedida! Token expira em: ${result.expiresAt}`
        );
        toast({
          title: "Autenticação bem-sucedida",
          description: "Conexão com a API Nelogica estabelecida.",
        });
      } else {
        addLog(`❌ Falha na autenticação: ${result.error}`);
        toast({
          title: "Falha na autenticação",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      addLog(`❌ Erro: ${errorMessage}`);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnectivity = async () => {
    setLoading(true);
    try {
      addLog("Testando conectividade básica com o servidor Nelogica...");
      const result = await testNelogicaConnectivity();

      if (result.success) {
        addLog(
          `✅ Conectividade bem-sucedida! Resposta recebida em: ${result.elapsedTime}ms`
        );
        toast({
          title: "Conectividade confirmada",
          description:
            "Conexão básica com o servidor da Nelogica estabelecida.",
        });
      } else {
        addLog(`❌ Falha na conectividade: ${result.error}`);
        toast({
          title: "Falha na conectividade",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      addLog(`❌ Erro: ${errorMessage}`);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.cpf
    ) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      addLog(
        `Criando assinatura para: ${formData.firstName} ${formData.lastName}`
      );
      const result = await testNelogicaCreateSubscription({
        planId: "c0dc847f-8fe6-4a31-ab14-62c2977ed4a0",
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        cpf: formData.cpf,
        phone: formData.phone,
        plan: formData.plan,
      });

      if (result.success) {
        addLog(`✅ Assinatura criada com sucesso!`);
        addLog(`📋 CustomerId: ${result.customerId}`);
        addLog(`📋 SubscriptionId: ${result.subscriptionId}`);
        addLog(`📋 LicenseId: ${result.licenseId}`);

        // Atualiza os dados de resposta para uso subsequente
        setResponseData({
          ...responseData,
          customerId: result.customerId || "",
          subscriptionId: result.subscriptionId || "",
          licenseId: result.licenseId || "",
        });

        // Muda para a aba de conta automaticamente
        setActiveTab("account");

        toast({
          title: "Assinatura criada",
          description: "Assinatura criada com sucesso na Nelogica.",
        });
      } else {
        addLog(`❌ Falha ao criar assinatura: ${result.error}`);
        toast({
          title: "Falha ao criar assinatura",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      addLog(`❌ Erro: ${errorMessage}`);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!responseData.licenseId) {
      toast({
        title: "LicenseId obrigatório",
        description: "Crie uma assinatura primeiro ou insira um LicenseId.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      addLog(`Criando conta para licença: ${responseData.licenseId}`);

      // Use o profileId criado, se disponível
      const profileIdToUse = createdProfileId || undefined;

      const result = await testNelogicaCreateAccount({
        licenseId: responseData.licenseId,
        name: `${formData.firstName} ${formData.lastName}`,
        plan: formData.plan,
        accountType: accountType,
        profileId: profileIdToUse, // Adicionado esta linha
      });

      if (result.success) {
        addLog(`✅ Conta criada com sucesso!`);
        addLog(`📋 AccountId: ${result.account}`);
        addLog(`📋 ProfileId: ${result.profileId}`);

        // Atualiza dados de resposta
        setResponseData({
          ...responseData,
          account: result.account || "",
          profileId: result.profileId || "",
        });

        // Muda para a aba de perfil de risco
        setActiveTab("risk");

        toast({
          title: "Conta criada",
          description: "Conta criada com sucesso na Nelogica.",
        });
      } else {
        addLog(`❌ Falha ao criar conta: ${result.error}`);
        toast({
          title: "Falha ao criar conta",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      addLog(`❌ Erro: ${errorMessage}`);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetRisk = async () => {
    if (!responseData.licenseId || !responseData.account) {
      toast({
        title: "LicenseId e AccountId obrigatórios",
        description: "Crie uma assinatura e uma conta primeiro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      addLog(
        `Configurando perfil de risco para conta: ${responseData.account}`
      );
      const result = await testNelogicaSetRisk({
        licenseId: responseData.licenseId,
        account: responseData.account,
        plan: formData.plan,
      });

      if (result.success) {
        addLog(`✅ Perfil de risco configurado com sucesso!`);

        // Muda para a aba de gerenciamento
        setActiveTab("manage");

        toast({
          title: "Perfil de risco configurado",
          description: "Perfil de risco configurado com sucesso na Nelogica.",
        });
      } else {
        addLog(`❌ Falha ao configurar perfil de risco: ${result.error}`);
        toast({
          title: "Falha ao configurar perfil de risco",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      addLog(`❌ Erro: ${errorMessage}`);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockAccount = async () => {
    if (!responseData.licenseId || !responseData.account) {
      toast({
        title: "LicenseId e AccountId obrigatórios",
        description: "Crie uma assinatura e uma conta primeiro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      addLog(`Bloqueando conta: ${responseData.account}`);
      const result = await testNelogicaBlockAccount({
        licenseId: responseData.licenseId,
        account: responseData.account,
      });

      if (result.success) {
        addLog(`✅ Conta bloqueada com sucesso!`);
        toast({
          title: "Conta bloqueada",
          description: "Conta bloqueada com sucesso na Nelogica.",
        });
      } else {
        addLog(`❌ Falha ao bloquear conta: ${result.error}`);
        toast({
          title: "Falha ao bloquear conta",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      addLog(`❌ Erro: ${errorMessage}`);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockAccount = async () => {
    if (!responseData.licenseId || !responseData.account) {
      toast({
        title: "LicenseId e AccountId obrigatórios",
        description: "Crie uma assinatura e uma conta primeiro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      addLog(`Desbloqueando conta: ${responseData.account}`);
      const result = await testNelogicaUnblockAccount({
        licenseId: responseData.licenseId,
        account: responseData.account,
      });

      if (result.success) {
        addLog(`✅ Conta desbloqueada com sucesso!`);
        toast({
          title: "Conta desbloqueada",
          description: "Conta desbloqueada com sucesso na Nelogica.",
        });
      } else {
        addLog(`❌ Falha ao desbloquear conta: ${result.error}`);
        toast({
          title: "Falha ao desbloquear conta",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      addLog(`❌ Erro: ${errorMessage}`);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleListSubscriptions = async () => {
    setLoading(true);
    try {
      addLog("Listando assinaturas na Nelogica...");
      const result = await testNelogicaListSubscriptions();

      if (result.success) {
        addLog(`✅ Assinaturas listadas com sucesso!`);
        addLog(`📋 Total: ${result.subscriptions?.length || 0} assinaturas`);

        // Atualiza a lista de assinaturas
        setListData({
          ...listData,
          subscriptions: result.subscriptions || [],
        });

        toast({
          title: "Assinaturas listadas",
          description: `${result.subscriptions?.length || 0} assinaturas encontradas.`,
        });
      } else {
        addLog(`❌ Falha ao listar assinaturas: ${result.error}`);
        toast({
          title: "Falha ao listar assinaturas",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      addLog(`❌ Erro: ${errorMessage}`);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Renderização com visualização aprimorada
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-zinc-100">
        Teste da API Nelogica
      </h1>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="p-3">
            <CardTitle className="text-sm text-zinc-400">Cliente ID</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-base text-zinc-100 truncate">
              {responseData.customerId || "Não criado"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="p-3">
            <CardTitle className="text-sm text-zinc-400">
              Assinatura ID
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-base text-zinc-100 truncate">
              {responseData.subscriptionId || "Não criado"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="p-3">
            <CardTitle className="text-sm text-zinc-400">Licença ID</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-base text-zinc-100 truncate">
              {responseData.licenseId || "Não criado"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="p-3">
            <CardTitle className="text-sm text-zinc-400">Conta ID</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-base text-zinc-100 truncate">
              {responseData.account || "Não criado"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="p-3">
            <CardTitle className="text-sm text-zinc-400">Perfil ID</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-base text-zinc-100 truncate">
              {responseData.profileId || "Não definido"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulário de Teste - Com Tabs para organizar o fluxo */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">
              Configurações de Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="connection">Conexão</TabsTrigger>
                <TabsTrigger value="risk-profile">Perfil de Risco</TabsTrigger>
                <TabsTrigger value="subscription">Assinatura</TabsTrigger>
                <TabsTrigger value="account">Conta</TabsTrigger>
                <TabsTrigger value="risk">Perfil de Risco</TabsTrigger>
                <TabsTrigger value="manage">Gerenciar</TabsTrigger>
              </TabsList>

              {/* Tab Conexão */}
              <TabsContent value="connection" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-200">
                    Teste de Conexão
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Primeiro passo: Teste a conectividade e autenticação com a
                    API Nelogica
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleTestConnectivity}
                      disabled={loading}
                      className="w-full"
                    >
                      Testar Conectividade
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleAuth}
                      disabled={loading}
                      className="w-full"
                    >
                      Testar Autenticação
                    </Button>
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("subscription")}
                      className="w-full"
                    >
                      Próximo: Criar Assinatura →
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Tab Perfil de Risco */}
              <TabsContent value="risk-profile" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-200">
                    Criação de Perfil de Risco
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Crie um perfil de risco para usar nas contas
                  </p>

                  <RiskProfileForm
                    onSuccess={(profileId) => {
                      setCreatedProfileId(profileId);
                      toast({
                        title: "Perfil de risco criado",
                        description: `Perfil de risco criado com sucesso. ID: ${profileId}`,
                      });
                    }}
                    onError={(error) => {
                      toast({
                        title: "Erro ao criar perfil de risco",
                        description: error,
                        variant: "destructive",
                      });
                    }}
                    addLog={addLog}
                  />

                  {createdProfileId && (
                    <div className="mt-4 p-4 rounded-md bg-green-500/10 border border-green-500/20">
                      <h4 className="text-sm font-medium text-green-500 mb-2">
                        Perfil de Risco Criado!
                      </h4>
                      <p className="text-xs text-green-400">
                        Perfil ID:{" "}
                        <span className="font-mono">{createdProfileId}</span>
                      </p>
                      <p className="text-xs text-zinc-400 mt-2">
                        Este ID será usado automaticamente ao criar contas.
                      </p>
                      <Button
                        className="mt-4 w-full"
                        variant="outline"
                        onClick={() => setActiveTab("subscription")}
                      >
                        Próximo: Criar Assinatura →
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab Assinatura */}
              <TabsContent value="subscription" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-200">
                    Criação de Assinatura
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Crie uma assinatura para um novo cliente
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-zinc-400">Nome</label>
                      <Input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Nome"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Sobrenome</label>
                      <Input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Sobrenome"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400">Email</label>
                    <Input
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-zinc-400">CPF</label>
                      <Input
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleInputChange}
                        placeholder="CPF (somente números)"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Telefone</label>
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Telefone"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400">Plano</label>
                    <Select
                      value={formData.plan}
                      onValueChange={(value) =>
                        handleSelectChange("plan", value)
                      }
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FX - 5K">FX - 5K</SelectItem>
                        <SelectItem value="FX - 10K">FX - 10K</SelectItem>
                        <SelectItem value="FX - 25K">FX - 25K</SelectItem>
                        <SelectItem value="FX - 50K">FX - 50K</SelectItem>
                        <SelectItem value="FX - 100K">FX - 100K</SelectItem>
                        <SelectItem value="FX - 150K">FX - 150K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("connection")}
                    >
                      ← Voltar
                    </Button>

                    <Button
                      variant="default"
                      onClick={handleCreateSubscription}
                      disabled={loading}
                    >
                      Criar Assinatura
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Tab Conta */}

              <TabsContent value="account" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-200">
                    Criação de Conta
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Crie uma conta vinculada à licença criada
                  </p>

                  <div>
                    <label className="text-xs text-zinc-400">LicenseId</label>
                    <Input
                      name="licenseId"
                      value={responseData.licenseId}
                      onChange={handleResponseDataChange}
                      placeholder="ID da Licença"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                    <p className="text-xs text-zinc-400 mt-1">
                      ID da licença criada na etapa anterior
                    </p>
                  </div>

                  {/* Adicionar seletor de tipo de conta */}
                  <div>
                    <label className="text-xs text-zinc-400">
                      Tipo de Conta
                    </label>
                    <Select
                      value={accountType.toString()}
                      onValueChange={(value) => setAccountType(parseInt(value))}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Conta de Desafio</SelectItem>
                        <SelectItem value="1">Conta Real/Financiada</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-zinc-400 mt-1">
                      Desafio: para avaliação | Real: para traders aprovados
                    </p>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("subscription")}
                    >
                      ← Voltar
                    </Button>

                    <Button
                      variant="default"
                      onClick={handleCreateAccount}
                      disabled={loading || !responseData.licenseId}
                    >
                      Criar Conta
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Tab Perfil de Risco */}
              <TabsContent value="risk" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-200">
                    Configuração de Perfil de Risco
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Configure o perfil de risco para a conta criada
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-zinc-400">LicenseId</label>
                      <Input
                        name="licenseId"
                        value={responseData.licenseId}
                        onChange={handleResponseDataChange}
                        placeholder="ID da Licença"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">AccountId</label>
                      <Input
                        name="account"
                        value={responseData.account}
                        onChange={handleResponseDataChange}
                        placeholder="ID da Conta"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400">
                      Plano (Perfil de Risco)
                    </label>
                    <Select
                      value={formData.plan}
                      onValueChange={(value) =>
                        handleSelectChange("plan", value)
                      }
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FX - 5K">FX - 5K</SelectItem>
                        <SelectItem value="FX - 10K">FX - 10K</SelectItem>
                        <SelectItem value="FX - 25K">FX - 25K</SelectItem>
                        <SelectItem value="FX - 50K">FX - 50K</SelectItem>
                        <SelectItem value="FX - 100K">FX - 100K</SelectItem>
                        <SelectItem value="FX - 150K">FX - 150K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("account")}
                    >
                      ← Voltar
                    </Button>

                    <Button
                      variant="default"
                      onClick={handleSetRisk}
                      disabled={
                        loading ||
                        !responseData.licenseId ||
                        !responseData.account
                      }
                    >
                      Configurar Perfil de Risco
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Tab Gerenciar */}
              <TabsContent value="manage" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-200">
                    Gerenciamento de Conta
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Gerencie a conta criada (bloqueio/desbloqueio)
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-zinc-400">LicenseId</label>
                      <Input
                        name="licenseId"
                        value={responseData.licenseId}
                        onChange={handleResponseDataChange}
                        placeholder="ID da Licença"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">AccountId</label>
                      <Input
                        name="account"
                        value={responseData.account}
                        onChange={handleResponseDataChange}
                        placeholder="ID da Conta"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={handleBlockAccount}
                      disabled={
                        loading ||
                        !responseData.licenseId ||
                        !responseData.account
                      }
                      className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                    >
                      Bloquear Conta
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleUnblockAccount}
                      disabled={
                        loading ||
                        !responseData.licenseId ||
                        !responseData.account
                      }
                      className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
                    >
                      Desbloquear Conta
                    </Button>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={handleListSubscriptions}
                      disabled={loading}
                      className="w-full"
                    >
                      Listar Assinaturas
                    </Button>
                  </div>

                  {listData.subscriptions.length > 0 && (
                    <div className="mt-4 p-3 bg-zinc-800 rounded-lg max-h-60 overflow-auto">
                      <h4 className="text-sm font-medium text-zinc-200 mb-2">
                        Assinaturas ({listData.subscriptions.length})
                      </h4>
                      {listData.subscriptions.map((sub, index) => (
                        <div
                          key={index}
                          className="text-xs text-zinc-300 mb-2 pb-2 border-b border-zinc-700"
                        >
                          <div>
                            <span className="text-zinc-400">ID:</span>{" "}
                            {sub.subscriptionId}
                          </div>
                          <div>
                            <span className="text-zinc-400">Licença:</span>{" "}
                            {sub.licenseId}
                          </div>
                          <div>
                            <span className="text-zinc-400">Cliente:</span>{" "}
                            {sub.customerId}
                          </div>
                          <div>
                            <span className="text-zinc-400">Criado:</span>{" "}
                            {new Date(sub.createdAt).toLocaleString()}
                          </div>
                          {sub.accounts && (
                            <div className="mt-1">
                              <span className="text-zinc-400">
                                Contas ({sub.accounts.length}):
                              </span>
                              <ul className="ml-2 mt-1">
                                {sub.accounts.map((acc: any, i: any) => (
                                  <li
                                    key={i}
                                    className="flex items-center gap-1"
                                  >
                                    <span className="text-zinc-400">•</span>{" "}
                                    {acc.account} ({acc.name})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("risk")}
                    >
                      ← Voltar
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => {
                        // Reset dos dados para novo teste
                        setResponseData({
                          customerId: "",
                          subscriptionId: "",
                          licenseId: "",
                          account: "",
                          profileId: "",
                        });
                        setActiveTab("connection");
                      }}
                    >
                      Novo Teste
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Logs de Teste */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-zinc-100">Logs de Teste</CardTitle>
            <Button
              variant="outline"
              onClick={() => setLogs([])}
              size="sm"
              className="h-8"
            >
              Limpar
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              className="h-[500px] bg-zinc-800 border-zinc-700 text-zinc-300 font-mono text-sm"
              value={logs.join("\n")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Informações de Ajuda */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Referência Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-200">
                Fluxo de Teste
              </h3>
              <p className="text-xs text-zinc-400">
                1. Teste a conexão e autenticação
                <br />
                2. Crie uma assinatura (subscription)
                <br />
                3. Crie uma conta (account) vinculada à licença
                <br />
                4. Configure o perfil de risco da conta
                <br />
                5. Gerencie a conta (bloqueio/desbloqueio)
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-200">
                Relação entre os Conceitos
              </h3>
              <p className="text-xs text-zinc-400">
                <b>Assinatura (Subscription)</b>: Representa o contrato/plano.
                <br />
                <b>Licença (License)</b>: Associada a uma assinatura (relação
                1:1).
                <br />
                <b>Conta (Account)</b>: Identifica o trader na plataforma.
                <br />
                <b>Perfil de Risco</b>: Define regras e limites da conta.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-200">
                IDs Importantes
              </h3>
              <p className="text-xs text-zinc-400">
                Os IDs são necessários para operações subsequentes:
                <br />- <b>LicenseId</b>: Usado para criar/gerenciar contas
                <br />- <b>AccountId</b>: Usado para operações na conta
                <br />- <b>SubscriptionId</b>: Usado para gerenciar assinaturas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Monitor Nelogica - Nova adição */}
      <NelogicaMonitor onRefresh={() => handleListSubscriptions()} />
    </div>
  );
}
