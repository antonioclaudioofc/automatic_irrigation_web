import { useEffect, useState } from "react";
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
import { Pencil, Trash2 } from "lucide-react";
import { AddIrrigationDialog } from "../components/add_irrigation_dialog";

export type IrrigationStatus = "Ativo" | "Concluido" | "EmExecucao";

type IrrigationItem = {
  id: string;
  plantName: string;
  irrigationDate: string;
  irrigationDayOfWeek: string;
  irrigationTime: string;
  status: IrrigationStatus;
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
  return dias[date.getDay() + 1];
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

  useEffect(() => {
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
        const startDt = new Date(`${item.specificDate}T${item.time}`);
        const diff = startDt.getTime() - now.getTime();

        const status: IrrigationStatus =
          diff < 0
            ? "Concluido"
            : diff <= 5 * 60 * 1000
            ? "EmExecucao"
            : "Ativo";

        parsed[key] = {
          id: key,
          plantName: item.plantName,
          irrigationDate: startDt.toLocaleDateString("pt-BR"),
          irrigationDayOfWeek: getDayOfWeek(item.specificDate),
          irrigationTime: item.time,
          status,
        };
      });

      setData(parsed);
      setLoading(false);
    };

    return () => socket.close();
  }, []);

  return (
    <Card className="border-none shadow-none">
      <CardContent className="py-6 px-4 space-y-4 max-w-7xl m-auto">
        <div className="flex flex-wrap justify-between items-center mb-16 md:gap-12">
          <h2 className="text-3xl font-bold max-md:text-center">
            Agendamentos de Irrigação
          </h2>
          <div className="max-md:w-full">
            <AddIrrigationDialog />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Carregando dados...</p>
        ) : (
          <>
            <div className="md:hidden space-y-4">
              {Object.values(data).map((item) => (
                <div
                  key={item.id}
                  className="border p-4 rounded-md shadow-sm bg-emerald-50"
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
                    <Button size="icon" variant="outline">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
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
                        <Badge className="mr-1">{item.irrigationTime}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[item.status]}>
                          {item.status === "EmExecucao"
                            ? "Em execução"
                            : item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="icon" variant="outline">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
