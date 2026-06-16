import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, Gift, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentDraw, type Draw } from "@/lib/db";

export default function Results() {
  const [, setLocation] = useLocation();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<string | null>(null);

  useEffect(() => {
    getCurrentDraw().then((d) => {
      setDraw(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!draw || !draw.drawnAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Gift className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium mb-2">Sorteio ainda não realizado</p>
          <Button onClick={() => setLocation("/draw")} data-testid="button-go-draw">
            Ir para o sorteio
          </Button>
        </div>
      </div>
    );
  }

  function getReceiver(giverId: string) {
    const assignment = draw!.assignments.find((a) => a.giverId === giverId);
    if (!assignment) return null;
    return draw!.participants.find((p) => p.id === assignment.receiverId) ?? null;
  }

  function toggleReveal(participantId: string) {
    setRevealed((prev) => (prev === participantId ? null : participantId));
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{draw.name}</h1>
            <p className="text-sm text-muted-foreground">Resultados</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted mb-5">
          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Toque no seu nome para revelar seu amigo secreto. Os outros resultados ficam ocultos.
          </p>
        </div>

        <div className="space-y-3">
          {draw.participants.map((participant) => {
            const isRevealed = revealed === participant.id;
            const receiver = isRevealed ? getReceiver(participant.id) : null;

            return (
              <Card
                key={participant.id}
                data-testid={`card-result-${participant.id}`}
                className={`border-card-border cursor-pointer transition-all duration-200 ${
                  isRevealed ? "border-primary shadow-md" : "hover:border-primary/40"
                }`}
                onClick={() => toggleReveal(participant.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isRevealed ? "bg-primary text-primary-foreground" : "bg-primary/10"
                      }`}
                    >
                      <span className={`text-sm font-bold ${isRevealed ? "text-primary-foreground" : "text-primary"}`}>
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{participant.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{participant.email}</p>
                    </div>
                    <div className="shrink-0 text-muted-foreground">
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </div>
                  </div>

                  {isRevealed && receiver && (
                    <div className="mt-4 pt-4 border-t border-border animate-reveal">
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                        Seu amigo secreto
                      </p>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Gift className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-primary text-lg leading-tight">{receiver.name}</p>
                          <p className="text-xs text-muted-foreground">{receiver.email}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Toque novamente para ocultar
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sorteio realizado em {new Date(draw.drawnAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
