import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { resourcesOfType, type Observation } from "@/lib/fhir";

export function LabResults({ patientId }: { patientId: string }) {
  const { data, error, isLoading } = useAsync(
    () => api.patientObservations(patientId),
    [patientId],
  );

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return null;

  const observations = resourcesOfType<Observation>(data, "Observation");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Exame</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {observations.map((o) => (
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
      </TableBody>
    </Table>
  );
}
