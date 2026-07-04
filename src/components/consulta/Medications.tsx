import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { resourcesOfType, type MedicationRequest } from "@/lib/fhir";

export function Medications({ patientId }: { patientId: string }) {
  const { data, error, isLoading } = useAsync(
    () => api.patientMedications(patientId),
    [patientId],
  );

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return null;

  const medications = resourcesOfType<MedicationRequest>(data, "MedicationRequest");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Medicamento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Prescrito em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {medications.map((m) => (
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
      </TableBody>
    </Table>
  );
}
