import { useEffect, useState, useCallback } from "react"; // Adicionado useCallback
import { Card, CardContent } from "../components/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../components/table";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { AddIrrigationDialog } from "../components/add_irrigation_dialog";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "../components/dialog";

export type IrrigationStatus = "Ativo" | "Concluido" | "EmExecucao";

export type IrrigationItem = {
  id: string;
  plantName: string;
  irrigationDate: string;
  irrigationDayOfWeek: string;
  irrigationTime: string;
  status: IrrigationStatus;
  specificDate: string;
  time: string;
};

function getDayOfWeek(dateStr: string) {
  const dias = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  const date = new Date(dateStr);
  // O +1 é necessário porque getDay() retorna 0 para domingo, 1 para segunda, etc.
  // E seu array 'dias' começa com "Domingo" no índice 0.
  // No entanto, se a data for 'invalid', getDay() retorna NaN, então é bom ter um fallback.
  const dayIndex = date.getDay();
  return isNaN(dayIndex) ? "Data inválida" : dias[dayIndex];
}

const statusVariant: Record<
  IrrigationStatus,
  "default" | "outline" | "secondary"
> = {
  Concluido: "default",
  Ativo: "outline",
  EmExecucao: "secondary",
};

export function Dashboard() {
  const [data, setData] = useState<Record<string, IrrigationItem>>({});
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState<IrrigationItem | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false); // Renomeado para maior clareza

  // Função para buscar e processar dados, reutilizável
  const fetchData = useCallback(() => {
    setLoading(true);
    const socket = new WebSocket(
      "wss://automatic-irrigation-server.onrender.com/ws"
    );

    socket.onopen = () => console.log("Conexão WebSocket aberta");
    socket.onerror = (err) => console.error("Erro WebSocket:", err);
    socket.onclose = (ev) => console.log("WebSocket fechado", ev);

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      const parsed: Record<string, IrrigationItem> = {};

      const now = new Date();

      Object.entries(payload).forEach(([key, item]: any) => {
        // Garantindo que specificDate e time estejam presentes
        if (!item.specificDate || !item.time) {
          console.warn(`Item ${key} missing specificDate or time`, item);
          return;
        }

        const startDt = new Date(`${item.specificDate}T${item.time}`);
        const diff = startDt.getTime() - now.getTime();

        const status: IrrigationStatus =
          diff < 0
            ? "Concluido"
            : diff <= 5 * 60 * 1000 // 5 minutos em milissegundos
            ? "EmExecucao"
            : "Ativo";

        parsed[key] = {
          id: key,
          plantName: item.plantName,
          irrigationDate: startDt.toLocaleDateString("pt-BR"),
          irrigationDayOfWeek: getDayOfWeek(item.specificDate),
          irrigationTime: item.time,
          status,
          specificDate: item.specificDate,
          time: item.time,
        };
      });

      setData(parsed);
      setLoading(false);
    };

    return () => socket.close();
  }, []); // Dependências vazias, pois só carrega uma vez

  useEffect(() => {
    const cleanup = fetchData(); // Chama fetchData e armazena a função de limpeza
    return cleanup; // Retorna a função de limpeza para o useEffect
  }, [fetchData]); // fetchData como dependência para useCallback

  async function deleteIrrigation(id: string) {
    setIsLoading(true);

    try {
      // Usando a URL do servidor, conforme seu código AddIrrigationDialog
      const res = await fetch(`https://automatic-irrigation-server.onrender.com/irrigation/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao excluir irrigação");

      toast.success("Irrigação excluída com sucesso");
      setConfirmId(null);
      fetchData(); // Recarrega os dados após a exclusão
    } catch (err) {
      console.error("Erro ao excluir:", err);
      toast.error("Erro ao excluir irrigação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  // Handler para abrir o diálogo de edição
  const handleEditClick = (item: IrrigationItem) => {
    setEditData(item);
    setIsAddEditDialogOpen(true);
  };

  // Handler para fechar o diálogo e resetar editData
  const handleAddEditDialogClose = (open: boolean) => {
    setIsAddEditDialogOpen(open);
    if (!open) {
      setEditData(null); // Limpa os dados de edição quando o diálogo é fechado
      fetchData(); // Recarrega os dados após uma edição/adição bem-sucedida
    }
  };

  return (
    <>
      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={!!confirmId}
        onOpenChange={(open) => !open && setConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p>Deseja realmente excluir essa irrigação?</p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmId) deleteIrrigation(confirmId);
              }}
              disabled={isLoading} // Desabilita o botão enquanto carrega
            >
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <LoaderCircle className="w-4 h-4 animate-spin text-destructive" />
                </div>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-none">
        <CardContent className="py-6 px-4 space-y-4 max-w-7xl m-auto">
          <div className="flex flex-wrap justify-between items-center mb-16 md:gap-12">
            <h2 className="text-3xl font-bold max-md:text-center">
              Agendamentos de Irrigação
            </h2>
            <div className="max-md:w-full max-md:mt-5">
              {/* Diálogo de adicionar/editar irrigação */}
              <AddIrrigationDialog
                irrigationToEdit={editData || undefined}
                open={isAddEditDialogOpen} // Controla a abertura/fechamento
                onOpenChange={handleAddEditDialogClose} // Lida com o fechamento e reseta o estado
              />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Carregando dados...</p>
          ) : (
            <>
              {/* Layout para telas pequenas */}
              <div className="md:hidden space-y-4">
                {Object.values(data).length === 0 ? (
                  <p className="text-center text-gray-500">
                    Nenhum agendamento encontrado.
                  </p>
                ) : (
                  Object.values(data).map((item) => (
                    <div
                      key={item.id}
                      className="border p-4 rounded-md shadow-sm bg-white"
                    >
                      <p>
                        <strong>Planta:</strong> {item.plantName}
                      </p>
                      <p>
                        <strong>Data:</strong> {item.irrigationDate}
                      </p>
                      <p>
                        <strong>Dia:</strong> {item.irrigationDayOfWeek}
                      </p>
                      <p>
                        <strong>Horário:</strong>{" "}
                        <Badge className="mr-1">{item.irrigationTime}</Badge>
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <Badge variant={statusVariant[item.status]}>
                          {item.status === "EmExecucao"
                            ? "Em execução"
                            : item.status}
                        </Badge>
                      </p>
                      <div className="flex justify-end gap-2 mt-2">
                        {item.status === "Ativo" && ( // Só permite edição se o status for Ativo
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEditClick(item)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {(item.status === "Ativo" ||
                          item.status === "Concluido") && ( // Permite exclusão se Ativo ou Concluído
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => setConfirmId(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {item.status === "EmExecucao" && (
                          <span className="text-sm text-gray-400">
                            Ações indisponíveis
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Layout para telas maiores */}
              <div className="hidden md:block">
                {Object.values(data).length === 0 ? (
                  <p className="text-center text-gray-500">
                    Nenhum agendamento encontrado.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Planta</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Dia</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.values(data).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.plantName}</TableCell>
                          <TableCell>{item.irrigationDate}</TableCell>
                          <TableCell>{item.irrigationDayOfWeek}</TableCell>
                          <TableCell>
                            <Badge className="mr-1">
                              {item.irrigationTime}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[item.status]}>
                              {item.status === "EmExecucao"
                                ? "Em execução"
                                : item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {item.status === "Ativo" && (
                              <>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleEditClick(item)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  onClick={() => setConfirmId(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {item.status === "Concluido" && (
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => setConfirmId(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                            {item.status === "EmExecucao" && (
                              <span className="text-sm text-gray-400">
                                Ações indisponíveis
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
