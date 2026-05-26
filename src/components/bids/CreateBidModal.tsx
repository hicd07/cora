import React, { useState } from "react";
import { Calendar, DollarSign, HardHat, PackagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateBidRequestMutation } from "@/hooks/useBidRequests";
import { QuoteItem } from "@/lib/types";
import { showError, showSuccess } from "@/utils/toast";

interface CreateBidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = ["Cemento y Agregados", "Metales y Estructuras", "Plomería", "Bloques y Ladrillos", "Electricidad"];
const SECTORS = ["Alma Rosa I", "Alma Rosa II", "Ensanche Ozama", "Lucerna", "San Isidro", "El Almirante"];
const UNITS = ["Fundas", "Varillas", "Metros Cúbicos", "Unidades", "Pies", "Cajas", "Quintales"];
const fieldClassName = "field-soft appearance-none pr-10";

export const CreateBidModal: React.FC<CreateBidModalProps> = ({ isOpen, onClose }) => {
  const createBidRequest = useCreateBidRequestMutation();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [sector, setSector] = useState(SECTORS[0]);
  const [address, setAddress] = useState("");
  const [budget, setBudget] = useState("");
  const [expiresIn, setExpiresIn] = useState("24");
  const [items, setItems] = useState<QuoteItem[]>([{ name: "", quantity: 1, unit: UNITS[0] }]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setCategory(CATEGORIES[0]);
    setSector(SECTORS[0]);
    setAddress("");
    setBudget("");
    setExpiresIn("24");
    setItems([{ name: "", quantity: 1, unit: UNITS[0] }]);
  };

  const handleAddItem = () => {
    setItems((current) => [...current, { name: "", quantity: 1, unit: UNITS[0] }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((current) => (current.length > 1 ? current.filter((_, currentIndex) => currentIndex !== index) : current));
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    setItems((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              [field]: field === "quantity" ? Number.parseFloat(String(value)) || 0 : value,
            }
          : item,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !address.trim()) {
      showError("Completa el nombre del proyecto y la dirección de entrega.");
      return;
    }

    const validItems = items.filter((item) => item.name.trim() && item.quantity > 0);
    if (validItems.length === 0) {
      showError("Añade al menos un material válido.");
      return;
    }

    try {
      await createBidRequest.mutateAsync({
        title: title.trim(),
        category,
        sector,
        deliveryAddress: address.trim(),
        budgetLimit: budget ? Number.parseFloat(budget) : null,
        expiresAt: new Date(Date.now() + Number.parseInt(expiresIn, 10) * 60 * 60 * 1000).toISOString(),
        items: validItems,
      });

      showSuccess("Solicitud publicada con datos reales.");
      resetForm();
      onClose();
    } catch (error: any) {
      showError(error.message || "No se pudo publicar la solicitud.");
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex animate-in fade-in-0 duration-200 items-end justify-center">
      <div className="modal-sheet max-h-[92vh] w-full max-w-md overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-[hsl(var(--card)/0.94)] px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] border border-primary/20 bg-[hsl(var(--primary)/0.14)] text-primary">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">Nueva subasta</p>
              <h3 className="font-display text-base font-semibold text-foreground">Solicitar cotización</h3>
              <p className="mt-1 text-xs text-muted-foreground">Solo se guardarán datos persistidos en la base real.</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 pb-10">
          <div className="space-y-1.5">
            <label className="section-label block">Nombre de la obra o proyecto</label>
            <Input type="text" required placeholder="Ej: Vaciado de techo - segunda planta" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="section-label block">Categoría principal</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClassName}>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="section-label block">Lista de materiales</label>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="px-2 text-primary hover:bg-transparent">
                <PackagePlus className="h-3.5 w-3.5" />Añadir
              </Button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="panel-muted p-3.5">
                  <div className="grid grid-cols-[1fr_78px_98px_auto] items-center gap-2">
                    <Input type="text" required placeholder="Material" value={item.name} onChange={(e) => handleItemChange(index, "name", e.target.value)} />
                    <Input
                      type="number"
                      required
                      min="1"
                      placeholder="Cant."
                      value={item.quantity || ""}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      className="text-center"
                    />
                    <select value={item.unit} onChange={(e) => handleItemChange(index, "unit", e.target.value)} className={fieldClassName}>
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={items.length === 1} aria-label="Eliminar material">
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-muted p-4">
            <div className="space-y-1.5">
              <label className="section-label block">Sector de entrega</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className={fieldClassName}>
                {SECTORS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 space-y-1.5">
              <label className="section-label block">Dirección exacta de obra</label>
              <Input type="text" required placeholder="Calle, número y referencia" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="section-label flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />Presupuesto máximo
              </label>
              <Input type="number" placeholder="Opcional (RD$)" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="section-label flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />Duración de subasta
              </label>
              <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} className={fieldClassName}>
                <option value="12">12 horas</option>
                <option value="24">24 horas</option>
                <option value="48">48 horas</option>
                <option value="72">72 horas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">

            <Button type="button" variant="outline" onClick={onClose} disabled={createBidRequest.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createBidRequest.isPending}>
              {createBidRequest.isPending ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Publicar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBidModal;
