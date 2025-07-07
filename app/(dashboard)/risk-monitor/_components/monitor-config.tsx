/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/risk-monitor/_components/monitor-config.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Bell,
  Volume2,
  Monitor,
  RefreshCw,
  Wifi,
  Database,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MonitorConfigProps {
  onConfigChange: (config: MonitorConfig) => void;
}

interface MonitorConfig {
  autoRefresh: boolean;
  refreshInterval: number; // em segundos
  soundAlerts: boolean;
  showNotifications: boolean;
  alertThresholds: {
    critical: number; // % do limite de perda
    warning: number; // % do limite de perda
  };
  displayOptions: {
    compactView: boolean;
    showPendingData: boolean;
    highlightChanges: boolean;
  };
  wsConfig: {
    autoReconnect: boolean;
    maxReconnectAttempts: number;
    reconnectDelay: number;
  };
}

const defaultConfig: MonitorConfig = {
  autoRefresh: true,
  refreshInterval: 30,
  soundAlerts: true,
  showNotifications: true,
  alertThresholds: {
    critical: 100, // 100% = limite excedido
    warning: 80, // 80% = próximo ao limite
  },
  displayOptions: {
    compactView: false,
    showPendingData: true,
    highlightChanges: true,
  },
  wsConfig: {
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 5000,
  },
};

export function MonitorConfig({ onConfigChange }: MonitorConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<MonitorConfig>(defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Carregar configuração salva do localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("risk-monitor-config");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...defaultConfig, ...parsed });
      }
    } catch (error) {
      console.warn("Erro ao carregar configuração:", error);
    }
  }, []);

  // Salvar configuração
  const saveConfig = () => {
    try {
      localStorage.setItem("risk-monitor-config", JSON.stringify(config));
      onConfigChange(config);
      setHasChanges(false);

      toast({
        title: "Configurações Salvas",
        description: "As configurações foram aplicadas com sucesso",
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    }
  };

  // Atualizar configuração
  const updateConfig = (updates: Partial<MonitorConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  // Resetar para padrões
  const resetToDefault = () => {
    setConfig(defaultConfig);
    setHasChanges(true);

    toast({
      title: "Configurações Resetadas",
      description: "Configurações restauradas para os valores padrão",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configurações do Monitor
            {hasChanges && (
              <Badge variant="default" className="ml-2">
                Alterado
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Atualização Automática */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-medium text-zinc-100">Atualização</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoRefresh" className="text-sm text-zinc-300">
                  Atualização Automática
                </Label>
                <Switch
                  id="autoRefresh"
                  checked={config.autoRefresh}
                  onCheckedChange={(checked) =>
                    updateConfig({ autoRefresh: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-zinc-300">
                  Intervalo (segundos)
                </Label>
                <Select
                  value={config.refreshInterval.toString()}
                  onValueChange={(value) =>
                    updateConfig({ refreshInterval: parseInt(value) })
                  }
                  disabled={!config.autoRefresh}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 segundos</SelectItem>
                    <SelectItem value="30">30 segundos</SelectItem>
                    <SelectItem value="60">1 minuto</SelectItem>
                    <SelectItem value="300">5 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Alertas e Notificações */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-medium text-zinc-100">Alertas</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="soundAlerts" className="text-sm text-zinc-300">
                  Alertas Sonoros
                </Label>
                <Switch
                  id="soundAlerts"
                  checked={config.soundAlerts}
                  onCheckedChange={(checked) =>
                    updateConfig({ soundAlerts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label
                  htmlFor="showNotifications"
                  className="text-sm text-zinc-300"
                >
                  Notificações na Tela
                </Label>
                <Switch
                  id="showNotifications"
                  checked={config.showNotifications}
                  onCheckedChange={(checked) =>
                    updateConfig({ showNotifications: checked })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-zinc-300">
                  Limite Crítico (% do limite de perda)
                </Label>
                <Input
                  type="number"
                  min="50"
                  max="150"
                  value={config.alertThresholds.critical}
                  onChange={(e) =>
                    updateConfig({
                      alertThresholds: {
                        ...config.alertThresholds,
                        critical: parseInt(e.target.value) || 100,
                      },
                    })
                  }
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-zinc-300">
                  Limite de Atenção (% do limite de perda)
                </Label>
                <Input
                  type="number"
                  min="50"
                  max="100"
                  value={config.alertThresholds.warning}
                  onChange={(e) =>
                    updateConfig({
                      alertThresholds: {
                        ...config.alertThresholds,
                        warning: parseInt(e.target.value) || 80,
                      },
                    })
                  }
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Opções de Exibição */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-medium text-zinc-100">Exibição</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="compactView" className="text-sm text-zinc-300">
                  Visualização Compacta
                </Label>
                <Switch
                  id="compactView"
                  checked={config.displayOptions.compactView}
                  onCheckedChange={(checked) =>
                    updateConfig({
                      displayOptions: {
                        ...config.displayOptions,
                        compactView: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label
                  htmlFor="showPendingData"
                  className="text-sm text-zinc-300"
                >
                  Mostrar Dados Pendente
                </Label>
                <Switch
                  id="showPendingData"
                  checked={config.displayOptions.showPendingData}
                  onCheckedChange={(checked) =>
                    updateConfig({
                      displayOptions: {
                        ...config.displayOptions,
                        showPendingData: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label
                  htmlFor="highlightChanges"
                  className="text-sm text-zinc-300"
                >
                  Destacar Mudanças
                </Label>
                <Switch
                  id="highlightChanges"
                  checked={config.displayOptions.highlightChanges}
                  onCheckedChange={(checked) =>
                    updateConfig({
                      displayOptions: {
                        ...config.displayOptions,
                        highlightChanges: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Configurações WebSocket */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-medium text-zinc-100">WebSocket</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="autoReconnect"
                  className="text-sm text-zinc-300"
                >
                  Reconexão Automática
                </Label>
                <Switch
                  id="autoReconnect"
                  checked={config.wsConfig.autoReconnect}
                  onCheckedChange={(checked) =>
                    updateConfig({
                      wsConfig: {
                        ...config.wsConfig,
                        autoReconnect: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-300">
                    Máx. Tentativas de Reconexão
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={config.wsConfig.maxReconnectAttempts}
                    onChange={(e) =>
                      updateConfig({
                        wsConfig: {
                          ...config.wsConfig,
                          maxReconnectAttempts: parseInt(e.target.value) || 5,
                        },
                      })
                    }
                    className="bg-zinc-800 border-zinc-700"
                    disabled={!config.wsConfig.autoReconnect}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-zinc-300">
                    Delay de Reconexão (ms)
                  </Label>
                  <Select
                    value={config.wsConfig.reconnectDelay.toString()}
                    onValueChange={(value) =>
                      updateConfig({
                        wsConfig: {
                          ...config.wsConfig,
                          reconnectDelay: parseInt(value),
                        },
                      })
                    }
                    disabled={!config.wsConfig.autoReconnect}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">1 segundo</SelectItem>
                      <SelectItem value="3000">3 segundos</SelectItem>
                      <SelectItem value="5000">5 segundos</SelectItem>
                      <SelectItem value="10000">10 segundos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo da Configuração */}
          <div className="bg-zinc-800 p-4 rounded-lg space-y-2">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-zinc-400" />
              <h4 className="text-sm font-medium text-zinc-100">Resumo</h4>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-zinc-400">Atualização:</div>
                <div className="text-zinc-100">
                  {config.autoRefresh ? `${config.refreshInterval}s` : "Manual"}
                </div>
              </div>

              <div>
                <div className="text-zinc-400">Alertas:</div>
                <div className="text-zinc-100">
                  {config.soundAlerts ? "Som + Visual" : "Apenas Visual"}
                </div>
              </div>

              <div>
                <div className="text-zinc-400">Crítico:</div>
                <div className="text-red-400">
                  {config.alertThresholds.critical}%
                </div>
              </div>

              <div>
                <div className="text-zinc-400">Atenção:</div>
                <div className="text-yellow-400">
                  {config.alertThresholds.warning}%
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={resetToDefault}
              disabled={!hasChanges}
            >
              Restaurar Padrões
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>

              <Button
                onClick={saveConfig}
                disabled={!hasChanges}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
