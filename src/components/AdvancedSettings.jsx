import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Settings2, Sparkles } from 'lucide-react'

const AdvancedSettings = ({ settings, onSettingsChange }) => {
  const {
    resampleThreshold = 0.5,
    processNoise = 0.1,
    observationNoise = 1.5,
    showTrajectory = false,
    showHeatmap = false,
    showParticleWeights = false,
    enableAdaptiveResampling = true
  } = settings

  const handleSliderChange = (key, value) => {
    onSettingsChange({ ...settings, [key]: value[0] })
  }

  const handleSwitchChange = (key, value) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          Configurações Avançadas
        </CardTitle>
        <CardDescription>
          Ajuste fino dos parâmetros do algoritmo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Limiar de Reamostragem: {resampleThreshold.toFixed(2)}
          </label>
          <Slider
            value={[resampleThreshold]}
            onValueChange={(value) => handleSliderChange('resampleThreshold', value)}
            min={0.1}
            max={1.0}
            step={0.05}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Controla quando as partículas são reamostradas
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Ruído de Processo: {processNoise.toFixed(2)}
          </label>
          <Slider
            value={[processNoise]}
            onValueChange={(value) => handleSliderChange('processNoise', value)}
            min={0.01}
            max={0.5}
            step={0.01}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Incerteza no modelo de movimento
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Ruído de Observação: {observationNoise.toFixed(2)}
          </label>
          <Slider
            value={[observationNoise]}
            onValueChange={(value) => handleSliderChange('observationNoise', value)}
            min={0.5}
            max={5.0}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Incerteza nas medições do sensor
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="trajectory">Mostrar Trajetória</Label>
              <p className="text-xs text-muted-foreground">
                Exibe o caminho percorrido pelo alvo
              </p>
            </div>
            <Switch
              id="trajectory"
              checked={showTrajectory}
              onCheckedChange={(value) => handleSwitchChange('showTrajectory', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="heatmap">Mapa de Calor</Label>
              <p className="text-xs text-muted-foreground">
                Visualiza densidade de probabilidade
              </p>
            </div>
            <Switch
              id="heatmap"
              checked={showHeatmap}
              onCheckedChange={(value) => handleSwitchChange('showHeatmap', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weights">Pesos das Partículas</Label>
              <p className="text-xs text-muted-foreground">
                Mostra importância de cada partícula
              </p>
            </div>
            <Switch
              id="weights"
              checked={showParticleWeights}
              onCheckedChange={(value) => handleSwitchChange('showParticleWeights', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="adaptive">
                <span className="flex items-center gap-1">
                  Reamostragem Adaptativa
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                </span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Otimiza automaticamente a reamostragem
              </p>
            </div>
            <Switch
              id="adaptive"
              checked={enableAdaptiveResampling}
              onCheckedChange={(value) => handleSwitchChange('enableAdaptiveResampling', value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdvancedSettings
