import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { resourcesOfType, type Observation } from "@/lib/fhir";

export function LabResults({ patientId }: { patientId: string }) {
  const { data, error, isLoading } = useAsync(
    () => api.patientHistory(patientId),
    [patientId],
  );

  const [filter, setFilter] = useState("");

  const observations = useMemo(
    () => (data ? resourcesOfType<Observation>(data, "Observation") : []),
    [data],
  );

  const filteredObservations = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return observations;
    return observations.filter((o) => o.code.text.toLowerCase().includes(needle));
  }, [observations, filter]);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filtrar por exame"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exame</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredObservations.map((o) => (
            <TableRow key={o.id}>
              <TableCell>{o.code.text}</TableCell>
              <TableCell className="font-data">
                {o.valueQuantity?.value} {o.valueQuantity?.unit}
              </TableCell>
              <TableCell className="font-data">{o.effectiveDateTime}</TableCell>
            </TableRow>
          ))}
          {observations.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Nenhum exame registrado.
              </TableCell>
            </TableRow>
          )}
          {observations.length > 0 && filteredObservations.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Nenhum exame encontrado para o filtro.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
