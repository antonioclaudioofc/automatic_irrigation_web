import { z } from "zod";

function isFutureDateTime(dateStr: string, timeStr: string) {
  const now = new Date();

  // Extrai ano, mês, dia da data
  const [year, month, day] = dateStr.split("-").map(Number);
  // Extrai hora e minuto
  const [hour, minute] = timeStr.split(":").map(Number);

  // Cria a data no horário local
  const fullDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);

  return fullDateTime > now;
}

export const irrigationSchema = z
  .object({
    plantName: z.string().min(1, { message: "Informe o nome da planta" }),
    specificDate: z.string().refine(
      (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [year, month, day] = dateStr.split("-").map(Number);
        const inputDate = new Date(year, month - 1, day);
        return inputDate >= today;
      },
      { message: "A data deve ser hoje ou futura" }
    ),
    time: z.string().min(1, { message: "Informe um horário" }),
  })
  .refine((data) => isFutureDateTime(data.specificDate, data.time), {
    message: "A hora deve ser futura em relação ao momento atual",
    path: ["time"],
  });

export type Irrigation = z.infer<typeof irrigationSchema>;
