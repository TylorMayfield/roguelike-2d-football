import * as THREE from 'three';

/**
 * SceneManager - Manages Three.js scene, camera, renderer, and lighting.
 */
class SceneManagerClass {
    public scene: THREE.Scene;
    public camera: THREE.OrthographicCamera;
    public renderer: THREE.WebGLRenderer;
    
    // Lights
    public directionalLight!: THREE.DirectionalLight;
    public ambientLight!: THREE.AmbientLight;
    
    // Orthographic Camera Config
    private frustumSize = 40; // Visible height in world units
    
    constructor() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x336633); // Darker grass green background

        // Orthographic Camera (True 2D)
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.OrthographicCamera(
            this.frustumSize * aspect / -2,
            this.frustumSize * aspect / 2,
            this.frustumSize / 2,
            this.frustumSize / -2,
            1,
            1000
        );
        
        // Position camera looking straight down
        this.camera.position.set(0, 0, 100);
        this.camera.lookAt(0, 0, 0);

        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false }); // Disable antialias for crisp pixels
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.body.appendChild(this.renderer.domElement);

        // Setup Lighting
        this.setupLighting();

        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
    }

    private setupLighting() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Bright ambient
        this.scene.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.directionalLight.position.set(10, 20, 50);
        this.directionalLight.castShadow = true;
        this.scene.add(this.directionalLight);
    }

    private handleResize() {
        const aspect = window.innerWidth / window.innerHeight;
        
        this.camera.left = -this.frustumSize * aspect / 2;
        this.camera.right = this.frustumSize * aspect / 2;
        this.camera.top = this.frustumSize / 2;
        this.camera.bottom = -this.frustumSize / 2;
        
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public render() {
        this.renderer.render(this.scene, this.camera);
    }

    public add(object: THREE.Object3D) {
        this.scene.add(object);
    }

    public remove(object: THREE.Object3D) {
        this.scene.remove(object);
    }

    // Deprecated but kept for compatibility
    public setCameraPosition(x: number, y: number) {
        this.camera.position.x = x;
        this.camera.position.y = y;
    }

    public followTarget(target: THREE.Vector3, lerp: number = 0.1) {
        // Simple 2D panning
        this.camera.position.x += (target.x - this.camera.position.x) * lerp;
        this.camera.position.y += (target.y - this.camera.position.y) * lerp;
    }
}

// Singleton export
export const SceneManager = new SceneManagerClass();
