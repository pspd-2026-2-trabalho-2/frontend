import { LogOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/features/auth/roleLabels";
import { useAuth } from "@/features/auth/useAuth";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="font-heading text-lg font-bold text-primary">
            Prontuário HU
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-data text-sm text-foreground">{user.username}</span>
              <Badge variant="accent">{ROLE_LABELS[user.role]}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Sair">
              <LogOut />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
