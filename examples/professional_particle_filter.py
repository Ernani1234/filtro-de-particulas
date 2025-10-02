#Alunos: Bruno Machado Ferreira(181276), Ernani Neto(180914), Fábio Gomes(181274) e Ryan Nantes(180901)
#Filtro de partículas profissional com simulação realista de múltiplas partículas
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from pfilter import (
    ParticleFilter,
    gaussian_noise,
    cauchy_noise,
    t_noise,
    squared_error,
    independent_sample,
)
import numpy as np
from scipy.stats import norm, gamma, uniform
import skimage.draw
from skimage.draw import line, circle_perimeter, disk
import cv2
import math
import random

# Configurações da simulação
IMG_SIZE = 120
SCALE_FACTOR = 6
NUM_PARTICLES = 300  # Mais partículas para efeito mais realista
NUM_MICRO_PARTICLES = 800  # Partículas microscópicas para ambiente
PARTICLE_TYPES = 4  # Diferentes tipos de partículas

class ProfessionalParticleFilter:
    def __init__(self):
        self.img_size = IMG_SIZE
        self.scale_factor = SCALE_FACTOR
        self.walls = []
        self.drawing = False
        self.last_point = None
        self.wall_thickness = 3
        
        # Matriz para paredes
        self.wall_map = np.zeros((self.img_size, self.img_size), dtype=np.uint8)
        
        # Sistema de múltiplas partículas ambientais
        self.micro_particles = self.initialize_micro_particles()
        
        # Estado do objeto rastreado (múltiplas partículas conectadas)
        self.target_particles = self.initialize_target_particles()
        
        # Configurações visuais
        self.particle_colors = [
            [0.2, 0.4, 1.0],  # Azul claro
            [0.0, 0.8, 1.0],  # Ciano
            [0.4, 0.2, 1.0],  # Roxo
            [0.6, 0.0, 1.0],  # Magenta
        ]
        
        # Configurar janela
        cv2.namedWindow("Filtro de Partículas Profissional", cv2.WINDOW_NORMAL)
        cv2.resizeWindow("Filtro de Partículas Profissional", 
                        self.scale_factor * self.img_size, self.scale_factor * self.img_size)
        cv2.setMouseCallback("Filtro de Partículas Profissional", self.mouse_callback)
        
        # Inicializar filtro
        self.setup_particle_filter()
        
    def initialize_micro_particles(self):
        """Inicializa partículas microscópicas que se movem aleatoriamente no ambiente"""
        particles = []
        for i in range(NUM_MICRO_PARTICLES):
            particle = {
                'x': np.random.uniform(5, self.img_size - 5),
                'y': np.random.uniform(5, self.img_size - 5),
                'vx': np.random.uniform(-0.3, 0.3),
                'vy': np.random.uniform(-0.3, 0.3),
                'size': np.random.uniform(0.5, 2.0),
                'type': np.random.randint(0, PARTICLE_TYPES),
                'life': np.random.uniform(0.3, 1.0),
                'phase': np.random.uniform(0, 2 * np.pi)
            }
            particles.append(particle)
        return particles
    
    def initialize_target_particles(self):
        """Inicializa o objeto alvo como um conjunto de partículas conectadas"""
        center_x = self.img_size // 2
        center_y = self.img_size // 2
        particles = []
        
        # Criar um cluster de partículas para formar o objeto alvo
        for i in range(12):
            angle = (i / 12) * 2 * np.pi
            radius = np.random.uniform(3, 8)
            particle = {
                'x': center_x + radius * np.cos(angle),
                'y': center_y + radius * np.sin(angle),
                'vx': np.random.uniform(-0.4, 0.4),
                'vy': np.random.uniform(-0.4, 0.4),
                'size': np.random.uniform(2, 4),
                'angle': angle,
                'base_radius': radius
            }
            particles.append(particle)
        
        return particles
    
    def update_micro_particles(self):
        """Atualiza as partículas microscópicas com movimento Browniano"""
        for particle in self.micro_particles:
            # Movimento Browniano
            particle['vx'] += np.random.normal(0, 0.05)
            particle['vy'] += np.random.normal(0, 0.05)
            
            # Limitar velocidade
            max_speed = 0.5
            speed = np.sqrt(particle['vx']**2 + particle['vy']**2)
            if speed > max_speed:
                particle['vx'] = (particle['vx'] / speed) * max_speed
                particle['vy'] = (particle['vy'] / speed) * max_speed
            
            # Atualizar posição
            new_x = particle['x'] + particle['vx']
            new_y = particle['y'] + particle['vy']
            
            # Verificar colisão com paredes
            if self.check_wall_collision(new_x, new_y, particle['size']):
                # Reflexão com ruído
                if self.check_wall_collision(new_x, particle['y'], particle['size']):
                    particle['vx'] = -particle['vx'] * 0.7 + np.random.normal(0, 0.1)
                if self.check_wall_collision(particle['x'], new_y, particle['size']):
                    particle['vy'] = -particle['vy'] * 0.7 + np.random.normal(0, 0.1)
            else:
                particle['x'] = new_x
                particle['y'] = new_y
            
            # Verificar limites da tela
            if particle['x'] < 2 or particle['x'] > self.img_size - 2:
                particle['vx'] = -particle['vx'] * 0.8
                particle['x'] = np.clip(particle['x'], 2, self.img_size - 2)
            if particle['y'] < 2 or particle['y'] > self.img_size - 2:
                particle['vy'] = -particle['vy'] * 0.8
                particle['y'] = np.clip(particle['y'], 2, self.img_size - 2)
            
            # Atualizar propriedades visuais
            particle['phase'] += 0.1
            particle['life'] = max(0.1, particle['life'] + np.random.uniform(-0.01, 0.01))
            
            # Regenerar partículas ocasionalmente
            if np.random.random() < 0.001:
                particle['x'] = np.random.uniform(5, self.img_size - 5)
                particle['y'] = np.random.uniform(5, self.img_size - 5)
                particle['vx'] = np.random.uniform(-0.3, 0.3)
                particle['vy'] = np.random.uniform(-0.3, 0.3)
                particle['life'] = np.random.uniform(0.5, 1.0)
    
    def update_target_particles(self):
        """Atualiza o objeto alvo mantendo coesão entre partículas"""
        # Calcular centro de massa
        center_x = np.mean([p['x'] for p in self.target_particles])
        center_y = np.mean([p['y'] for p in self.target_particles])
        
        # Movimento global do objeto
        global_vx = np.random.uniform(-0.3, 0.3)
        global_vy = np.random.uniform(-0.3, 0.3)
        
        for i, particle in enumerate(self.target_particles):
            # Força de coesão (manter partículas juntas)
            cohesion_x = (center_x - particle['x']) * 0.02
            cohesion_y = (center_y - particle['y']) * 0.02
            
            # Movimento orbital
            particle['angle'] += 0.02
            orbital_x = particle['base_radius'] * np.cos(particle['angle']) * 0.01
            orbital_y = particle['base_radius'] * np.sin(particle['angle']) * 0.01
            
            # Ruído individual
            noise_x = np.random.normal(0, 0.05)
            noise_y = np.random.normal(0, 0.05)
            
            # Combinar forças
            particle['vx'] = global_vx + cohesion_x + orbital_x + noise_x
            particle['vy'] = global_vy + cohesion_y + orbital_y + noise_y
            
            # Atualizar posição
            new_x = particle['x'] + particle['vx']
            new_y = particle['y'] + particle['vy']
            
            # Verificar colisões
            if self.check_wall_collision(new_x, new_y, particle['size']):
                if self.check_wall_collision(new_x, particle['y'], particle['size']):
                    particle['vx'] = -particle['vx'] * 0.8
                if self.check_wall_collision(particle['x'], new_y, particle['size']):
                    particle['vy'] = -particle['vy'] * 0.8
            else:
                particle['x'] = new_x
                particle['y'] = new_y
            
            # Limites da tela
            particle['x'] = np.clip(particle['x'], 3, self.img_size - 3)
            particle['y'] = np.clip(particle['y'], 3, self.img_size - 3)
    
    def mouse_callback(self, event, x, y, flags, param):
        """Callback para desenho de paredes"""
        img_x = int(x / self.scale_factor)
        img_y = int(y / self.scale_factor)
        img_x = np.clip(img_x, 0, self.img_size - 1)
        img_y = np.clip(img_y, 0, self.img_size - 1)
        
        if event == cv2.EVENT_LBUTTONDOWN:
            self.drawing = True
            self.last_point = (img_x, img_y)
            self.add_wall_point(img_x, img_y)
        elif event == cv2.EVENT_MOUSEMOVE and self.drawing:
            if self.last_point is not None:
                self.draw_wall_line(self.last_point[0], self.last_point[1], img_x, img_y)
                self.last_point = (img_x, img_y)
        elif event == cv2.EVENT_LBUTTONUP:
            self.drawing = False
            self.last_point = None
        elif event == cv2.EVENT_RBUTTONDOWN:
            self.clear_walls()
    
    def add_wall_point(self, x, y):
        """Adiciona ponto de parede"""
        for i in range(-self.wall_thickness//2, self.wall_thickness//2 + 1):
            for j in range(-self.wall_thickness//2, self.wall_thickness//2 + 1):
                wall_x = np.clip(x + i, 0, self.img_size - 1)
                wall_y = np.clip(y + j, 0, self.img_size - 1)
                self.wall_map[wall_y, wall_x] = 1
    
    def draw_wall_line(self, x1, y1, x2, y2):
        """Desenha linha de parede"""
        rr, cc = line(y1, x1, y2, x2)
        for r, c in zip(rr, cc):
            for i in range(-self.wall_thickness//2, self.wall_thickness//2 + 1):
                for j in range(-self.wall_thickness//2, self.wall_thickness//2 + 1):
                    wall_r = np.clip(r + i, 0, self.img_size - 1)
                    wall_c = np.clip(c + j, 0, self.img_size - 1)
                    self.wall_map[wall_r, wall_c] = 1
    
    def clear_walls(self):
        """Limpa paredes"""
        self.wall_map = np.zeros((self.img_size, self.img_size), dtype=np.uint8)
    
    def check_wall_collision(self, x, y, radius=1):
        """Verifica colisão com paredes"""
        x_int, y_int = int(round(x)), int(round(y))
        radius_int = int(round(radius))
        
        if x_int < radius_int or x_int >= self.img_size - radius_int or \
           y_int < radius_int or y_int >= self.img_size - radius_int:
            return True
            
        for i in range(-radius_int, radius_int + 1):
            for j in range(-radius_int, radius_int + 1):
                check_x = np.clip(x_int + i, 0, self.img_size - 1)
                check_y = np.clip(y_int + j, 0, self.img_size - 1)
                if self.wall_map[check_y, check_x] == 1:
                    return True
        return False
    
    def target_observation_function(self, x):
        """Função de observação baseada no objeto alvo"""
        y = np.zeros((x.shape[0], self.img_size, self.img_size))
        
        # Criar observação baseada nas partículas do alvo
        target_obs = np.zeros((self.img_size, self.img_size))
        for particle in self.target_particles:
            px, py = int(particle['x']), int(particle['y'])
            if 0 <= px < self.img_size and 0 <= py < self.img_size:
                size = int(particle['size'])
                for i in range(-size, size + 1):
                    for j in range(-size, size + 1):
                        obs_x = np.clip(px + i, 0, self.img_size - 1)
                        obs_y = np.clip(py + j, 0, self.img_size - 1)
                        distance = np.sqrt(i*i + j*j)
                        if distance <= size:
                            target_obs[obs_y, obs_x] = max(target_obs[obs_y, obs_x], 
                                                         1.0 - distance/size)
        
        # Aplicar observação para cada partícula do filtro
        for i in range(x.shape[0]):
            y[i] = target_obs
            
        return y
    
    def advanced_dynamics(self, x):
        """Dinâmica avançada com múltiplos comportamentos"""
        dt = 1.0
        new_x = np.copy(x)
        
        for i in range(x.shape[0]):
            # Movimento base
            new_pos_x = x[i, 0] + x[i, 3] * dt
            new_pos_y = x[i, 1] + x[i, 4] * dt
            
            # Adicionar ruído Browniano
            brownian_x = np.random.normal(0, 0.2)
            brownian_y = np.random.normal(0, 0.2)
            
            new_pos_x += brownian_x
            new_pos_y += brownian_y
            
            # Verificar colisões
            if self.check_wall_collision(new_pos_x, new_pos_y, max(x[i, 2], 1)):
                if self.check_wall_collision(x[i, 0] + x[i, 3] * dt, x[i, 1], max(x[i, 2], 1)):
                    new_x[i, 3] = -x[i, 3] * 0.7 + np.random.normal(0, 0.1)
                if self.check_wall_collision(x[i, 0], x[i, 1] + x[i, 4] * dt, max(x[i, 2], 1)):
                    new_x[i, 4] = -x[i, 4] * 0.7 + np.random.normal(0, 0.1)
                new_x[i, 0] = x[i, 0]
                new_x[i, 1] = x[i, 1]
            else:
                new_x[i, 0] = new_pos_x
                new_x[i, 1] = new_pos_y
            
            # Atualizar velocidades com amortecimento
            new_x[i, 3] = x[i, 3] * 0.98 + np.random.normal(0, 0.05)
            new_x[i, 4] = x[i, 4] * 0.98 + np.random.normal(0, 0.05)
            
            # Limitar velocidade
            max_speed = 1.5
            speed = np.sqrt(new_x[i, 3]**2 + new_x[i, 4]**2)
            if speed > max_speed:
                new_x[i, 3] = (new_x[i, 3] / speed) * max_speed
                new_x[i, 4] = (new_x[i, 4] / speed) * max_speed
            
            # Manter tamanho com pequena variação
            new_x[i, 2] = x[i, 2] + np.random.normal(0, 0.02)
            new_x[i, 2] = np.clip(new_x[i, 2], 0.5, 5.0)
            
        return new_x
    
    def setup_particle_filter(self):
        """Configura o filtro de partículas profissional"""
        columns = ["x", "y", "radius", "dx", "dy"]
        
        prior_fn = independent_sample([
            norm(loc=self.img_size / 2, scale=self.img_size / 3).rvs,
            norm(loc=self.img_size / 2, scale=self.img_size / 3).rvs,
            gamma(a=2, loc=0.5, scale=2).rvs,
            norm(loc=0, scale=0.3).rvs,
            norm(loc=0, scale=0.3).rvs,
        ])
        
        self.pf = ParticleFilter(
            prior_fn=prior_fn,
            observe_fn=self.target_observation_function,
            n_particles=NUM_PARTICLES,
            dynamics_fn=self.advanced_dynamics,
            noise_fn=lambda x: t_noise(x, sigmas=[0.3, 0.3, 0.1, 0.15, 0.15], df=80.0),
            weight_fn=lambda x, y: squared_error(x, y, sigma=1.5),
            resample_proportion=0.05,
            column_names=columns,
        )
    
    def render_particles(self, display_img):
        """Renderiza partículas com diferentes estilos"""
        # Desenhar partículas microscópicas
        for particle in self.micro_particles:
            px, py = int(particle['x']), int(particle['y'])
            if 0 <= px < self.img_size and 0 <= py < self.img_size:
                color = self.particle_colors[particle['type']]
                intensity = particle['life'] * (0.5 + 0.5 * np.sin(particle['phase']))
                
                # Desenhar partícula como ponto pequeno
                size = max(1, int(particle['size']))
                for i in range(-size//2, size//2 + 1):
                    for j in range(-size//2, size//2 + 1):
                        draw_x = np.clip(px + i, 0, self.img_size - 1)
                        draw_y = np.clip(py + j, 0, self.img_size - 1)
                        distance = np.sqrt(i*i + j*j)
                        if distance <= size/2:
                            alpha = intensity * (1.0 - distance/(size/2))
                            for c in range(3):
                                display_img[draw_y, draw_x, c] = min(1.0, 
                                    display_img[draw_y, draw_x, c] + color[c] * alpha * 0.6)
        
        # Desenhar partículas do filtro
        for particle in self.pf.original_particles:
            px, py, pr, _, _ = particle
            if 0 <= px < self.img_size and 0 <= py < self.img_size:
                # Desenhar como pequenos círculos azuis
                size = max(1, int(pr * 0.5))
                for i in range(-size, size + 1):
                    for j in range(-size, size + 1):
                        draw_x = np.clip(int(px) + i, 0, self.img_size - 1)
                        draw_y = np.clip(int(py) + j, 0, self.img_size - 1)
                        distance = np.sqrt(i*i + j*j)
                        if distance <= size:
                            alpha = 0.4 * (1.0 - distance/size)
                            display_img[draw_y, draw_x, 0] = min(1.0, 
                                display_img[draw_y, draw_x, 0] + alpha)  # Azul
        
        # Desenhar objeto alvo
        for particle in self.target_particles:
            px, py = int(particle['x']), int(particle['y'])
            if 0 <= px < self.img_size and 0 <= py < self.img_size:
                size = max(1, int(particle['size']))
                for i in range(-size, size + 1):
                    for j in range(-size, size + 1):
                        draw_x = np.clip(px + i, 0, self.img_size - 1)
                        draw_y = np.clip(py + j, 0, self.img_size - 1)
                        distance = np.sqrt(i*i + j*j)
                        if distance <= size:
                            alpha = 0.8 * (1.0 - distance/size)
                            display_img[draw_y, draw_x, 1] = min(1.0, 
                                display_img[draw_y, draw_x, 1] + alpha)  # Verde
                            display_img[draw_y, draw_x, 2] = min(1.0, 
                                display_img[draw_y, draw_x, 2] + alpha)  # Amarelo
        
        # Desenhar estimativa do filtro
        x_hat, y_hat, s_hat, _, _ = self.pf.mean_state
        if 0 <= x_hat < self.img_size and 0 <= y_hat < self.img_size:
            size = max(2, int(s_hat))
            for i in range(-size, size + 1):
                for j in range(-size, size + 1):
                    draw_x = np.clip(int(x_hat) + i, 0, self.img_size - 1)
                    draw_y = np.clip(int(y_hat) + j, 0, self.img_size - 1)
                    distance = np.sqrt(i*i + j*j)
                    if distance <= size and distance >= size - 1:
                        display_img[draw_y, draw_x, 1] = 1.0  # Verde puro
    
    def run(self):
        """Executa a simulação profissional"""
        print("=== FILTRO DE PARTÍCULAS PROFISSIONAL ===")
        print("Controles:")
        print("- Clique e arraste: Desenhar paredes")
        print("- Botão direito: Limpar paredes")
        print("- ESC: Sair")
        print("- ESPAÇO: Resetar simulação")
        print("- R: Regenerar partículas ambientais")
        print("==========================================")
        
        for iteration in range(5000):
            # Atualizar sistemas de partículas
            self.update_micro_particles()
            self.update_target_particles()
            
            # Gerar observação
            target_obs = self.target_observation_function(
                np.array([[self.img_size//2, self.img_size//2, 3, 0, 0]])
            )
            
            # Atualizar filtro
            self.pf.update(target_obs)
            
            # Criar imagem de visualização
            display_img = np.zeros((self.img_size, self.img_size, 3), dtype=np.float32)
            
            # Desenhar paredes
            wall_mask = self.wall_map == 1
            display_img[wall_mask] = [0.8, 0.8, 0.8]
            
            # Renderizar todas as partículas
            self.render_particles(display_img)
            
            # Redimensionar para exibição
            display_img_scaled = cv2.resize(
                display_img, (0, 0), fx=self.scale_factor, fy=self.scale_factor,
                interpolation=cv2.INTER_LINEAR
            )
            
            # Adicionar informações
            cv2.putText(display_img_scaled, "Filtro Profissional de Particulas", 
                       (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (1, 1, 1), 1)
            cv2.putText(display_img_scaled, f"Particulas Filtro: {NUM_PARTICLES}", 
                       (10, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 1, 1), 1)
            cv2.putText(display_img_scaled, f"Particulas Ambiente: {NUM_MICRO_PARTICLES}", 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (1, 0.5, 0), 1)
            cv2.putText(display_img_scaled, "Clique: Desenhar | Dir: Limpar | R: Regenerar", 
                       (10, self.img_size * self.scale_factor - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (1, 1, 1), 1)
            
            # Exibir
            cv2.imshow("Filtro de Partículas Profissional", display_img_scaled)
            
            # Processar eventos
            key = cv2.waitKey(20) & 0xFF
            if key == 27:  # ESC
                break
            elif key == ord(' '):  # ESPAÇO
                self.target_particles = self.initialize_target_particles()
                self.pf.init_filter()
            elif key == ord('r') or key == ord('R'):  # R
                self.micro_particles = self.initialize_micro_particles()
        
        cv2.destroyAllWindows()

if __name__ == "__main__":
    professional_filter = ProfessionalParticleFilter()
    professional_filter.run()