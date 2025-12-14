import * as THREE from 'three';
import { SpriteAnimator } from '../rendering/SpriteAnimator';
import { UniversalPlayerMaterial } from '../rendering/UniversalPlayerMaterial';

export class Defender {
  public mesh: THREE.Mesh;
  public animator: SpriteAnimator;
  public material: UniversalPlayerMaterial;
  private texture: THREE.Texture;
  private speed = 0.09;
  
  private walkTexture: THREE.Texture;
  private actionTexture: THREE.Texture;
  private _isActing = false;
  
  public get isActing(): boolean { return this._isActing; }

  constructor(texture: THREE.Texture, actionTexture: THREE.Texture) {
    this.walkTexture = texture.clone();
    this.walkTexture.magFilter = THREE.NearestFilter;
    
    this.actionTexture = actionTexture.clone();
    this.actionTexture.magFilter = THREE.NearestFilter;
    
    this.animator = new SpriteAnimator(this.walkTexture, 4, 4, 150);
    
    this.material = new UniversalPlayerMaterial({
        texture: this.walkTexture,
        uJerseyColor: new THREE.Color(0x0000AA),
        uSkinColor: new THREE.Color(0x8d5524),
        uPantsColor: new THREE.Color(0x888888)
    });
    
    this.material.uniforms.uOffset.value.copy(this.walkTexture.offset);
    this.material.uniforms.uRepeat.value.copy(this.walkTexture.repeat);
    
    const geometry = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.scale.set(2.0, 2.0, 1);
  }

  public update(dt: number) {
      if (this._isActing) {
           // check action end
      }
      this.animator.update(dt);
      
      const currentTex = this._isActing ? this.actionTexture : this.walkTexture;
      this.material.uniforms.uOffset.value.copy(currentTex.offset);
      this.material.uniforms.uRepeat.value.copy(currentTex.repeat);
      this.material.uniforms.map.value = currentTex;
  }
  
  public updateAI(targetPosition: THREE.Vector3, active: boolean) {
    if (!active) {
       this.animator.setRow(0);
       return;
    }
    
    // Animation Update
    this.update(16);

    // Movement (only if not active player controlled and not acting)
    // If this defender is the activePlayer, updateAI shouldn't control movement!
    // But updateAI is called by GamePhysics for AI defenders.
    if (!this._isActing) {
        const direction = new THREE.Vector3().subVectors(targetPosition, this.mesh.position);
        const dist = direction.length();
    
        if (dist > 0.1) {
          direction.normalize();
          this.mesh.position.add(direction.multiplyScalar(this.speed));
    
          // Animation direction
          if (Math.abs(direction.x) > Math.abs(direction.y)) {
             if (direction.x > 0) this.animator.setRow(3);
             else this.animator.setRow(2);
          } else {
             if (direction.y > 0) this.animator.setRow(1);
             else this.animator.setRow(0);
          }
        }
    }
  }
  
  public move(dx: number, dy: number) {
      if (this._isActing) return;

      if (dx !== 0 || dy !== 0) {
          this.mesh.position.x += dx * 0.15; // Speed
          this.mesh.position.y += dy * 0.15;
      }
      
      // Update Animation Row
      if (dy > 0) this.animator.setRow(1); // Up
      else if (dy < 0) this.animator.setRow(0); // Down
      else if (dx < 0) this.animator.setRow(2); // Left
      else if (dx > 0) this.animator.setRow(3); // Right
  }
  
  public playAction(actionName: 'throw' | 'kick' | 'tackle' | 'block') {
      if (this._isActing) return;
      
      // Defender only has tackle animation for now
      if (actionName !== 'tackle') return;
      
      this._isActing = true;
      this.material.uniforms.map.value = this.actionTexture;
      
      // Tackle = Row 2
      this.animator = new SpriteAnimator(this.actionTexture, 2, 4, 100);
      this.animator.setRow(2);
      
      setTimeout(() => {
          this._isActing = false;
          this.material.uniforms.map.value = this.walkTexture;
          this.animator = new SpriteAnimator(this.walkTexture, 4, 4, 150);
      }, 500); 
  }

  public setPosition(x: number, y: number) {
    this.mesh.position.set(x, y, 0);
  }
  
  public get position(): THREE.Vector3 {
      return this.mesh.position;
  }

  // Active Player Indicator
  private ringMesh: THREE.Mesh | null = null;
  
  public setActive(isActive: boolean) {
      if (!this.ringMesh) this.createRing();
      if (this.ringMesh) this.ringMesh.visible = isActive;
  }

  private createRing() {
      const geometry = new THREE.RingGeometry(0.3, 0.35, 32);
      const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
      this.ringMesh = new THREE.Mesh(geometry, material);
      this.ringMesh.position.set(0, -0.4, -0.01); // Under feet
      this.ringMesh.visible = false;
      this.mesh.add(this.ringMesh);
  }
}
