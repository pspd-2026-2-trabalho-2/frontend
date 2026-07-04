import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { ClinicalHistory } from "@/components/consulta/ClinicalHistory";
import { ClinicalSummary } from "@/components/consulta/ClinicalSummary";
import { CohortStats } from "@/components/consulta/CohortStats";
import { LabResults } from "@/components/consulta/LabResults";
import { Medications } from "@/components/consulta/Medications";
import { PatientList } from "@/components/consulta/PatientList";
import { ResearcherProjects } from "@/components/consulta/ResearcherProjects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/useAuth";

const COHORTS = [
  { code: "diabetes", label: "Diabetes" },
  { code: "hipertensao", label: "Hipertensão" },
];

function MedicoOuEstagiarioView() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div>
        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Pacientes
        </h2>
        <PatientList selectedId={selectedPatientId} onSelect={setSelectedPatientId} />
      </div>

      <div>
        {selectedPatientId ? (
          <Tabs defaultValue="resumo">
            <TabsList>
              <TabsTrigger value="resumo">Resumo Clínico</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="exames">Exames</TabsTrigger>
              <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
            </TabsList>
            <TabsContent value="resumo">
              <ClinicalSummary patientId={selectedPatientId} />
            </TabsContent>
            <TabsContent value="historico">
              <ClinicalHistory patientId={selectedPatientId} />
            </TabsContent>
            <TabsContent value="exames">
              <LabResults patientId={selectedPatientId} />
            </TabsContent>
            <TabsContent value="medicamentos">
              <Medications patientId={selectedPatientId} />
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecione um paciente na lista para ver o prontuário.
          </p>
        )}
      </div>
    </div>
  );
}

function PesquisadorView() {
  const [cohort, setCohort] = useState(COHORTS[0].code);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Coorte
          </h2>
          <Select value={cohort} onValueChange={setCohort}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COHORTS.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CohortStats code={cohort} />
      </section>

      <section>
        <h2 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Meus projetos de pesquisa
        </h2>
        <ResearcherProjects />
      </section>
    </div>
  );
}

export function Consulta() {
  const { user } = useAuth();

  return (
    <AppShell>
      {user?.role === "PESQUISADOR" ? <PesquisadorView /> : <MedicoOuEstagiarioView />}
    </AppShell>
  );
}
