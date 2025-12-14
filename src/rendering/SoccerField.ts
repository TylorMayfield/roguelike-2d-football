import * as THREE from 'three';

/**
 * SoccerField - Renders a soccer pitch with markings and goals.
 */
export class SoccerField {
    public readonly width: number = 120;   // Field width (goal line to goal line)
    public readonly height: number = 80;   // Field height (sideline to sideline)
    public readonly goalWidth: number = 8; // Goal width
    public readonly goalDepth: number = 2; // Goal depth (for visual)
    
    private scene: THREE.Scene;
    private fieldMesh!: THREE.Mesh;
    private markings: THREE.Line[] = [];
    private goals: THREE.Group[] = [];
    
    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.createField();
        this.createMarkings();
        this.createGoals();
    }
    
    /**
     * Create the green field surface
     */
    private createField() {
        const geometry = new THREE.PlaneGeometry(this.width, this.height);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x228B22,  // Forest green
            side: THREE.DoubleSide 
        });
        this.fieldMesh = new THREE.Mesh(geometry, material);
        this.fieldMesh.position.z = -0.1;
        this.scene.add(this.fieldMesh);
        
        // Add stripe pattern
        this.createStripes();
    }
    
    /**
     * Create alternating grass stripes
     */
    private createStripes() {
        const stripeWidth = 10;
        const numStripes = Math.ceil(this.width / stripeWidth);
        
        for (let i = 0; i < numStripes; i++) {
            if (i % 2 === 0) continue; // Skip every other stripe
            
            const geo = new THREE.PlaneGeometry(stripeWidth, this.height);
            const mat = new THREE.MeshBasicMaterial({ 
                color: 0x1E7A1E,  // Slightly darker green
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.3
            });
            const stripe = new THREE.Mesh(geo, mat);
            stripe.position.x = -this.width / 2 + stripeWidth / 2 + i * stripeWidth;
            stripe.position.z = -0.05;
            this.scene.add(stripe);
        }
    }
    
    /**
     * Create field markings (lines)
     */
    private createMarkings() {
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        const hw = this.width / 2;
        const hh = this.height / 2;
        
        // Outer boundary
        this.addLine([
            [-hw, -hh], [-hw, hh], [hw, hh], [hw, -hh], [-hw, -hh]
        ], lineMaterial);
        
        // Center line
        this.addLine([[0, -hh], [0, hh]], lineMaterial);
        
        // Center circle
        this.addCircle(0, 0, 9.15, lineMaterial);
        
        // Center spot
        this.addCircle(0, 0, 0.3, lineMaterial, true);
        
        // Penalty boxes
        const penaltyBoxWidth = 16.5;
        const penaltyBoxHeight = 40;
        
        // Left penalty box
        this.addLine([
            [-hw, -penaltyBoxHeight/2],
            [-hw + penaltyBoxWidth, -penaltyBoxHeight/2],
            [-hw + penaltyBoxWidth, penaltyBoxHeight/2],
            [-hw, penaltyBoxHeight/2]
        ], lineMaterial);
        
        // Right penalty box
        this.addLine([
            [hw, -penaltyBoxHeight/2],
            [hw - penaltyBoxWidth, -penaltyBoxHeight/2],
            [hw - penaltyBoxWidth, penaltyBoxHeight/2],
            [hw, penaltyBoxHeight/2]
        ], lineMaterial);
        
        // Goal boxes (6-yard box)
        const goalBoxWidth = 5.5;
        const goalBoxHeight = 18;
        
        this.addLine([
            [-hw, -goalBoxHeight/2],
            [-hw + goalBoxWidth, -goalBoxHeight/2],
            [-hw + goalBoxWidth, goalBoxHeight/2],
            [-hw, goalBoxHeight/2]
        ], lineMaterial);
        
        this.addLine([
            [hw, -goalBoxHeight/2],
            [hw - goalBoxWidth, -goalBoxHeight/2],
            [hw - goalBoxWidth, goalBoxHeight/2],
            [hw, goalBoxHeight/2]
        ], lineMaterial);
        
        // Penalty spots
        this.addCircle(-hw + 11, 0, 0.3, lineMaterial, true);
        this.addCircle(hw - 11, 0, 0.3, lineMaterial, true);
        
        // Penalty arcs
        this.addArc(-hw + 11, 0, 9.15, Math.PI * 0.7, Math.PI * 1.3, lineMaterial);
        this.addArc(hw - 11, 0, 9.15, -Math.PI * 0.3, Math.PI * 0.3, lineMaterial);
    }
    
    /**
     * Create the goals
     */
    private createGoals() {
        const goalMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const postRadius = 0.15;
        const hw = this.width / 2;
        const goalHalfWidth = this.goalWidth / 2;
        
        // Left goal
        const leftGoal = this.createGoalMesh(-hw - this.goalDepth / 2, goalMaterial, postRadius, goalHalfWidth);
        this.scene.add(leftGoal);
        this.goals.push(leftGoal);
        
        // Right goal
        const rightGoal = this.createGoalMesh(hw + this.goalDepth / 2, goalMaterial, postRadius, goalHalfWidth);
        this.scene.add(rightGoal);
        this.goals.push(rightGoal);
        
        // Goal nets (visual only)
        this.addGoalNet(-hw - this.goalDepth / 2, goalHalfWidth);
        this.addGoalNet(hw + this.goalDepth / 2, goalHalfWidth);
    }
    
    private createGoalMesh(x: number, material: THREE.Material, postRadius: number, goalHalfWidth: number): THREE.Group {
        const group = new THREE.Group();
        
        // Posts
        const postGeo = new THREE.CircleGeometry(postRadius, 8);
        const topPost = new THREE.Mesh(postGeo, material);
        topPost.position.set(x, goalHalfWidth, 0.5);
        group.add(topPost);
        
        const bottomPost = new THREE.Mesh(postGeo.clone(), material);
        bottomPost.position.set(x, -goalHalfWidth, 0.5);
        group.add(bottomPost);
        
        // Crossbar (visual line)
        const crossbarGeo = new THREE.PlaneGeometry(this.goalDepth, postRadius * 2);
        const crossbarTop = new THREE.Mesh(crossbarGeo, material);
        crossbarTop.position.set(x, goalHalfWidth, 0.5);
        group.add(crossbarTop);
        
        const crossbarBottom = new THREE.Mesh(crossbarGeo.clone(), material);
        crossbarBottom.position.set(x, -goalHalfWidth, 0.5);
        group.add(crossbarBottom);
        
        return group;
    }
    
    private addGoalNet(x: number, goalHalfWidth: number) {
        const netGeo = new THREE.PlaneGeometry(this.goalDepth, this.goalWidth);
        const netMat = new THREE.MeshBasicMaterial({ 
            color: 0xcccccc, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const net = new THREE.Mesh(netGeo, netMat);
        net.position.set(x, 0, 0.2);
        this.scene.add(net);
    }
    
    /**
     * Add a line from points
     */
    private addLine(points: number[][], material: THREE.LineBasicMaterial) {
        const geometry = new THREE.BufferGeometry();
        const vertices: number[] = [];
        points.forEach(p => vertices.push(p[0], p[1], 0.01));
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.markings.push(line);
    }
    
    /**
     * Add a circle
     */
    private addCircle(x: number, y: number, radius: number, material: THREE.LineBasicMaterial, filled: boolean = false) {
        if (filled) {
            const geo = new THREE.CircleGeometry(radius, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, 0.01);
            this.scene.add(mesh);
        } else {
            const points: number[][] = [];
            for (let i = 0; i <= 32; i++) {
                const angle = (i / 32) * Math.PI * 2;
                points.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
            }
            this.addLine(points, material);
        }
    }
    
    /**
     * Add an arc
     */
    private addArc(x: number, y: number, radius: number, startAngle: number, endAngle: number, material: THREE.LineBasicMaterial) {
        const points: number[][] = [];
        const segments = 16;
        for (let i = 0; i <= segments; i++) {
            const angle = startAngle + (i / segments) * (endAngle - startAngle);
            points.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
        }
        this.addLine(points, material);
    }
    
    /**
     * Check if position is out of bounds
     */
    public isOutOfBounds(x: number, y: number): { out: boolean, side: 'top' | 'bottom' | 'left' | 'right' | null } {
        const hw = this.width / 2;
        const hh = this.height / 2;
        
        if (y > hh) return { out: true, side: 'top' };
        if (y < -hh) return { out: true, side: 'bottom' };
        if (x < -hw) return { out: true, side: 'left' };
        if (x > hw) return { out: true, side: 'right' };
        
        return { out: false, side: null };
    }
    
    /**
     * Check if position is a goal
     */
    public isGoal(x: number, y: number): 'home' | 'away' | null {
        const hw = this.width / 2;
        const goalHalfWidth = this.goalWidth / 2;
        
        if (Math.abs(y) < goalHalfWidth) {
            if (x <= -hw) return 'away'; // Away scores on left goal
            if (x >= hw) return 'home';  // Home scores on right goal
        }
        
        return null;
    }
}
