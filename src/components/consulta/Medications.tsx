import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { resourcesOfType, type MedicationRequest } from "@/lib/fhir";

type StatusFilter = "all" | "active" | "other";

export function Medications({ patientId }: { patientId: string }) {
  const { data, error, isLoading } = useAsync(
    () => api.patientHistory(patientId),
    [patientId],
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const medications = useMemo(
    () => (data ? resourcesOfType<MedicationRequest>(data, "MedicationRequest") : []),
    [data],
  );

  const filteredMedications = useMemo(() => {
    if (statusFilter === "active") return medications.filter((m) => m.status === "active");
    if (statusFilter === "other") return medications.filter((m) => m.status !== "active");
    return medications;
  }, [medications, statusFilter]);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as StatusFilter)}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Em uso</SelectItem>
          <SelectItem value="other">Outros</SelectItem>
        </SelectContent>
      </Select>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medicamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prescrito em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMedications.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{m.medicationCodeableConcept.text}</TableCell>
              <TableCell>
                <Badge variant={m.status === "active" ? "default" : "secondary"}>
                  {m.status === "active" ? "Em uso" : m.status}
                </Badge>
              </TableCell>
              <TableCell className="font-data">{m.authoredOn}</TableCell>
            </TableRow>
          ))}
          {medications.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Nenhum medicamento registrado.
              </TableCell>
            </TableRow>
          )}
          {medications.length > 0 && filteredMedications.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Nenhum medicamento encontrado para o filtro.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
