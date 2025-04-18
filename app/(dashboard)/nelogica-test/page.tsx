// app/(dashboard)/nelogica-test/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "./_actions/index";

export default function NelogicaTestPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [licenseId, setLicenseId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    cpf: "",
    phone: "",
    plan: "FX - 5K",
  });

  const addLog = (message: string) => {
    setLogs((prev) => [message, ...prev]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
        //setLicenseId(result.licenseId);

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
    if (!licenseId) {
      toast({
        title: "LicenseId obrigatório",
        description: "Crie uma assinatura primeiro ou insira um LicenseId.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      addLog(`Criando conta para licença: ${licenseId}`);
      const result = await testNelogicaCreateAccount({
        licenseId,
        name: `${formData.firstName} ${formData.lastName}`,
        plan: formData.plan,
      });

      if (result.success) {
        addLog(`✅ Conta criada com sucesso!`);
        addLog(`📋 AccountId: ${result.account}`);
        addLog(`📋 ProfileId: ${result.profileId}`);
        //setAccountId(result.account);

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
    if (!licenseId || !accountId) {
      toast({
        title: "LicenseId e AccountId obrigatórios",
        description: "Crie uma assinatura e uma conta primeiro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      addLog(`Configurando perfil de risco para conta: ${accountId}`);
      const result = await testNelogicaSetRisk({
        licenseId,
        account: accountId,
        plan: formData.plan,
      });

      if (result.success) {
        addLog(`✅ Perfil de risco configurado com sucesso!`);
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
    if (!licenseId || !accountId) {
      toast({
        title: "LicenseId e AccountId obrigatórios",
        description: "Crie uma assinatura e uma conta primeiro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      addLog(`Bloqueando conta: ${accountId}`);
      const result = await testNelogicaBlockAccount({
        licenseId,
        account: accountId,
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
    if (!licenseId || !accountId) {
      toast({
        title: "LicenseId e AccountId obrigatórios",
        description: "Crie uma assinatura e uma conta primeiro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      addLog(`Desbloqueando conta: ${accountId}`);
      const result = await testNelogicaUnblockAccount({
        licenseId,
        account: accountId,
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-zinc-100">
        Teste da API Nelogica
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulário de Teste */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">
              Configurações de Teste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-200">
                Teste de Conexão
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestConnectivity}
                  disabled={loading}
                >
                  Testar Conectividade
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAuth}
                  disabled={loading}
                >
                  Testar Autenticação
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-200">
                Dados do Cliente
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Nome"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
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
                  <Input
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    placeholder="CPF (somente números)"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
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
                <Select
                  value={formData.plan}
                  onValueChange={(value) => handleSelectChange("plan", value)}
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
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-200">
                LicenseId (preenchido automaticamente após criar assinatura)
              </h3>
              <Input
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
                placeholder="LicenseId"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-200">
                AccountId (preenchido automaticamente após criar conta)
              </h3>
              <Input
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="AccountId"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4">
              <Button
                variant="default"
                onClick={handleCreateSubscription}
                disabled={loading}
              >
                1. Criar Assinatura
              </Button>
              <Button
                variant="default"
                onClick={handleCreateAccount}
                disabled={loading || !licenseId}
              >
                2. Criar Conta
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="default"
                onClick={handleSetRisk}
                disabled={loading || !licenseId || !accountId}
              >
                3. Configurar Risco
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="destructive"
                  onClick={handleBlockAccount}
                  disabled={loading || !licenseId || !accountId}
                >
                  Bloquear
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUnblockAccount}
                  disabled={loading || !licenseId || !accountId}
                >
                  Desbloquear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs de Teste */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Logs de Teste</CardTitle>
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
    </div>
  );
}
