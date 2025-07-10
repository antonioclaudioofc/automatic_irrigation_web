import { LoaderCircle, Plus } from "lucide-react";
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

export function AddIrrigationDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const formIrrigation = useForm<IrrigationSchema>({
    resolver: zodResolver(irrigationSchema),
    defaultValues: {
      plantName: "",
      specificDate: "",
      time: "",
    },
  });

  const onSubmitIrrigation = (values: IrrigationSchema) => {
    setIsLoading(true);

    startTransition(async () => {
      try {
        const response = await fetch(
          "https://automatic-irrigation-server.vercel.app/irrigation",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          }
        );

        setIsLoading(false);

        if (!response.ok) {
          toast.error("Erro ao registrar, Tente novamente!");
          return;
        }

        const data = await response.json();
        if (data?.ok === true) {
          toast.success("Irrigação cadastrada com sucesso!");
          setOpen(false);
        } else {
          toast.error("Erro desconhecido");
        }
      } catch (err) {
        setIsLoading(false);
        toast.error("Erro ao registrar, Tente novamente!");
      }
    });
  };

  useEffect(() => {
    if (!open) formIrrigation.reset();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="max-md:w-full" asChild>
        <Button variant="default" className="gap-2">
          <Plus size={16} />
          Nova irrigação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Irrigação</DialogTitle>
        </DialogHeader>
        <Form {...formIrrigation}>
          <form
            id="form"
            method="post"
            onSubmit={formIrrigation.handleSubmit(onSubmitIrrigation)}
            className="space-y-3 mx-4"
          >
            <FormField
              control={formIrrigation.control}
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
              control={formIrrigation.control}
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
              control={formIrrigation.control}
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
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button form="form" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex justify-center items-center">
                    <LoaderCircle className="w-4 h-4 animate-spin text-emerald-700" />
                  </div>
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
