# Filtro de Partículas Interativo Aprimorado

## Descrição
Este é um filtro de partículas aprimorado que permite ao usuário desenhar paredes interativamente na tela. As partículas e o objeto rastreado (blob) respeitam essas paredes, não as atravessando, criando um ambiente de simulação mais realista.

## Funcionalidades Implementadas

### 🎨 Desenho Interativo
- **Clique e arraste** com o botão esquerdo do mouse para desenhar paredes
- **Botão direito** do mouse para limpar todas as paredes
- Paredes são desenhadas em tempo real durante a simulação

### 🔄 Detecção de Colisão
- Partículas detectam e colidem com paredes desenhadas
- Blob principal também respeita as paredes
- Sistema de física com reflexão e amortecimento nas colisões

### 🎮 Controles
- **ESC**: Sair da aplicação
- **ESPAÇO**: Resetar posição do blob e partículas
- **Mouse**: Desenhar/limpar paredes

### 📊 Visualização Aprimorada
- **Amarelo**: Blob real sendo rastreado
- **Azul**: Partículas do filtro
- **Verde**: Estimativa média do filtro
- **Branco**: Paredes desenhadas pelo usuário
- Instruções na tela em tempo real

## Como Executar

### Pré-requisitos
```bash
pip install scipy scikit-image opencv-python numpy
```

### Execução
```bash
cd examples
python interactive_particle_filter.py
```

## Melhorias Implementadas

### 1. Sistema de Desenho Interativo
- Implementação de callbacks de mouse para desenho em tempo real
- Matriz de paredes para armazenar obstáculos desenhados
- Algoritmo de linha de Bresenham para desenho suave

### 2. Física de Colisão Avançada
- Detecção de colisão por área circular ao redor das partículas
- Sistema de reflexão com amortecimento para movimento realista
- Verificação de limites da tela integrada

### 3. Dinâmica Aprimorada das Partículas
- Função `velocity_with_collision()` que modifica o movimento das partículas
- Inversão e amortecimento de velocidade em colisões
- Prevenção de atravessamento de paredes

### 4. Interface de Usuário Melhorada
- Instruções claras na tela
- Contador de partículas
- Controles intuitivos
- Feedback visual imediato

## Arquitetura do Código

### Classe `InteractiveParticleFilter`
- **`mouse_callback()`**: Gerencia eventos do mouse para desenho
- **`check_wall_collision()`**: Detecta colisões com paredes
- **`velocity_with_collision()`**: Aplica física de colisão às partículas
- **`blob_with_walls()`**: Função de observação modificada
- **`update_blob_position()`**: Atualiza posição do blob com colisões

### Principais Melhorias Técnicas
1. **Detecção de Colisão Eficiente**: Verificação por área circular
2. **Física Realista**: Reflexão com amortecimento
3. **Desenho em Tempo Real**: Sistema de callbacks otimizado
4. **Integração Seamless**: Mantém compatibilidade com filtro original

## Parâmetros Configuráveis
- `img_size`: Tamanho da área de simulação (100x100)
- `scale_factor`: Fator de escala para visualização (8x)
- `wall_thickness`: Espessura das paredes desenhadas (2 pixels)
- `n_particles`: Número de partículas no filtro (150)

## Exemplo de Uso
1. Execute o programa
2. Desenhe algumas paredes clicando e arrastando
3. Observe como o blob amarelo e as partículas azuis colidem com as paredes
4. Use o botão direito para limpar e desenhar novos obstáculos
5. Pressione ESPAÇO para resetar a simulação

## Comparação com Versão Original
| Funcionalidade | Original | Aprimorado |
|---|---|---|
| Interatividade | ❌ | ✅ Desenho de paredes |
| Colisão | ❌ | ✅ Física realista |
| Controles | Básico | ✅ Mouse + teclado |
| Visualização | Simples | ✅ Múltiplas cores + instruções |
| Realismo | Baixo | ✅ Alto com obstáculos |

Este filtro de partículas aprimorado oferece uma experiência muito mais interativa e educativa, permitindo aos usuários experimentar com diferentes configurações de obstáculos e observar como o algoritmo de filtragem se adapta em tempo real.