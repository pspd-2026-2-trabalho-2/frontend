import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { parseCohortStats, type FhirResource, type Observation, type Patient } from "@/lib/fhir";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-data text-2xl font-bold text-primary">{value}</p>
    </Card>
  );
}

function DistributionList({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        {Object.entries(data).map(([key, pct]) => (
          <div key={key} className="flex items-center justify-between">
            <span>{key}</span>
            <span className="font-data">{pct}%</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function groupByPatient(resources: FhirResource[]) {
  const groups: { patient: Patient; observations: Observation[] }[] = [];
  for (const resource of resources) {
    if (resource.resourceType === "Patient") {
      groups.push({ patient: resource, observations: [] });
    } else if (resource.resourceType === "Observation" && groups.length > 0) {
      groups[groups.length - 1].observations.push(resource);
    }
  }
  return groups;
}

export function CohortStats({ code }: { code: string }) {
  const stats = useAsync(() => api.cohortStats(code), [code]);
  const observations = useAsync(() => api.cohortObservations(code), [code]);

  if (stats.isLoading || observations.isLoading) return <Skeleton className="h-64 w-full" />;
  if (stats.error) return <p className="text-sm text-destructive">{stats.error}</p>;
  if (observations.error) return <p className="text-sm text-destructive">{observations.error}</p>;
  if (!stats.data || !observations.data) return null;

  const parsed = parseCohortStats(stats.data);
  const groups = groupByPatient(observations.data.entry.map((e) => e.resource));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total de casos" value={parsed.total.toLocaleString("pt-BR")} />
        <StatTile
          label="% Mulheres"
          value={`${parsed.genderDistribution.female ?? 0}%`}
        />
        <StatTile label="% Homens" value={`${parsed.genderDistribution.male ?? 0}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DistributionList title="Faixa etária" data={parsed.ageDistribution} />
        <DistributionList title="Departamentos mais usados" data={parsed.departmentDistribution} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exames por paciente (anonimizado)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Faixa etária</TableHead>
                <TableHead>Exames</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map(({ patient, observations }) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-data">{patient.id}</TableCell>
                  <TableCell>{patient.gender === "male" ? "M" : "F"}</TableCell>
                  <TableCell className="font-data">
                    {patient.extension?.find((e) => e.url === "ageRange")?.valueString}
                  </TableCell>
                  <TableCell className="font-data">
                    {observations
                      .map((o) => `${o.code.text}=${o.valueQuantity?.value}`)
                      .join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
