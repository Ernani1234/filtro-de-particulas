# Filtro de Partículas Profissional

## Descrição
Este é um filtro de partículas profissional que simula múltiplas partículas pequenas que se movem aleatoriamente, criando uma experiência visual muito mais realista do que a implementação anterior.

## Características Implementadas

### 1. Sistema de Múltiplas Partículas
- **800 partículas microscópicas ambientais** que se movem com movimento Browniano
- **300 partículas do filtro** para rastreamento
- **12 partículas conectadas** formando o objeto alvo
- **4 tipos diferentes** de partículas com comportamentos distintos

### 2. Movimento Browniano Realista
- Movimento aleatório baseado em distribuição normal
- Velocidades limitadas para comportamento realista
- Amortecimento e ruído aplicados continuamente
- Regeneração ocasional de partículas para manter dinamismo

### 3. Visualização Avançada
- Partículas microscópicas com diferentes cores e intensidades
- Efeitos de transparência e pulsação
- Partículas do filtro em azul
- Objeto alvo em amarelo-verde
- Estimativa do filtro destacada em verde

### 4. Física Avançada
- Detecção de colisão sofisticada
- Reflexão com amortecimento
- Forças de coesão para manter partículas do alvo juntas
- Movimento orbital das partículas do alvo

### 5. Controles Interativos
- **Clique e arraste**: Desenhar paredes
- **Botão direito**: Limpar todas as paredes
- **ESC**: Sair da aplicação
- **ESPAÇO**: Resetar simulação
- **R**: Regenerar partículas ambientais

## Como Executar

```bash
cd examples
python professional_particle_filter.py
```

## Melhorias Técnicas

### Algoritmo de Filtro
- Função de observação baseada no objeto alvo multi-partícula
- Dinâmica avançada com múltiplos comportamentos
- Ruído t-Student para maior robustez
- Reamostragem adaptativa

### Renderização
- Sistema de renderização em camadas
- Efeitos visuais com transparência
- Informações em tempo real na tela
- Escalonamento suave da imagem

### Performance
- Otimizações para lidar com 800+ partículas
- Clipping eficiente de coordenadas
- Atualização seletiva de propriedades

## Parâmetros Configuráveis

```python
IMG_SIZE = 120              # Tamanho da simulação
SCALE_FACTOR = 6           # Fator de escala para visualização
NUM_PARTICLES = 300        # Partículas do filtro
NUM_MICRO_PARTICLES = 800  # Partículas ambientais
PARTICLE_TYPES = 4         # Tipos de partículas
```

## Arquitetura do Código

### Classes Principais
- `ProfessionalParticleFilter`: Classe principal que gerencia toda a simulação
- `ParticleFilter`: Filtro de partículas do pfilter (integrado)

### Métodos Importantes
- `initialize_micro_particles()`: Cria partículas ambientais
- `initialize_target_particles()`: Cria objeto alvo multi-partícula
- `update_micro_particles()`: Atualiza movimento Browniano
- `update_target_particles()`: Mantém coesão do objeto alvo
- `advanced_dynamics()`: Dinâmica sofisticada do filtro
- `render_particles()`: Sistema de renderização em camadas

## Comparação com Versão Anterior

| Aspecto | Versão Anterior | Versão Profissional |
|---------|----------------|---------------------|
| Partículas | 1 blob grande | 800+ partículas pequenas |
| Movimento | Linear simples | Browniano realista |
| Visualização | Círculos grandes | Pontos pequenos coloridos |
| Física | Básica | Avançada com múltiplas forças |
| Realismo | Baixo | Alto |
| Performance | Simples | Otimizada para muitas partículas |

## Exemplo de Uso

1. Execute o script
2. Observe as partículas microscópicas se movendo aleatoriamente
3. Veja o objeto alvo (amarelo-verde) se movendo
4. Observe as partículas do filtro (azuis) rastreando o alvo
5. Desenhe paredes para ver as colisões
6. Use 'R' para regenerar partículas ambientais
7. Use 'ESPAÇO' para resetar a simulação

## Características Técnicas Avançadas

### Movimento Browniano
- Implementação baseada em distribuição normal
- Velocidades limitadas para realismo
- Amortecimento gradual
- Ruído contínuo

### Sistema de Colisões
- Detecção pixel-perfect
- Reflexão com coeficiente de restituição
- Tratamento especial para diferentes tipos de partículas

### Renderização Multi-Camada
1. Paredes (cinza)
2. Partículas ambientais (coloridas)
3. Partículas do filtro (azul)
4. Objeto alvo (amarelo-verde)
5. Estimativa (verde destacado)

Este filtro representa uma implementação profissional e realista de um sistema de partículas com rastreamento avançado.