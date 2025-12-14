import * as THREE from 'three';

export enum TileType {
  GRASS = 0,
  LINE = 1,
  ENDZONE = 2,
  GOAL = 3, // Logic only, or specific tile
  TUNNEL = 4
}

export class TileMap {
  public width: number;
  public height: number;
  public tileSize: number; // In game units
  public tiles: TileType[][];
  
  // Field dimensions in "logical tiles"
  // Let's say -60 to 60 is 120 yards.
  // -27 to 27 is 54 yards.
  // If tileSize = 1, we have 120x54 grid.
  private gridOffsetX: number = 60;
  private gridOffsetY: number = 27;

  constructor(width: number, height: number, tileSize: number) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.tiles = [];

    this.initializeField();
  }

  private initializeField() {
    for (let x = 0; x < this.width; x++) {
      this.tiles[x] = [];
      for (let y = 0; y < this.height; y++) {
         let type = TileType.GRASS;
         
         // Logical coordinates relative to center (0,0)
         const worldX = x - this.gridOffsetX;
         
         // Endzones
         if (worldX < -50 || worldX >= 50) {
             type = TileType.ENDZONE;
         } else {
             // Yard lines every 5 yards
             const yardLine = (worldX + 50) % 5 === 0;
             if (yardLine) type = TileType.LINE;
         }
         
         this.tiles[x][y] = type;
      }
    }
  }

  public getTileAt(position: THREE.Vector3): TileType {
      const x = Math.floor(position.x) + this.gridOffsetX;
      const y = Math.floor(position.y) + this.gridOffsetY;
      
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
          return TileType.GRASS; // Out of bounds default
      }
      
      return this.tiles[x][y];
  }
  
  public isTouchdown(position: THREE.Vector3): boolean {
      const type = this.getTileAt(position);
      return type === TileType.ENDZONE;
  }
}
