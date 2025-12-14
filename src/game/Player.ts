import * as THREE from 'three';
import { SpriteAnimator } from '../rendering/SpriteAnimator';
import { UniversalPlayerMaterial } from '../rendering/UniversalPlayerMaterial';

export enum PlayerGender {
  MALE = 'male',
  FEMALE = 'female'
}

export enum PlayerSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export class Player {
  public mesh: THREE.Mesh;
  public animator: SpriteAnimator;
  public velocity: THREE.Vector3;
  private speed: number;
  private width: number;
  private height: number;
  
  public material: UniversalPlayerMaterial;
  private walkTexture: THREE.Texture;
  private idleTexture: THREE.Texture;
  private actionTexture: THREE.Texture | null;
  private _isActing: boolean = false;
  private currentActionName: string = '';
  
  public get isActing(): boolean { return this._isActing; }
  public get currentAction(): string { return this.currentActionName; }

  // Attachments
  private ponytail: THREE.Mesh | null = null;
  
  // Passing System
  public assignedKey: string = '';
  public ai: any = null; // Type: FootballAI (circular dep if imported directly? use interface or lazy import)
  private keyIndicatorMesh: THREE.Sprite | null = null;

  constructor(
      walkTexture: THREE.Texture,
      idleTexture: THREE.Texture,
      gender: PlayerGender, 
      size: PlayerSize, 
      uJerseyColor: THREE.Color,
      uSkinColor: THREE.Color,
      uPantsColor: THREE.Color,
      actionTexture?: THREE.Texture
  ) {

    this.velocity = new THREE.Vector3(0, 0, 0);
    // Clone textures so each player has independent animation state (offset/repeat)
    this.walkTexture = walkTexture.clone();
    this.idleTexture = idleTexture.clone();
    this.actionTexture = actionTexture ? actionTexture.clone() : null;
    
    // Ensure default settings on cloned textures
    this.walkTexture.magFilter = THREE.NearestFilter;
    this.idleTexture.magFilter = THREE.NearestFilter;
    if(this.actionTexture) this.actionTexture.magFilter = THREE.NearestFilter;
    
    // Base stats
    let baseSpeed = 0.15;
    let baseScale = 2.0;

    // Apply Size Modifiers
    switch (size) {
        case PlayerSize.SMALL:
            baseSpeed *= 1.1;
            baseScale = 1.2;
            break;
        case PlayerSize.LARGE:
            baseSpeed *= 0.8;
            baseScale = 1.8;
            break;
        case PlayerSize.MEDIUM:
        default:
            break;
    }
    
    this.speed = baseSpeed;
    this.width = baseScale;
    this.height = baseScale;

    // Start with Idle
    this.animator = new SpriteAnimator(this.idleTexture, 4, 4, 200);

    const geometry = new THREE.PlaneGeometry(1, 1); // Unit geometry, scaled by mesh.scale
    
    // Use UniversalPlayerMaterial
    this.material = new UniversalPlayerMaterial({
        texture: this.idleTexture,
        uJerseyColor: uJerseyColor,
        uSkinColor: uSkinColor,
        uPantsColor: uPantsColor
    });
    
    // Sync initial UVs
    this.material.uniforms.uOffset.value.copy(this.idleTexture.offset);
    this.material.uniforms.uRepeat.value.copy(this.idleTexture.repeat);
    
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.scale.set(this.width, this.height, 1);
    
    // Attachments
    if (gender === PlayerGender.FEMALE) {
        this.addPonytail(uSkinColor); // Use skin color for hair for now? Or generic brown?
                                      // Let's use a generic brown for hair, or maybe pass uHairColor?
                                      // For now, let's hardcode brown hair.
    }
  }

  private addPonytail(color: THREE.Color) {
      // Procedural Ponytail Texture
      const hairColor = new THREE.Color(0x3B240B); // Dark Brown
      const size = 32;
      const data = new Uint8Array(size * size * 4);
      
      for (let i = 0; i < size * size; i++) {
          const x = i % size;
          const y = Math.floor(i / size);
          
          // Draw a simple shape (e.g. oval/teardrop)
          const dx = x - 16;
          const dy = y - 16;
          if (dx*dx*2 + dy*dy < 100) { // Ovalish
              data[i * 4] = hairColor.r * 255;
              data[i * 4 + 1] = hairColor.g * 255;
              data[i * 4 + 2] = hairColor.b * 255;
              data[i * 4 + 3] = 255;
          } else {
              data[i * 4 + 3] = 0;
          }
      }
      
      const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      texture.needsUpdate = true;
      
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const geo = new THREE.PlaneGeometry(0.4, 0.4);
      this.ponytail = new THREE.Mesh(geo, mat);
      
      // Position relative to head (assuming 1x1 sprite, head is top center)
      // Base sprite center is (0,0). Head is likely around y = 0.2
      this.ponytail.position.set(0, 0.1, -0.1); // Behind head
      this.mesh.add(this.ponytail);
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

  public update(dt: number) {
    this.animator.update(dt);
    
    // Sync Shader Uniforms with Animator's texture updates
    // The animator modifies the texture's offset/repeat, but our Custom Shader
    // needs to be manually updated because it doesn't use the built-in map transform.
    
    // Determine current texture state
    let targetTexture = this.walkTexture;
    if (this._isActing && this.actionTexture) {
        targetTexture = this.actionTexture;
    } else {
        // Check movement
        if (this.velocity.lengthSq() < 0.0001) {
            targetTexture = this.idleTexture;
        } else {
            targetTexture = this.walkTexture;
        }
    }
    
    // Check if we need to switch animator texture
    if (this.animator.textureAsset !== targetTexture) {
         // Keep current row if possible (Direction)
         const currentRow = this.animator.currentRow;
         
         // Different speed for different animations
         let animSpeed = 150;
         if (targetTexture === this.idleTexture) animSpeed = 200;
         if (targetTexture === this.actionTexture) animSpeed = 100;

         this.animator = new SpriteAnimator(targetTexture, targetTexture === this.actionTexture ? 2 : 4, 4, animSpeed);
         
         // Map row correctly?
         if (targetTexture !== this.actionTexture) {
             this.animator.setRow(currentRow);
         }
         
         this.material.uniforms.map.value = targetTexture;
    }
    
    this.material.uniforms.uOffset.value.copy(targetTexture.offset);
    this.material.uniforms.uRepeat.value.copy(targetTexture.repeat);
    this.material.uniforms.map.value = targetTexture; 
    
    // Check if action finished (Action texture has 4 frames)
    if (this._isActing && this.animator.currentColumn === 3) {
         // end of animation loop
    }
    
    // Animate Ponytail (simple bob)
    if (this.ponytail) {
        // Bob up/down based on walk cycle?
        // Or just velocity?
        const bob = Math.sin(Date.now() / 100) * 0.05;
        this.ponytail.position.y = 0.1 + (this.velocity.length() > 0 ? bob : 0);
    }
  }
  
  public playAction(actionName: 'throw' | 'kick' | 'tackle' | 'block') {
      if (!this.actionTexture || this._isActing) return;
      
      this._isActing = true;
      this.currentActionName = actionName;
      
      // Swap texture
      this.material.uniforms.map.value = this.actionTexture;
      
      // Set Animator to Action sheet
      // Row 0 = Throw, Row 1 = Kick, Row 2 = Tackle, Row 3 = Block
      let row = 0;
      if (actionName === 'kick') row = 1;
      if (actionName === 'tackle') row = 2;
      if (actionName === 'block') row = 3;

      // use "this.actionTexture!" since we checked !this.actionTexture above
      this.animator = new SpriteAnimator(this.actionTexture!, 2, 4, 100);
      this.animator.setRow(row);
      
      // Reset after animation (approx 400ms)
      setTimeout(() => {
          this._isActing = false;
          this.currentActionName = '';
          // Loop will handle switching back to Walk/Idle based on velocity
      }, 400); 
  }

  public move(dx: number, dy: number) {
      if (this._isActing) return; // Lock movement during action

      if (dx !== 0 || dy !== 0) {
          this.mesh.position.x += dx * this.speed;
          this.mesh.position.y += dy * this.speed;
          this.velocity.set(dx, dy, 0);
      } else {
          this.velocity.set(0, 0, 0);
      }
      
      // Update Animation Row
      if (dy > 0) this.animator.setRow(1); // Up
      else if (dy < 0) this.animator.setRow(0); // Down
      else if (dx < 0) this.animator.setRow(2); // Left
      else if (dx > 0) this.animator.setRow(3); // Right
  }
  
  public setPosition(x: number, y: number) {
      this.mesh.position.set(x, y, 0);
  }
  
  public get position(): THREE.Vector3 {
      return this.mesh.position;
  }

  public setAssignedKey(key: string) {
      this.assignedKey = key;
      this.updateKeyIndicator();
  }

  private updateKeyIndicator() {
      if (!this.assignedKey) {
          if (this.keyIndicatorMesh) this.keyIndicatorMesh.visible = false;
          return;
      }

      if (!this.keyIndicatorMesh) {
          this.createKeyIndicator();
      }
      
      // If we need to regenerate texture for new key, we would do it here.
      // For now, assuming key doesn't change often, or we regenerate sprite.
      // Let's regenerate sprite if key changes
      if (this.keyIndicatorMesh) {
          // Remove old
          this.mesh.remove(this.keyIndicatorMesh);
          this.createKeyIndicator();
      }
  }

  private createKeyIndicator() {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(32, 32, 30, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.assignedKey, 32, 34);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
      this.keyIndicatorMesh = new THREE.Sprite(mat);
      this.keyIndicatorMesh.scale.set(0.5, 0.5, 1);
      this.keyIndicatorMesh.position.set(0, 0.8, 0.1); // Above head
      this.mesh.add(this.keyIndicatorMesh);
  }
}
