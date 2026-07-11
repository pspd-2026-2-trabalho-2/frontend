import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { resourcesOfType, type ResearchStudy } from "@/lib/fhir";

const STATUS_LABELS: Record<ResearchStudy["status"], string> = {
  active: "Aprovado",
  completed: "Concluído",
  "temporarily-closed-to-accrual": "Suspenso",
  withdrawn: "Rejeitado",
  "in-progress": "Pendente",
};

const STATUS_VARIANT: Record<ResearchStudy["status"], "default" | "secondary" | "destructive"> = {
  active: "default",
  completed: "secondary",
  "temporarily-closed-to-accrual": "destructive",
  withdrawn: "destructive",
  "in-progress": "secondary",
};

export function ResearcherProjects() {
  const { data, error, isLoading } = useAsync(() => api.projects(), []);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return null;

  const projects = resourcesOfType<ResearchStudy>(data, "ResearchStudy");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((project) => (
        <Card key={project.id}>
          <CardHeader>
            <CardTitle className="text-base">{project.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[project.status]}>
                {STATUS_LABELS[project.status]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
      {projects.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum projeto associado.</p>
      )}
    </div>
  );
}
