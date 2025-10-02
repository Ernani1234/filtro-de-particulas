#Alunos: Bruno Machado Ferreira(181276), Ernani Neto(180914), Fábio Gomes(181274) e Ryan Nantes(180901)
#Filtro de partículas interativo com desenho de paredes
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

img_size = 100
scale_factor = 8

class InteractiveParticleFilter:
    def __init__(self):
        self.img_size = img_size
        self.scale_factor = scale_factor
        self.walls = []  # Lista de paredes desenhadas
        self.drawing = False
        self.last_point = None
        self.wall_thickness = 2
        
        # Matriz para armazenar as paredes
        self.wall_map = np.zeros((img_size, img_size), dtype=np.uint8)
        
        # Estado do blob
        self.blob_x = img_size // 2
        self.blob_y = img_size // 2
        self.blob_dx = np.random.uniform(-0.5, 0.5)
        self.blob_dy = np.random.uniform(-0.5, 0.5)
        self.blob_radius = np.random.uniform(3, 8)
        
        # Configurar callbacks do mouse
        cv2.namedWindow("Filtro de Partículas Interativo", cv2.WINDOW_NORMAL)
        cv2.resizeWindow("Filtro de Partículas Interativo", 
                        scale_factor * img_size, scale_factor * img_size)
        cv2.setMouseCallback("Filtro de Partículas Interativo", self.mouse_callback)
        
        # Inicializar filtro de partículas
        self.setup_particle_filter()
        
    def mouse_callback(self, event, x, y, flags, param):
        """Callback para eventos do mouse - permite desenhar paredes"""
        # Converter coordenadas da tela para coordenadas da imagem
        img_x = int(x / self.scale_factor)
        img_y = int(y / self.scale_factor)
        
        # Garantir que as coordenadas estão dentro dos limites
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
            # Botão direito limpa as paredes
            self.clear_walls()
    
    def add_wall_point(self, x, y):
        """Adiciona um ponto de parede"""
        for i in range(-self.wall_thickness//2, self.wall_thickness//2 + 1):
            for j in range(-self.wall_thickness//2, self.wall_thickness//2 + 1):
                wall_x = np.clip(x + i, 0, self.img_size - 1)
                wall_y = np.clip(y + j, 0, self.img_size - 1)
                self.wall_map[wall_y, wall_x] = 1
    
    def draw_wall_line(self, x1, y1, x2, y2):
        """Desenha uma linha de parede entre dois pontos"""
        # Usar algoritmo de Bresenham para desenhar linha
        rr, cc = line(y1, x1, y2, x2)
        
        # Aplicar espessura à linha
        for r, c in zip(rr, cc):
            for i in range(-self.wall_thickness//2, self.wall_thickness//2 + 1):
                for j in range(-self.wall_thickness//2, self.wall_thickness//2 + 1):
                    wall_r = np.clip(r + i, 0, self.img_size - 1)
                    wall_c = np.clip(c + j, 0, self.img_size - 1)
                    self.wall_map[wall_r, wall_c] = 1
    
    def clear_walls(self):
        """Limpa todas as paredes"""
        self.wall_map = np.zeros((self.img_size, self.img_size), dtype=np.uint8)
        self.walls = []
    
    def check_wall_collision(self, x, y, radius=1):
        """Verifica se há colisão com parede em uma posição"""
        # Verificar área ao redor da posição
        x_int, y_int = int(round(x)), int(round(y))
        radius_int = int(round(radius))
        
        # Verificar limites da tela
        if x_int < radius_int or x_int >= self.img_size - radius_int or \
           y_int < radius_int or y_int >= self.img_size - radius_int:
            return True
            
        # Verificar colisão com paredes desenhadas
        for i in range(-radius_int, radius_int + 1):
            for j in range(-radius_int, radius_int + 1):
                check_x = np.clip(x_int + i, 0, self.img_size - 1)
                check_y = np.clip(y_int + j, 0, self.img_size - 1)
                if self.wall_map[check_y, check_x] == 1:
                    return True
        return False
    
    def blob_with_walls(self, x):
        """Função blob modificada que considera as paredes"""
        y = np.zeros((x.shape[0], self.img_size, self.img_size))
        for i, particle in enumerate(x):
            # Verificar se a partícula não está colidindo com parede
            if not self.check_wall_collision(particle[0], particle[1], max(particle[2], 1)):
                rr, cc = disk(
                    (particle[0], particle[1]), max(particle[2], 1), 
                    shape=(self.img_size, self.img_size)
                )
                y[i, rr, cc] = 1
        return y
    
    def velocity_with_collision(self, x):
        """Função de velocidade modificada que considera colisões com paredes"""
        dt = 1.0
        new_x = np.copy(x)
        
        for i in range(x.shape[0]):
            # Calcular nova posição
            new_pos_x = x[i, 0] + x[i, 3] * dt
            new_pos_y = x[i, 1] + x[i, 4] * dt
            
            # Verificar colisão na nova posição
            if self.check_wall_collision(new_pos_x, new_pos_y, max(x[i, 2], 1)):
                # Colisão detectada - inverter velocidade e aplicar amortecimento
                if self.check_wall_collision(x[i, 0] + x[i, 3] * dt, x[i, 1], max(x[i, 2], 1)):
                    new_x[i, 3] = -x[i, 3] * 0.8  # Inverter e amortecer velocidade X
                if self.check_wall_collision(x[i, 0], x[i, 1] + x[i, 4] * dt, max(x[i, 2], 1)):
                    new_x[i, 4] = -x[i, 4] * 0.8  # Inverter e amortecer velocidade Y
                    
                # Manter posição atual se houver colisão
                new_x[i, 0] = x[i, 0]
                new_x[i, 1] = x[i, 1]
            else:
                # Sem colisão - aplicar movimento normal
                new_x[i, 0] = new_pos_x
                new_x[i, 1] = new_pos_y
                new_x[i, 3] = x[i, 3]  # Manter velocidade X
                new_x[i, 4] = x[i, 4]  # Manter velocidade Y
            
            # Manter raio constante
            new_x[i, 2] = x[i, 2]
            
        return new_x
    
    def update_blob_position(self):
        """Atualiza a posição do blob considerando colisões com paredes"""
        # Calcular nova posição
        new_x = self.blob_x + self.blob_dx
        new_y = self.blob_y + self.blob_dy
        
        # Verificar colisão
        if self.check_wall_collision(new_x, new_y, self.blob_radius):
            # Verificar colisão em X
            if self.check_wall_collision(new_x, self.blob_y, self.blob_radius):
                self.blob_dx = -self.blob_dx * 0.9  # Inverter e amortecer
            # Verificar colisão em Y  
            if self.check_wall_collision(self.blob_x, new_y, self.blob_radius):
                self.blob_dy = -self.blob_dy * 0.9  # Inverter e amortecer
        else:
            # Sem colisão - atualizar posição
            self.blob_x = new_x
            self.blob_y = new_y
            
        # Adicionar pequena variação aleatória
        self.blob_dx += np.random.uniform(-0.1, 0.1)
        self.blob_dy += np.random.uniform(-0.1, 0.1)
        
        # Limitar velocidade máxima
        max_speed = 2.0
        speed = np.sqrt(self.blob_dx**2 + self.blob_dy**2)
        if speed > max_speed:
            self.blob_dx = (self.blob_dx / speed) * max_speed
            self.blob_dy = (self.blob_dy / speed) * max_speed
    
    def setup_particle_filter(self):
        """Configura o filtro de partículas"""
        columns = ["x", "y", "radius", "dx", "dy"]
        
        # Função de amostragem inicial
        prior_fn = independent_sample([
            norm(loc=self.img_size / 2, scale=self.img_size / 4).rvs,
            norm(loc=self.img_size / 2, scale=self.img_size / 4).rvs,
            gamma(a=1, loc=0, scale=5).rvs,
            norm(loc=0, scale=0.5).rvs,
            norm(loc=0, scale=0.5).rvs,
        ])
        
        # Criar filtro de partículas
        self.pf = ParticleFilter(
            prior_fn=prior_fn,
            observe_fn=self.blob_with_walls,
            n_particles=150,
            dynamics_fn=self.velocity_with_collision,
            noise_fn=lambda x: t_noise(x, sigmas=[0.2, 0.2, 0.05, 0.1, 0.1], df=100.0),
            weight_fn=lambda x, y: squared_error(x, y, sigma=2),
            resample_proportion=0.1,
            column_names=columns,
        )
    
    def run(self):
        """Executa o filtro de partículas interativo"""
        print("=== FILTRO DE PARTÍCULAS INTERATIVO ===")
        print("Controles:")
        print("- Clique e arraste com botão esquerdo: Desenhar paredes")
        print("- Botão direito: Limpar paredes")
        print("- ESC: Sair")
        print("- ESPAÇO: Resetar blob")
        print("========================================")
        
        for iteration in range(2000):  # Mais iterações para interação
            # Atualizar posição do blob
            self.update_blob_position()
            
            # Gerar observação do blob
            blob_observation = self.blob_with_walls(
                np.array([[self.blob_x, self.blob_y, self.blob_radius, 0, 0]])
            )
            
            # Atualizar filtro de partículas
            self.pf.update(blob_observation)
            
            # Criar imagem para visualização
            display_img = np.zeros((self.img_size, self.img_size, 3), dtype=np.float32)
            
            # Desenhar paredes em branco
            wall_mask = self.wall_map == 1
            display_img[wall_mask] = [1.0, 1.0, 1.0]  # Branco para paredes
            
            # Desenhar blob real em amarelo
            blob_rr, blob_cc = disk(
                (int(self.blob_y), int(self.blob_x)), max(int(self.blob_radius), 1),
                shape=(self.img_size, self.img_size)
            )
            display_img[blob_rr, blob_cc] = [0, 1, 1]  # Amarelo (BGR)
            
            # Desenhar partículas em azul
            for particle in self.pf.original_particles:
                px, py, pr, _, _ = particle
                if 0 <= px < self.img_size and 0 <= py < self.img_size:
                    try:
                        part_rr, part_cc = circle_perimeter(
                            int(py), int(px), max(int(pr), 1),
                            shape=(self.img_size, self.img_size)
                        )
                        display_img[part_rr, part_cc] = [1, 0, 0]  # Azul
                    except:
                        pass
            
            # Desenhar estimativa média em verde
            x_hat, y_hat, s_hat, dx_hat, dy_hat = self.pf.mean_state
            if 0 <= x_hat < self.img_size and 0 <= y_hat < self.img_size:
                try:
                    mean_rr, mean_cc = circle_perimeter(
                        int(y_hat), int(x_hat), max(int(s_hat), 1),
                        shape=(self.img_size, self.img_size)
                    )
                    display_img[mean_rr, mean_cc] = [0, 1, 0]  # Verde
                except:
                    pass
            
            # Redimensionar para exibição
            display_img_scaled = cv2.resize(
                display_img, (0, 0), fx=self.scale_factor, fy=self.scale_factor,
                interpolation=cv2.INTER_NEAREST
            )
            
            # Adicionar informações na tela
            cv2.putText(display_img_scaled, "Clique e arraste: Desenhar paredes", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (1, 1, 1), 1)
            cv2.putText(display_img_scaled, "Botao direito: Limpar", 
                       (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (1, 1, 1), 1)
            cv2.putText(display_img_scaled, "ESC: Sair | ESPACO: Reset", 
                       (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (1, 1, 1), 1)
            cv2.putText(display_img_scaled, f"Particulas: {len(self.pf.particles)}", 
                       (10, self.img_size * self.scale_factor - 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (1, 1, 1), 1)
            
            # Exibir imagem
            cv2.imshow("Filtro de Partículas Interativo", display_img_scaled)
            
            # Processar eventos de teclado
            key = cv2.waitKey(30) & 0xFF
            if key == 27:  # ESC
                break
            elif key == ord(' '):  # ESPAÇO - resetar blob
                self.blob_x = self.img_size // 2
                self.blob_y = self.img_size // 2
                self.blob_dx = np.random.uniform(-0.5, 0.5)
                self.blob_dy = np.random.uniform(-0.5, 0.5)
                self.pf.init_filter()  # Resetar partículas
        
        cv2.destroyAllWindows()

if __name__ == "__main__":
    interactive_filter = InteractiveParticleFilter()
    interactive_filter.run()