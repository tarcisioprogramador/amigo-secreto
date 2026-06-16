import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Shuffle, CheckCircle, RefreshCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentDraw, saveDraw, shuffleAssignments, type Draw } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function Draw() {
  const [, setLocation] = useLocation();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentDraw().then((d) => {
      setDraw(d);
      if (d?.drawnAt) setDone(true);
      setLoading(false);
    });
  }, []);

  async function handleDraw() {
    if (!draw || draw.participants.length < 3) return;
    setDrawing(true);

    await new Promise((r) => setTimeout(r, 1200));

    try {
      const assignments = shuffleAssignments(draw.participants);
      const updated: Draw = { ...draw, drawnAt: Date.now(), assignments };
      await saveDraw(updated);
      setDraw(updated);
      setDone(true);
      toast({ title: "Sorteio realizado com sucesso!" });
    } catch {
      toast({ title: "Erro no sorteio", variant: "destructive" });
    } finally {
      setDrawing(false);
    }
  }

  async function handleReset() {
    if (!draw) return;
    const updated = { ...draw, drawnAt: null, assignments: [] };
    await saveDraw(updated);
    setDraw(updated);
    setDone(false);
    toast({ title: "Sorteio resetado" });
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
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{draw.name}</h1>
            <p className="text-sm text-muted-foreground">Sorteio</p>
          </div>
        </div>

        <div className="flex flex-col items-center text-center py-8">
          {drawing ? (
            <div className="space-y-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <Shuffle className="w-10 h-10 text-primary" />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">Embaralhando...</p>
                <p className="text-muted-foreground mt-1 text-sm">Garantindo que ninguém tire a si mesmo</p>
              </div>
            </div>
          ) : done ? (
            <div className="space-y-6 animate-reveal">
              <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Sorteio realizado!</p>
                <p className="text-muted-foreground mt-2 text-sm">
                  {draw.participants.length} duplas foram formadas em{" "}
                  {new Date(draw.drawnAt!).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div className="w-full space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setLocation("/results")}
                  data-testid="button-go-results"
                >
                  Ver resultados
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleReset}
                  data-testid="button-reset-draw"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Novo sorteio
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 w-full">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Shuffle className="w-12 h-12 text-primary animate-float" />
              </div>

              <div>
                <p className="text-2xl font-bold text-foreground mb-2">Pronto para sortear?</p>
                <p className="text-muted-foreground text-sm">
                  {draw.participants.length} participantes aguardam o resultado
                </p>
              </div>

              <Card className="border-card-border w-full text-left">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">Regras do sorteio:</p>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      Ninguém tira a si mesmo
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      Resultados ficam ocultos até cada participante revelar
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      Dados salvos somente neste navegador
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {!canDraw && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground text-sm">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    Você precisa de pelo menos 3 participantes.{" "}
                    <button
                      className="underline text-primary"
                      onClick={() => setLocation("/participants")}
                    >
                      Adicionar agora
                    </button>
                  </span>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleDraw}
                disabled={!canDraw || drawing}
                data-testid="button-do-draw"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Sortear agora!
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
