import * as THREE from 'three';

export class SpriteAnimator {
  private texture: THREE.Texture;
  private tilesHoriz: number;
  private tilesVert: number;
  private currentTile: number;
  private tileDisplayDuration: number;
  private currentDisplayTime: number;

  constructor(texture: THREE.Texture, tilesHoriz: number, tilesVert: number, tileDisplayDuration: number) {
    this.texture = texture;
    this.tilesHoriz = tilesHoriz;
    this.tilesVert = tilesVert;
    this.currentTile = 0;
    this.tileDisplayDuration = tileDisplayDuration; // Duration in ms
    this.currentDisplayTime = 0;

    // Set texture wrapping
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    
    // Scale texture to show only one tile
    this.texture.repeat.set(1 / this.tilesHoriz, 1 / this.tilesVert);
    this.updateOffset();
  }

  public update(milliSec: number) {
    this.currentDisplayTime += milliSec;
    while (this.currentDisplayTime > this.tileDisplayDuration) {
      this.currentDisplayTime -= this.tileDisplayDuration;
      // Advance frame, but stay within the current animation row (assuming row-based states)
      // This is a simplified "loop current row" logic for now. 
      // Real implementation would have named animations.
      
      const currentRow = Math.floor(this.currentTile / this.tilesHoriz);
      const nextTileInRow = this.currentTile + 1;
      
      if (Math.floor(nextTileInRow / this.tilesHoriz) !== currentRow) {
         this.currentTile = currentRow * this.tilesHoriz; // Loop back to start of row
      } else {
         this.currentTile = nextTileInRow;
      }

      this.updateOffset();
    }
  }
  
  public setRow(row: number) {
     const startTile = row * this.tilesHoriz;
     // Only change if completely different row
     if (Math.floor(this.currentTile / this.tilesHoriz) !== row) {
        this.currentTile = startTile;
        this.updateOffset();
     }
  }

  private updateOffset() {
    const column = this.currentTile % this.tilesHoriz;
    const tileRow = Math.floor(this.currentTile / this.tilesHoriz);

    // In Three.js UVs: (0,0) is bottom-left. 
    // Usually sprite sheets are top-left.
    // So row 0 (top) corresponds to V offset: 1 - (1/tilesVert)
    const offsetX = column / this.tilesHoriz;
    const offsetY = 1 - ((tileRow + 1) / this.tilesVert);

    this.texture.offset.x = offsetX;
    this.texture.offset.y = offsetY;
  }
  
  public get currentColumn(): number {
      return this.currentTile % this.tilesHoriz;
  }

  public get textureAsset(): THREE.Texture {
      return this.texture;
  }

  public get currentRow(): number {
      return Math.floor(this.currentTile / this.tilesHoriz);
  }
}
