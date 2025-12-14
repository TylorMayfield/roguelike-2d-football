import * as THREE from 'three';
import { TileMap, TileType } from '../game/TileMap';

export class FieldRenderer {
  private scene: THREE.Scene;
  private fieldMesh!: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createField(tileMap: TileMap) {
    // Create a single large ground plane for shadows to receive
    const groundGeometry = new THREE.PlaneGeometry(130, 60);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x228b22,
      roughness: 0.8,
      metalness: 0.0
    });
    this.fieldMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.fieldMesh.rotation.x = 0; // Already facing up in our 2D setup
    this.fieldMesh.position.set(0, 0, -0.2);
    this.fieldMesh.receiveShadow = true;
    this.scene.add(this.fieldMesh);

    // Field Details - Use instanced mesh for tiles
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0
    });
    
    // Colors
    const grassColor = new THREE.Color(0x228b22);
    const lightGrassColor = new THREE.Color(0x2e9e2e);
    const lineColor = new THREE.Color(0xffffff);
    const endzoneColor = new THREE.Color(0x8B0000);
    const endzoneLineColor = new THREE.Color(0xAD3333);
    const tunnelColor = new THREE.Color(0x333333);

    const count = tileMap.width * tileMap.height;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    instancedMesh.receiveShadow = true;

    let index = 0;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    const startX = -60;
    const startY = -27;

    for (let x = 0; x < tileMap.width; x++) {
      for (let y = 0; y < tileMap.height; y++) {
        const worldX = startX + x;
        const worldY = startY + y;

        dummy.position.set(worldX + 0.5, worldY + 0.5, -0.1); 
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(index, dummy.matrix);

        const tileType = tileMap.tiles[x][y];
        
        switch (tileType) {
            case TileType.ENDZONE:
                 if ((x + y) % 2 === 0) color.copy(endzoneColor);
                 else color.copy(endzoneLineColor);
                 break;
            case TileType.LINE:
                 color.copy(lineColor);
                 break;
            case TileType.TUNNEL:
                 color.copy(tunnelColor);
                 break;
            case TileType.GRASS:
            default:
                 if ((x + y) % 2 === 0) color.copy(grassColor);
                 else color.copy(lightGrassColor);
                 break;
        }

        instancedMesh.setColorAt(index, color);
        index++;
      }
    }
    
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    this.scene.add(instancedMesh);
  }
}
