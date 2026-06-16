import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, UserPlus, Trash2, Users, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getCurrentDraw, saveDraw, type Draw, type Participant } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function Participants() {
  const [, setLocation] = useLocation();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentDraw().then((d) => {
      setDraw(d);
      setLoading(false);
    });
  }, []);

  const isLocked = draw?.drawnAt !== null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draw || !name.trim() || !email.trim()) return;
    if (isLocked) return;

    const duplicate = draw.participants.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (duplicate) {
      toast({ title: "Email já cadastrado", description: "Este email já foi adicionado.", variant: "destructive" });
      return;
    }

    setAdding(true);
    const participant: Participant = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
    };
    const updated = { ...draw, participants: [...draw.participants, participant] };
    await saveDraw(updated);
    setDraw(updated);
    setName("");
    setEmail("");
    setAdding(false);
    toast({ title: "Participante adicionado!" });
  }

  async function handleRemove(id: string) {
    if (!draw || isLocked) return;
    const updated = { ...draw, participants: draw.participants.filter((p) => p.id !== id) };
    await saveDraw(updated);
    setDraw(updated);
    toast({ title: "Participante removido" });
  }

  async function handleReset() {
    if (!draw) return;
    const updated = { ...draw, drawnAt: null, assignments: [] };
    await saveDraw(updated);
    setDraw(updated);
    toast({ title: "Sorteio resetado", description: "Você pode adicionar participantes novamente." });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!draw) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Nenhum grupo ativo.</p>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">Criar grupo</Button>
        </div>
      </div>
    );
  }

  const canDraw = draw.participants.length >= 3;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">{draw.name}</h1>
            <p className="text-sm text-muted-foreground">Participantes</p>
          </div>
          <Badge variant={isLocked ? "secondary" : "outline"} className="shrink-0">
            {isLocked ? <Lock className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
            {draw.participants.length}
          </Badge>
        </div>

        {isLocked && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 border border-secondary/30 mb-5">
            <Lock className="w-4 h-4 text-secondary-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-foreground">Lista bloqueada</p>
              <p className="text-xs text-muted-foreground mt-0.5">O sorteio já foi realizado. Resetar para editar.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-reset">Resetar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Resetar sorteio?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Os resultados do sorteio atual serão apagados. Os participantes serão mantidos. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} data-testid="button-confirm-reset">
                    Sim, resetar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {!isLocked && (
          <Card className="border-card-border mb-5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Adicionar participante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">Nome</Label>
                  <Input
                    id="p-name"
                    data-testid="input-participant-name"
                    placeholder="Nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-email">Email</Label>
                  <Input
                    id="p-email"
                    type="email"
                    data-testid="input-participant-email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!name.trim() || !email.trim() || adding}
                  data-testid="button-add-participant"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {draw.participants.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum participante ainda</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Adicione pelo menos 3 pessoas para começar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {draw.participants.map((p, idx) => (
              <div
                key={p.id}
                data-testid={`card-participant-${p.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                </div>
                {!isLocked && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(p.id)}
                    data-testid={`button-remove-participant-${p.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLocked && (
          <div className="mt-6 space-y-2">
            {!canDraw && draw.participants.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Adicione mais {3 - draw.participants.length} participante(s) para sortear.</span>
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={!canDraw}
              onClick={() => setLocation("/draw")}
              data-testid="button-go-draw"
            >
              Ir para o sorteio
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
