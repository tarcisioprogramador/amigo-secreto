import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, History as HistoryIcon, Gift, Calendar, Users, ChevronRight, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getAllDraws, deleteDraw, saveDraw, type Draw } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function History() {
  const [, setLocation] = useLocation();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getAllDraws().then((all) => {
      setDraws(all);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id: string) {
    await deleteDraw(id);
    setDraws((prev) => prev.filter((d) => d.id !== id));
    toast({ title: "Sorteio excluído" });
  }

  async function handleSetActive(draw: Draw) {
    const all = await getAllDraws();
    await Promise.all(all.map(async (d) => {
      if (d.id !== draw.id) {
        return;
      }
    }));
    setLocation("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Histórico</h1>
            <p className="text-sm text-muted-foreground">Todos os sorteios salvos</p>
          </div>
          <Badge variant="outline">{draws.length}</Badge>
        </div>

        {draws.length === 0 ? (
          <div className="text-center py-16">
            <HistoryIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum sorteio ainda</p>
            <p className="text-sm text-muted-foreground/70 mt-1 mb-6">
              Crie seu primeiro grupo para começar
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-create-first">
              <Plus className="w-4 h-4 mr-2" />
              Criar grupo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {draws.map((draw) => (
              <Card
                key={draw.id}
                data-testid={`card-draw-${draw.id}`}
                className="border-card-border hover:border-primary/30 transition-all duration-150"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Gift className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{draw.name}</p>
                        <Badge
                          variant={draw.drawnAt ? "default" : "outline"}
                          className="text-xs shrink-0"
                        >
                          {draw.drawnAt ? "Sorteado" : "Pendente"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(draw.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {draw.participants.length} participantes
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    {draw.drawnAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedDraw(draw)}
                        data-testid={`button-view-draw-${draw.id}`}
                      >
                        <ChevronRight className="w-3 h-3 mr-1" />
                        Ver resultados
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          data-testid={`button-delete-draw-${draw.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir sorteio?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O sorteio "{draw.name}" será excluído permanentemente, incluindo todos os participantes e resultados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(draw.id)}
                            data-testid={`button-confirm-delete-${draw.id}`}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!selectedDraw} onOpenChange={(open) => !open && setSelectedDraw(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedDraw && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle>{selectedDraw.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Sorteado em {new Date(selectedDraw.drawnAt!).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </SheetHeader>
              <div className="space-y-3">
                {selectedDraw.participants.map((giver) => {
                  const assignment = selectedDraw.assignments.find((a) => a.giverId === giver.id);
                  const receiver = selectedDraw.participants.find((p) => p.id === assignment?.receiverId);
                  return (
                    <div
                      key={giver.id}
                      data-testid={`history-result-${giver.id}`}
                      className="flex items-center gap-2 p-3 rounded-lg border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{giver.name}</p>
                      </div>
                      <Gift className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0 text-right">
                        <p className="font-semibold text-sm text-primary truncate">{receiver?.name ?? "—"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
