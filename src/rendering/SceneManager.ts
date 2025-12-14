import * as THREE from 'three';

/**
 * SceneManager - Manages Three.js scene, camera, renderer, and lighting.
 */
class SceneManagerClass {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    
    // Lights
    public directionalLight!: THREE.DirectionalLight;
    public ambientLight!: THREE.AmbientLight;
    
    private cameraHeight = 60;
    private cameraAngle = 0.8; // Radians (~45 degrees)

    constructor() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

        // Perspective Camera (2.5D isometric-like view)
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
        
        // Position camera for 2.5D view (looking down at an angle)
        this.updateCameraPosition(0, 0);

        // WebGL Renderer with shadows
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
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
        // Ambient Light - base illumination
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        // Directional Light - sun with shadows
        this.directionalLight = new THREE.DirectionalLight(0xffffcc, 1.2);
        this.directionalLight.position.set(30, 50, 40);
        this.directionalLight.castShadow = true;
        
        // Shadow configuration
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 200;
        this.directionalLight.shadow.camera.left = -80;
        this.directionalLight.shadow.camera.right = 80;
        this.directionalLight.shadow.camera.top = 50;
        this.directionalLight.shadow.camera.bottom = -50;
        this.directionalLight.shadow.bias = -0.001;
        
        this.scene.add(this.directionalLight);

        // Optional: Hemisphere light for sky/ground color blending
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x228b22, 0.3);
        this.scene.add(hemiLight);
    }

    private updateCameraPosition(targetX: number, targetY: number) {
        // 2.5D camera positioning
        // Camera looks down at an angle from above and behind
        const offsetY = -this.cameraHeight * Math.sin(this.cameraAngle) * 0.5;
        const offsetZ = this.cameraHeight * Math.cos(this.cameraAngle);
        
        this.camera.position.set(targetX, targetY + offsetY, offsetZ);
        this.camera.lookAt(targetX, targetY, 0);
    }

    private handleResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspect;
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

    public setCameraPosition(x: number, y: number) {
        this.updateCameraPosition(x, y);
    }

    public followTarget(target: THREE.Vector3, lerp: number = 0.1) {
        const targetX = this.camera.position.x + (target.x - this.camera.position.x) * lerp;
        
        // Get current camera Y relative to target
        const offsetY = -this.cameraHeight * Math.sin(this.cameraAngle) * 0.5;
        const currentTargetY = this.camera.position.y - offsetY;
        const newTargetY = currentTargetY + (target.y - currentTargetY) * lerp * 0.3;
        
        this.updateCameraPosition(targetX, newTargetY);
        
        // Update directional light to follow camera area
        this.directionalLight.position.x = targetX + 30;
        this.directionalLight.target.position.set(targetX, 0, 0);
    }
}

// Singleton export
export const SceneManager = new SceneManagerClass();
