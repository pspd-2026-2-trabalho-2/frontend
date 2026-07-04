import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { resourcesOfType, type Patient } from "@/lib/fhir";
import { cn } from "@/lib/utils";

export function PatientList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data, error, isLoading } = useAsync(() => api.patients(), []);
  const patients = data ? resourcesOfType<Patient>(data, "Patient") : [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {patients.map((patient) => (
        <Card
          key={patient.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(patient.id)}
          className={cn(
            "cursor-pointer p-4 transition-shadow hover:shadow-hover",
            selectedId === patient.id && "ring-2 ring-primary/40",
          )}
        >
          <CardContent className="flex items-center justify-between p-0">
            <div>
              <p className="font-medium">{patient.name?.[0]?.text}</p>
              <p className="font-data text-xs text-muted-foreground">
                {patient.birthDate} · {patient.gender === "male" ? "Masculino" : "Feminino"}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
      {patients.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum paciente vinculado.</p>
      )}
    </div>
  );
}
