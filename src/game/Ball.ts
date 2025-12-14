import * as THREE from 'three';
import { SpriteAnimator } from '../rendering/SpriteAnimator';

export enum BallState {
    IDLE = 'idle',
    SPIRAL = 'spiral',
    WOBBLE = 'wobble',
    KICK = 'kick'
}

export class Ball {
  public mesh: THREE.Mesh;
  public velocity: THREE.Vector3;
  public animator: SpriteAnimator;
  
  private textures: { [key: string]: THREE.Texture } = {};
  public state: BallState = BallState.IDLE;

  constructor(defaultTexture: THREE.Texture) {
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.textures[BallState.IDLE] = defaultTexture;
    
    // Default animator (will be updated when textures load)
    this.animator = new SpriteAnimator(defaultTexture, 1, 1, 100);

    const geometry = new THREE.PlaneGeometry(0.4, 0.4); // slightly smaller/tighter
    const material = new THREE.MeshBasicMaterial({ 
      map: defaultTexture, 
      transparent: true,
      side: THREE.DoubleSide
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
  }

  public registerTexture(state: BallState, texture: THREE.Texture) {
      this.textures[state] = texture;
  }

  public setState(state: BallState) {
      if (this.state === state) return;
      this.state = state;
      
      const tex = this.textures[state] || this.textures[BallState.IDLE];
      if (!tex) return;

      (this.mesh.material as THREE.MeshBasicMaterial).map = tex;
      
      // Reset animator for new texture
      // 1x4 for all animations, 1x1 for idle
      const cols = state === BallState.IDLE ? 1 : 4;
      this.animator = new SpriteAnimator(tex, 1, cols, 100);
  }

  public update(dt: number) {
    // Physics
    this.mesh.position.add(this.velocity);
    this.velocity.multiplyScalar(0.96); // Friction

    if (this.velocity.length() < 0.01) {
        this.velocity.set(0, 0, 0);
        this.setState(BallState.IDLE);
    }
    
    // Animation
    if (this.state !== BallState.IDLE) {
        this.animator.update(dt);
        
        // Face direction of travel
        if (this.velocity.length() > 0.05) {
             const angle = Math.atan2(this.velocity.y, this.velocity.x);
             // Our sprites are side-view (facing right by default usually)
             this.mesh.rotation.z = angle;
        }
    } else {
        this.mesh.rotation.z = 0;
    }
  }

  public kick(direction: THREE.Vector3, force: number) {
    this.velocity.copy(direction).normalize().multiplyScalar(force);
    this.setState(BallState.KICK);
  }
  
  public throw(direction: THREE.Vector3, force: number, isGood: boolean) {
      this.velocity.copy(direction).normalize().multiplyScalar(force);
      this.setState(isGood ? BallState.SPIRAL : BallState.WOBBLE);
  }
}
