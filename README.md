# Filtro de Partículas Profissional

## 1. Introdução
Este projeto transforma um filtro de partículas básico em uma aplicação web profissional e interativa, demonstrando as capacidades avançadas da tecnologia de filtro de partículas em diversos cenários. A aplicação oferece uma interface de usuário moderna, visualizações em tempo real e controles para ajustar a simulação, tornando-a uma ferramenta poderosa para demonstração e análise.

## 2. Funcionalidades

### 2.1. Simulação Avançada de Partículas
*   **Múltiplos Tipos de Partículas:** Simulação de partículas microscópicas ambientais, partículas de filtro para rastreamento e um objeto alvo composto por partículas conectadas.
*   **Movimento Realista:** Implementação de movimento Browniano, detecção de colisão, reflexão com amortecimento, forças de coesão e movimento orbital para o objeto alvo.
*   **Filtro de Partículas Robusto:** Algoritmo de filtro com função de observação multi-partícula, dinâmica avançada, ruído t-Student e reamostragem adaptativa.

### 2.2. Interface de Usuário Moderna
*   **Dashboard Interativo:** Painel de controle intuitivo para ajustar parâmetros da simulação (número de partículas, tipos, velocidades, etc.) em tempo real.
*   **Tema Escuro:** Interface projetada com um tema escuro para melhor estética e usabilidade.
*   **Visualização em Tempo Real:** Renderização da simulação em um canvas HTML5, substituindo a visualização baseada em OpenCV.

### 2.3. Cenários de Aplicação
*   **Rastreamento Livre:** Demonstração do filtro de partículas para rastrear objetos em um ambiente aberto.
*   **Labirinto:** Simulação de navegação e rastreamento em um ambiente com múltiplos obstáculos.
*   **Dispersão de Poluentes:** Modelagem da dispersão de substâncias no ar ou água, com barreiras configuráveis.
*   **Fluxo de Tráfego:** Análise do movimento de veículos em uma área, com partículas representando carros.

### 2.4. Ferramentas de Análise e Controle
*   **Métricas em Tempo Real:** Exibição de FPS, erro de rastreamento, número efetivo de partículas e taxa de convergência.
*   **Controles de Simulação:** Botões para iniciar/pausar, resetar, limpar paredes, tirar screenshots e gravar a simulação.
*   **Configurações Avançadas:** Ajuste fino de parâmetros do algoritmo como limiar de reamostragem, ruído de processo e ruído de observação.
*   **Visualizações Adicionais:** Opções para mostrar a trajetória do alvo, mapa de calor de probabilidade e pesos das partículas.
*   **Exportação de Dados:** Capacidade de exportar dados da simulação em formato JSON para análise externa.

## 3. Arquitetura do Projeto
O projeto segue uma arquitetura de aplicação web moderna, dividida em frontend e backend (com a lógica principal migrada para o frontend para esta versão interativa).

### 3.1. Frontend
*   **Tecnologia:** React.js para uma interface de usuário reativa e interativa.
*   **Estilização:** Tailwind CSS e Shadcn/UI para componentes de interface e tema escuro.
*   **Visualização:** Canvas HTML5 para renderização de partículas e simulação em tempo real.

### 3.2. Lógica de Simulação
*   A lógica do filtro de partículas, originalmente em Python, foi reescrita em JavaScript para execução direta no navegador, permitindo uma experiência totalmente interativa e responsiva sem a necessidade de um backend dedicado para a simulação em si.

## 4. Como Executar

Para executar o projeto localmente, siga os passos abaixo:

1.  **Navegue até o diretório do projeto:**
    ```bash
    cd /home/ubuntu/particle-filter-pro
    ```

2.  **Instale as dependências:**
    ```bash
    pnpm install
    ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    pnpm run dev --host
    ```

4.  **Acesse a aplicação:**
    Abra seu navegador e navegue para `http://localhost:5173/`.

## 5. Melhorias Futuras
*   **Backend Dedicado:** Implementar um backend em Flask/FastAPI para a lógica de simulação, permitindo simulações mais complexas e uso de WebSockets para comunicação em tempo real.
*   **Visualização 3D:** Explorar bibliotecas como Three.js para uma visualização 3D das partículas.
*   **Exportação de Vídeo:** Integrar bibliotecas para exportar gravações da simulação diretamente para formatos de vídeo (GIF/MP4).
*   **Persistência de Cenários:** Adicionar funcionalidade para salvar e carregar cenários de simulação personalizados (paredes, configurações de partículas).
*   **Integração com Dados Reais:** Conectar o filtro de partículas a fontes de dados reais (e.g., sensores, câmeras) para aplicações de rastreamento em tempo real.

## 6. Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests para melhorias e novas funcionalidades.

## 7. Licença
Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
