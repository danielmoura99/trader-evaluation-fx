// Adicione este componente em app/(dashboard)/nelogica-test/_components/risk-profile-form.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { testNelogicaCreateRiskProfile } from "../_actions/index";

interface RiskProfileFormProps {
  onSuccess: (profileId: string) => void;
  onError: (error: string) => void;
  addLog: (message: string) => void;
}

export function RiskProfileForm({
  onSuccess,
  onError,
  addLog,
}: RiskProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
    gainRule: 1500,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    addLog("Criando perfil de risco com os seguintes parâmetros:");
    addLog(JSON.stringify(formData, null, 2));

    try {
      const result = await testNelogicaCreateRiskProfile(formData);

      if (result.success) {
        addLog(
          `✅ Perfil de risco criado com sucesso! ID: ${result.profileId}`
        );
        onSuccess("");
      } else {
        addLog(`❌ Falha ao criar perfil de risco: ${result.error}`);
        onError(result.error || "Erro desconhecido");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      addLog(`❌ Erro: ${errorMessage}`);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">Criar Perfil de Risco</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400">Saldo Inicial</Label>
              <Input
                type="number"
                name="initialBalance"
                value={formData.initialBalance}
                onChange={handleInputChange}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Saldo inicial da conta em dólares
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-400">Trailing</Label>
                <p className="text-xs text-zinc-500">
                  Valores só aumentam com EOD
                </p>
              </div>
              <Switch
                checked={formData.trailing}
                onCheckedChange={(checked) =>
                  handleSwitchChange("trailing", checked)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400">Stop Out Rule</Label>
              <Input
                type="number"
                name="stopOutRule"
                value={formData.stopOutRule}
                onChange={handleInputChange}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
              <p className="text-xs text-zinc-500 mt-1">
                % máxima de margem usada
              </p>
            </div>

            <div>
              <Label className="text-zinc-400">Alavancagem</Label>
              <Input
                type="number"
                name="leverage"
                value={formData.leverage}
                onChange={handleInputChange}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Multiplicador (ex: 5x)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-400">Habilitar Comissões</Label>
                <p className="text-xs text-zinc-500">
                  Cobrar taxas por operação
                </p>
              </div>
              <Switch
                checked={formData.commissionsEnabled}
                onCheckedChange={(checked) =>
                  handleSwitchChange("commissionsEnabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-400">Limite de Contratos</Label>
                <p className="text-xs text-zinc-500">
                  Limitar número de contratos
                </p>
              </div>
              <Switch
                checked={formData.enableContractExposure}
                onCheckedChange={(checked) =>
                  handleSwitchChange("enableContractExposure", checked)
                }
              />
            </div>
          </div>

          {formData.enableContractExposure && (
            <div>
              <Label className="text-zinc-400">
                Número Máximo de Contratos
              </Label>
              <Input
                type="number"
                name="contractExposure"
                value={formData.contractExposure}
                onChange={handleInputChange}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Máximo de contratos simultâneos
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-400">Habilitar Perda Máxima</Label>
                <p className="text-xs text-zinc-500">Limitar perda máxima</p>
              </div>
              <Switch
                checked={formData.enableLoss}
                onCheckedChange={(checked) =>
                  handleSwitchChange("enableLoss", checked)
                }
              />
            </div>

            {formData.enableLoss && (
              <div>
                <Label className="text-zinc-400">
                  Regra de Perda (Loss Rule)
                </Label>
                <Input
                  type="number"
                  name="lossRule"
                  value={formData.lossRule}
                  onChange={handleInputChange}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
                <p className="text-xs text-zinc-500 mt-1">Valor em dólares</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-400">Habilitar Ganho Máximo</Label>
                <p className="text-xs text-zinc-500">Limitar ganho máximo</p>
              </div>
              <Switch
                checked={formData.enableGain}
                onCheckedChange={(checked) =>
                  handleSwitchChange("enableGain", checked)
                }
              />
            </div>

            {formData.enableGain && (
              <div>
                <Label className="text-zinc-400">
                  Regra de Ganho (Gain Rule)
                </Label>
                <Input
                  type="number"
                  name="gainRule"
                  value={formData.gainRule}
                  onChange={handleInputChange}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
                <p className="text-xs text-zinc-500 mt-1">Valor em dólares</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Textarea
              value={`Saldo Inicial: $${formData.initialBalance}
Trailing: ${formData.trailing ? "Sim" : "Não"}
Stop Out Rule: ${formData.stopOutRule}%
Alavancagem: ${formData.leverage}x
Comissões: ${formData.commissionsEnabled ? "Ativadas" : "Desativadas"}
Limite de Contratos: ${formData.enableContractExposure ? `${formData.contractExposure} contratos` : "Desativado"}
Perda Máxima: ${formData.enableLoss ? `$${formData.lossRule}` : "Desativada"}
Ganho Máximo: ${formData.enableGain ? `$${formData.gainRule}` : "Desativado"}`}
              readOnly
              className="bg-zinc-800 border-zinc-700 text-zinc-300 h-32 font-mono text-sm"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar Perfil de Risco"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
