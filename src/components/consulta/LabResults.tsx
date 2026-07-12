import { useMemo, useState } from "react";

import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { resourcesOfType, type Observation } from "@/lib/fhir";
import { formatDate } from "@/lib/utils";

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-full" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function LabResults({ patientId }: { patientId: string }) {
  const { data, error, isLoading } = useApi(
    ["patientHistory", patientId],
    () => api.patientHistory(patientId),
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

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorState message={error} />;
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
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredObservations.map((o) => (
            <TableRow key={o.id}>
              <TableCell>{o.code.text}</TableCell>
              <TableCell className="font-data text-right">
                {o.valueQuantity?.value} {o.valueQuantity?.unit}
              </TableCell>
              <TableCell className="font-data">{formatDate(o.effectiveDateTime)}</TableCell>
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
