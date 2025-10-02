import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Play, Pause, RotateCcw, Eraser, Download, Settings, Activity, Target, Sparkles, Video, Camera } from 'lucide-react'
import './App.css'
import ParticleFilterSimulation from './components/ParticleFilterSimulation'
import MetricsPanel from './components/MetricsPanel'
import AdvancedSettings from './components/AdvancedSettings'

function App() {
  const [isRunning, setIsRunning] = useState(true)
  const [numFilterParticles, setNumFilterParticles] = useState(300)
  const [numMicroParticles, setNumMicroParticles] = useState(800)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [showFilterParticles, setShowFilterParticles] = useState(true)
  const [showMicroParticles, setShowMicroParticles] = useState(true)
  const [showTarget, setShowTarget] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState('default')
  const [isRecording, setIsRecording] = useState(false)
  const [metrics, setMetrics] = useState({
    fps: 0,
    trackingError: 0,
    effectiveParticles: 0,
    convergenceRate: 0
  })
  const [advancedSettings, setAdvancedSettings] = useState({
    resampleThreshold: 0.5,
    processNoise: 0.1,
    observationNoise: 1.5,
    showTrajectory: false,
    showHeatmap: false,
    showParticleWeights: false,
    enableAdaptiveResampling: true
  })
  
  const simulationRef = useRef(null)

  const handleReset = () => {
    if (simulationRef.current) {
      simulationRef.current.reset()
    }
  }

  const handleClearWalls = () => {
    if (simulationRef.current) {
      simulationRef.current.clearWalls()
    }
  }

  const handleRegenerateParticles = () => {
    if (simulationRef.current) {
      simulationRef.current.regenerateParticles()
    }
  }

  const handleExportData = () => {
    if (simulationRef.current) {
      simulationRef.current.exportData()
    }
  }

  const handleTakeScreenshot = () => {
    if (simulationRef.current) {
      simulationRef.current.takeScreenshot()
    }
  }

  const handleToggleRecording = () => {
    if (simulationRef.current) {
      if (isRecording) {
        simulationRef.current.stopRecording()
      } else {
        simulationRef.current.startRecording()
      }
      setIsRecording(!isRecording)
    }
  }

  const scenarios = [
    { id: 'default', name: 'Rastreamento Livre', description: 'Rastreamento básico sem obstáculos' },
    { id: 'obstacles', name: 'Labirinto', description: 'Navegação com múltiplos obstáculos' },
    { id: 'dispersion', name: 'Dispersão de Poluentes', description: 'Simulação de dispersão ambiental' },
    { id: 'traffic', name: 'Fluxo de Tráfego', description: 'Análise de movimento veicular' },
  ]

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (simulationRef.current && isRunning) {
        const newMetrics = simulationRef.current.getMetrics()
        if (newMetrics) {
          setMetrics(newMetrics)
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isRunning])

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                Filtro de Partículas Profissional
              </h1>
              <p className="text-muted-foreground text-lg">
                Sistema avançado de rastreamento e simulação de partículas com aplicações práticas
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Activity className="w-4 h-4 mr-2" />
              {isRunning ? 'Em Execução' : 'Pausado'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Simulation Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Área de Simulação
                </CardTitle>
                <CardDescription>
                  Clique e arraste para desenhar paredes. Observe o rastreamento em tempo real.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-black rounded-lg overflow-hidden border-2 border-border">
                  <ParticleFilterSimulation
                    ref={simulationRef}
                    isRunning={isRunning}
                    numFilterParticles={numFilterParticles}
                    numMicroParticles={numMicroParticles}
                    simulationSpeed={simulationSpeed}
                    showFilterParticles={showFilterParticles}
                    showMicroParticles={showMicroParticles}
                    showTarget={showTarget}
                    scenario={selectedScenario}
                    advancedSettings={advancedSettings}
                  />
                </div>
                
                {/* Control Buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    onClick={() => setIsRunning(!isRunning)}
                    variant={isRunning ? "default" : "secondary"}
                    className="flex-1 min-w-[100px]"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar
                      </>
                    )}
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1 min-w-[100px]">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                  <Button onClick={handleClearWalls} variant="outline" className="flex-1 min-w-[100px]">
                    <Eraser className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                  <Button onClick={handleTakeScreenshot} variant="outline" className="flex-1 min-w-[100px]">
                    <Camera className="w-4 h-4 mr-2" />
                    Foto
                  </Button>
                  <Button 
                    onClick={handleToggleRecording} 
                    variant={isRecording ? "destructive" : "outline"} 
                    className="flex-1 min-w-[100px]"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {isRecording ? 'Parar' : 'Gravar'}
                  </Button>
                  <Button onClick={handleExportData} variant="outline" className="flex-1 min-w-[100px]">
                    <Download className="w-4 h-4 mr-2" />
                    Dados
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Panel */}
            <MetricsPanel metrics={metrics} />
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Cenários
                </CardTitle>
                <CardDescription>
                  Selecione um cenário de aplicação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedScenario} onValueChange={setSelectedScenario}>
                  <TabsList className="grid grid-cols-2 gap-2 h-auto">
                    {scenarios.map((scenario) => (
                      <TabsTrigger
                        key={scenario.id}
                        value={scenario.id}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        {scenario.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {scenarios.map((scenario) => (
                    <TabsContent key={scenario.id} value={scenario.id} className="mt-4">
                      <p className="text-sm text-muted-foreground">{scenario.description}</p>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>Parâmetros da Simulação</CardTitle>
                <CardDescription>
                  Ajuste os parâmetros em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Partículas do Filtro: {numFilterParticles}
                  </label>
                  <Slider
                    value={[numFilterParticles]}
                    onValueChange={(value) => setNumFilterParticles(value[0])}
                    min={50}
                    max={1000}
                    step={50}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Partículas Ambientais: {numMicroParticles}
                  </label>
                  <Slider
                    value={[numMicroParticles]}
                    onValueChange={(value) => setNumMicroParticles(value[0])}
                    min={100}
                    max={2000}
                    step={100}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Velocidade da Simulação: {simulationSpeed.toFixed(1)}x
                  </label>
                  <Slider
                    value={[simulationSpeed]}
                    onValueChange={(value) => setSimulationSpeed(value[0])}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  <label className="text-sm font-medium block">Visibilidade</label>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={showFilterParticles ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowFilterParticles(!showFilterParticles)}
                      className="w-full justify-start"
                    >
                      Partículas do Filtro
                    </Button>
                    <Button
                      variant={showMicroParticles ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowMicroParticles(!showMicroParticles)}
                      className="w-full justify-start"
                    >
                      Partículas Ambientais
                    </Button>
                    <Button
                      variant={showTarget ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowTarget(!showTarget)}
                      className="w-full justify-start"
                    >
                      Objeto Alvo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <AdvancedSettings 
              settings={advancedSettings}
              onSettingsChange={setAdvancedSettings}
            />

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Sobre o Filtro de Partículas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  O filtro de partículas é uma técnica de estimação Bayesiana não-paramétrica utilizada para rastreamento de objetos, localização robótica, e análise de sistemas dinâmicos. Esta implementação demonstra aplicações práticas em cenários reais.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
