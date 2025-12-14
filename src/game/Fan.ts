import * as THREE from 'three';
import { SpriteAnimator } from '../rendering/SpriteAnimator';

export class Fan {
  public mesh: THREE.Mesh;
  public animator: SpriteAnimator;
  private state: 'idle' | 'cheer' | 'jump' = 'idle';
  private stateTimer = 0;

  constructor(texture: THREE.Texture, x: number, y: number) {
    this.animator = new SpriteAnimator(texture, 3, 3, 200 + Math.random() * 100); // 3x3 grid, random speed
    
    // Random initial frame/state to de-sync
    this.animator.setRow(Math.floor(Math.random() * 3)); 

    const material = new THREE.MeshBasicMaterial({ 
      map: texture, 
      transparent: true, 
      side: THREE.DoubleSide 
    });
    
    const geometry = new THREE.PlaneGeometry(0.8, 0.8);
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, 0);
  }

  public update(dt: number) {
    this.animator.update(dt);
    
    // Maybe change state randomly?
    this.stateTimer += dt;
    if (this.stateTimer > 2000 + Math.random() * 3000) {
        this.stateTimer = 0;
        const rand = Math.random();
        if (rand < 0.6) this.animator.setRow(0); // Idle
        else if (rand < 0.9) this.animator.setRow(1); // Cheer
        else this.animator.setRow(2); // Jump
    }
  }
}
