import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Gift, Users, Shuffle, History, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentDraw, createDraw, type Draw } from "@/lib/db";

export default function Home() {
  const [, setLocation] = useLocation();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getCurrentDraw().then((d) => {
      setDraw(d);
      setLoading(false);
    });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) return;
    setCreating(true);
    const d = await createDraw(groupName.trim());
    setDraw(d);
    setCreating(false);
    setLocation("/participants");
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <Gift className="w-16 h-16 text-primary animate-gift" strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Amigo Secreto</h1>
            <p className="text-muted-foreground text-base">
              Organize seu sorteio de forma simples e segura, tudo no seu navegador.
            </p>
          </div>

          <Card className="border-card-border shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="group-name">Nome do grupo</Label>
                  <Input
                    id="group-name"
                    data-testid="input-group-name"
                    placeholder="Ex: Família 2024, Amigos do trabalho..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="text-base"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!groupName.trim() || creating}
                  data-testid="button-create-group"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar novo grupo
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setLocation("/history")}
                  data-testid="button-view-history"
                >
                  <History className="w-4 h-4 mr-2" />
                  Ver sorteios anteriores
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3 mt-8 text-center">
            {[
              { icon: Users, label: "Adicione participantes" },
              { icon: Shuffle, label: "Realize o sorteio" },
              { icon: Star, label: "Descubra seu amigo" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isDrawn = draw.drawnAt !== null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Gift className="w-12 h-12 text-primary animate-float" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">{draw.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isDrawn
              ? `Sorteio realizado em ${new Date(draw.drawnAt!).toLocaleDateString("pt-BR")}`
              : "Pronto para o sorteio"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{draw.participants.length}</p>
              <p className="text-sm text-muted-foreground mt-0.5">participantes</p>
            </CardContent>
          </Card>
          <Card className="border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">{isDrawn ? "Feito" : "Pendente"}</p>
              <p className="text-sm text-muted-foreground mt-0.5">status do sorteio</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => setLocation("/participants")}
            data-testid="button-go-participants"
          >
            <Users className="w-4 h-4 mr-2" />
            {isDrawn ? "Ver participantes" : "Gerenciar participantes"}
          </Button>

          {!isDrawn && (
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={() => setLocation("/draw")}
              disabled={draw.participants.length < 3}
              data-testid="button-go-draw"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Realizar sorteio
              {draw.participants.length < 3 && (
                <span className="ml-2 text-xs opacity-70">
                  (mín. 3 participantes)
                </span>
              )}
            </Button>
          )}

          {isDrawn && (
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={() => setLocation("/results")}
              data-testid="button-go-results"
            >
              <Star className="w-4 h-4 mr-2" />
              Ver resultados
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation("/history")}
            data-testid="button-go-history"
          >
            <History className="w-4 h-4 mr-2" />
            Histórico de sorteios
          </Button>
        </div>
      </div>
    </div>
  );
}
