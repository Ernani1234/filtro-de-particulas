import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Activity, Target, Zap, TrendingUp } from 'lucide-react'

const MetricsPanel = ({ metrics }) => {
  const {
    fps = 0,
    trackingError = 0,
    effectiveParticles = 0,
    convergenceRate = 0
  } = metrics

  const getErrorColor = (error) => {
    if (error < 10) return 'text-green-500'
    if (error < 30) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getConvergenceColor = (rate) => {
    if (rate > 0.8) return 'text-green-500'
    if (rate > 0.5) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Métricas em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">FPS</span>
            </div>
            <div className="text-2xl font-bold">{fps.toFixed(1)}</div>
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min((fps / 60) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Erro (px)</span>
            </div>
            <div className={`text-2xl font-bold ${getErrorColor(trackingError)}`}>
              {trackingError.toFixed(1)}
            </div>
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  trackingError < 10 ? 'bg-green-500' : 
                  trackingError < 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((trackingError / 50) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Part. Efetivas</span>
            </div>
            <div className="text-2xl font-bold">{effectiveParticles.toFixed(0)}</div>
            <Badge variant="outline" className="text-xs">
              {((effectiveParticles / 300) * 100).toFixed(0)}% do total
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Convergência</span>
            </div>
            <div className={`text-2xl font-bold ${getConvergenceColor(convergenceRate)}`}>
              {(convergenceRate * 100).toFixed(0)}%
            </div>
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${convergenceRate * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Status do Filtro:</span>
              <Badge variant={convergenceRate > 0.7 ? "default" : "secondary"}>
                {convergenceRate > 0.7 ? "Convergido" : "Convergindo"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Qualidade do Rastreamento:</span>
              <Badge variant={trackingError < 15 ? "default" : "secondary"}>
                {trackingError < 15 ? "Excelente" : trackingError < 30 ? "Bom" : "Regular"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MetricsPanel
