import * as THREE from 'three';
import { SpriteAnimator } from '../rendering/SpriteAnimator';

export class Referee {
  public mesh: THREE.Mesh;
  public animator: SpriteAnimator;
  private speed = 0.05;

  constructor(texture: THREE.Texture) {
    const tex = texture.clone();
    tex.magFilter = THREE.NearestFilter;
    
    this.animator = new SpriteAnimator(tex, 4, 4, 200);
    
    const material = new THREE.MeshBasicMaterial({ 
      map: tex, 
      transparent: true, 
      side: THREE.DoubleSide
    });
    
    const geometry = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.scale.set(1.5, 1.5, 1);
  }

  public update(dt: number) {
      this.animator.update(dt);
  }

  public setPosition(x: number, y: number) {
    this.mesh.position.set(x, y, 0);
  }
}
