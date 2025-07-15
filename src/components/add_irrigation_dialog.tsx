import { LoaderCircle, Pencil, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./input";
import { Button } from "./button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogHeader,
  DialogFooter,
} from "./dialog";
import { irrigationSchema } from "../models/irrigation.model";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./form";
import { startTransition, useEffect, useState } from "react";
import toast from "react-hot-toast";

type IrrigationSchema = z.infer<typeof irrigationSchema>;

// Adaptação para aceitar e controlar a abertura/fechamento externamente
type AddIrrigationDialogProps = {
  irrigationToEdit?: {
    id: string;
    plantName: string;
    specificDate: string;
    time: string;
  };
  open: boolean; // Controlado pelo componente pai (Dashboard)
  onOpenChange: (open: boolean) => void; // Para notificar o pai sobre mudanças no estado de abertura
};

export function AddIrrigationDialog({
  irrigationToEdit,
  open, // Recebido como prop
  onOpenChange, // Recebido como prop
}: AddIrrigationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = Boolean(irrigationToEdit);

  const form = useForm<IrrigationSchema>({
    resolver: zodResolver(irrigationSchema),
    defaultValues: {
      plantName: "",
      specificDate: "",
      time: "",
    },
  });

  // Efeito para resetar o formulário e preencher dados de edição
  useEffect(() => {
    if (open && isEditing && irrigationToEdit) {
      form.reset({
        plantName: irrigationToEdit.plantName,
        specificDate: irrigationToEdit.specificDate,
        time: irrigationToEdit.time,
      });
    } else if (!open) {
      // Limpar o formulário quando o diálogo é fechado
      form.reset({
        plantName: "",
        specificDate: "",
        time: "",
      });
    }
  }, [open, isEditing, irrigationToEdit, form]); // Adicionado 'form' como dependência

  const onSubmit = (values: IrrigationSchema) => {
    setIsLoading(true);

    startTransition(async () => {
      try {
        const url = isEditing
          ? `https://automatic-irrigation-server.onrender.com/irrigation/${irrigationToEdit?.id}`
          : "https://automatic-irrigation-server.onrender.com/irrigation";

        const method = isEditing ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        setIsLoading(false);

        if (!response.ok) {
          toast.error("Erro ao salvar. Tente novamente!");
          return;
        }

        toast.success(
          isEditing
            ? "Irrigação atualizada com sucesso!"
            : "Irrigação cadastrada com sucesso!"
        );
        onOpenChange(false); // Notifica o componente pai para fechar o diálogo e recarregar dados
      } catch (err) {
        setIsLoading(false);
        console.error("Erro ao salvar:", err); // Log mais detalhado do erro
        toast.error("Erro ao salvar. Tente novamente!");
      }
    });
  };

  return (
    // 'open' e 'onOpenChange' agora controlam o estado do Dialog
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="max-md:w-full" asChild>
        {/* O botão de "Nova irrigação" / "Editar" só é renderizado como trigger
            se não estiver em modo de edição (ou seja, se for para abrir o dialog para adicionar) */}
        {!isEditing && (
          <Button variant="default" className="gap-2">
            <Plus size={16} />
            Nova irrigação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Irrigação" : "Agendar Irrigação"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id="form"
            method="post"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 mx-4"
          >
            <FormField
              control={form.control}
              name="plantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da planta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: tomate" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specificDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data específica</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button form="form" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex justify-center items-center">
                    <LoaderCircle className="w-4 h-4 animate-spin text-emerald-700" />
                  </div>
                ) : isEditing ? (
                  "Atualizar"
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
