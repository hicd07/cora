import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateManualBidMutation } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { BidRequest } from "@/lib/types";

const manualBidSchema = z.object({
  storeName: z.string().min(1, "El nombre de la ferretería es requerido"),
  deliveryTime: z.string().min(1, "El tiempo de entrega es requerido"),
  offers: z.array(
    z.object({
      itemName: z.string(),
      unitPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),
      isAvailable: z.boolean().default(true),
    })
  ),
});

type ManualBidValues = z.infer<typeof manualBidSchema>;

interface AdminManualBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  bidRequest: BidRequest | null;
  defaultStoreName?: string;
}

export const AdminManualBidModal = ({
  isOpen,
  onClose,
  bidRequest,
  defaultStoreName,
}: AdminManualBidModalProps) => {
  const createManualBid = useCreateManualBidMutation();

  const form = useForm<ManualBidValues>({
    resolver: zodResolver(manualBidSchema),
    defaultValues: {
      storeName: defaultStoreName || "",
      deliveryTime: "Inmediato (1-2 horas)",
      offers: bidRequest?.items.map((item) => ({
        itemName: item.name,
        unitPrice: 0,
        isAvailable: true,
      })) || [],
    },
  });

  // Reset form when bidRequest or defaultStoreName changes
  React.useEffect(() => {
    if (bidRequest) {
      form.reset({
        storeName: defaultStoreName || "",
        deliveryTime: "Inmediato (1-2 horas)",
        offers: bidRequest.items.map((item) => ({
          itemName: item.name,
          unitPrice: 0,
          isAvailable: true,
        })),
      });
    }
  }, [bidRequest, defaultStoreName, form]);

  const onSubmit = async (values: ManualBidValues) => {
    if (!bidRequest) return;

    try {
      await createManualBid.mutateAsync({
        requestId: bidRequest.id,
        storeName: values.storeName,
        deliveryTime: values.deliveryTime,
        offers: values.offers.map(o => ({
          itemName: o.itemName,
          unitPrice: o.unitPrice,
          isAvailable: o.isAvailable
        })),
      });
      toast.success("Cotización registrada correctamente");
      onClose();
    } catch (error) {
      toast.error("Error al registrar la cotización");
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Cotización Manual</DialogTitle>
          <DialogDescription>
            Ingresa los precios obtenidos para {bidRequest?.title}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ferretería</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del negocio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo de Entrega</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 2-4 horas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-sm border-b pb-2">Precios por Material</h3>
              {bidRequest?.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center border-b border-border/50 pb-4 last:border-0">
                  <div className="col-span-5">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                  </div>
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`offers.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">RD$</span>
                              <Input type="number" step="0.01" className="pl-12" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <FormField
                      control={form.control}
                      name={`offers.${index}.isAvailable`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-xs font-normal">Disponible</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createManualBid.isPending}>
                {createManualBid.isPending ? "Guardando..." : "Guardar Cotización"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};