import * as THREE from 'three';

/**
 * SoccerBall - Physics-heavy ball with spin, curve, and realistic 3D physics.
 * Now supports full X/Y/Z movement with gravity and arc trajectories.
 */
export class SoccerBall {
    public mesh: THREE.Mesh;
    public shadow: THREE.Mesh;           // Ground shadow
    public position: THREE.Vector3;      // X = horizontal, Y = depth, Z = HEIGHT
    public velocity: THREE.Vector3;
    public spin: THREE.Vector3;          // Angular velocity (affects curve)
    public angularDrag: number = 0.98;   // Spin decay
    
    // Physics constants
    public readonly mass: number = 0.43;       // kg (standard soccer ball)
    public readonly radius: number = 0.11;     // meters (scaled for game)
    public readonly dragCoeff: number = 0.015; // Air resistance
    public readonly friction: number = 0.92;   // Ground friction
    public readonly bounceCoeff: number = 0.6; // Restitution (bounciness)
    public readonly magnusStrength: number = 0.003; // Curve from spin
    public readonly gravity: number = 0.015;   // Gravity strength (Z-axis pull down)
    
    // State
    public isGrounded: boolean = true;
    public height: number = 0;           // Current height above ground
    public airTime: number = 0;          // Time spent in air
    public lastTouchedBy: 'home' | 'away' | null = null;
    
    // Visual scaling
    private readonly baseScale: number = 0.8; // Ball radius scaled to match players
    private readonly maxHeightScale: number = 1.5; // Ball appears larger when high
    
    constructor() {
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.spin = new THREE.Vector3(0, 0, 0);
        
        // Create shadow mesh (always on ground)
        const shadowGeometry = new THREE.CircleGeometry(0.8, 16);
        const shadowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide 
        });
        this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.shadow.position.z = 0.05;
        
        // Create ball mesh with soccer ball pattern
        const ballCanvas = this.createBallTexture();
        const ballTexture = new THREE.CanvasTexture(ballCanvas);
        const geometry = new THREE.CircleGeometry(0.8, 24);
        const material = new THREE.MeshBasicMaterial({ 
            map: ballTexture,
            side: THREE.DoubleSide 
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.z = 0.1;
    }
    
    private createBallTexture(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        
        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Black pentagons pattern
        ctx.fillStyle = '#1a1a1a';
        const pentagonPositions = [
            { x: 32, y: 32, size: 10 },  // Center
            { x: 18, y: 18, size: 6 },   // Top-left
            { x: 46, y: 18, size: 6 },   // Top-right
            { x: 18, y: 46, size: 6 },   // Bottom-left
            { x: 46, y: 46, size: 6 },   // Bottom-right
        ];
        
        pentagonPositions.forEach(p => {
            this.drawPentagon(ctx, p.x, p.y, p.size);
        });
        
        // Subtle edge shading
        const gradient = ctx.createRadialGradient(24, 24, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }
    
    private drawPentagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const x = cx + size * Math.cos(angle);
            const y = cy + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Main physics update - Full 3D with gravity
     */
    public update(dt: number) {
        // Apply gravity when in the air
        if (!this.isGrounded) {
            this.velocity.z -= this.gravity;
            this.airTime += dt;
        }
        
        // Apply Magnus effect (spin causes curve) on X/Y axes
        if (this.spin.length() > 0.01) {
            const magnusForce = new THREE.Vector3()
                .crossVectors(this.spin, this.velocity)
                .multiplyScalar(this.magnusStrength);
            // Only apply curve to horizontal movement
            magnusForce.z = 0;
            this.velocity.add(magnusForce);
        }
        
        // Apply air drag (less when airborne)
        const horizontalSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        const totalSpeed = this.velocity.length();
        if (totalSpeed > 0.01) {
            const dragMult = this.isGrounded ? 1.0 : 0.6; // Less drag in air
            const dragForce = this.velocity.clone()
                .normalize()
                .multiplyScalar(-this.dragCoeff * dragMult * totalSpeed * totalSpeed);
            this.velocity.add(dragForce);
        }
        
        // Apply ground friction only when grounded
        if (this.isGrounded) {
            this.velocity.x *= this.friction;
            this.velocity.y *= this.friction;
        }
        
        // Decay spin
        this.spin.multiplyScalar(this.angularDrag);
        
        // Update position
        this.position.add(this.velocity);
        
        // Check for landing / bounce
        if (this.position.z <= 0) {
            this.position.z = 0;
            
            if (!this.isGrounded && Math.abs(this.velocity.z) > 0.02) {
                // Bounce!
                this.velocity.z = -this.velocity.z * this.bounceCoeff;
                
                // Reduce horizontal velocity on bounce
                this.velocity.x *= 0.85;
                this.velocity.y *= 0.85;
                
                // Add slight random spin from bounce
                this.spin.z += (Math.random() - 0.5) * 0.3;
                
                console.log(`Ball bounced! Height vel: ${this.velocity.z.toFixed(3)}`);
            } else {
                // Settled on ground
                this.velocity.z = 0;
                this.isGrounded = true;
                this.airTime = 0;
            }
        } else {
            this.isGrounded = false;
        }
        
        // Update height tracking
        this.height = Math.max(0, this.position.z);
        
        // Update visual positions
        // Shadow stays on ground
        this.shadow.position.set(this.position.x, this.position.y, 0.05);
        
        // Ball floats above shadow based on height
        // Use perspective scaling - ball appears larger when higher
        const heightScale = 1 + (this.height * 0.15);
        this.mesh.scale.setScalar(heightScale);
        
        // Ball Z position includes height (rendered as Y offset in 2D view) 
        // For 2.5D effect: ball moves up on screen when in air
        this.mesh.position.set(
            this.position.x, 
            this.position.y + this.height * 0.5, // Slight Y offset for height
            0.1 + this.height * 2 // Z-order above other sprites
        );
        
        // Shadow opacity decreases with height
        const shadowOpacity = Math.max(0.1, 0.4 - this.height * 0.05);
        (this.shadow.material as THREE.MeshBasicMaterial).opacity = shadowOpacity;
        
        // Shadow shrinks slightly with height 
        const shadowScale = Math.max(0.5, 1 - this.height * 0.02);
        this.shadow.scale.setScalar(shadowScale);
        
        // Rotate ball visual based on velocity
        if (horizontalSpeed > 0.05) {
            const rollAngle = horizontalSpeed * 0.5;
            this.mesh.rotation.z += rollAngle;
        }
        
        // Stop if very slow on ground
        if (this.isGrounded && horizontalSpeed < 0.005) {
            this.velocity.set(0, 0, 0);
        }
        if (this.spin.length() < 0.001) {
            this.spin.set(0, 0, 0);
        }
    }
    
    /**
     * Kick the ball with power, lift (height), and optional spin
     */
    public kick(
        direction: THREE.Vector3,
        power: number,
        spinAmount: number = 0,
        kicker: 'home' | 'away' = 'home',
        lift: number = 0 // Vertical lift component (0 = ground, 1 = high lob)
    ) {
        // Normalize direction on X/Y only
        const dir2D = new THREE.Vector2(direction.x, direction.y).normalize();
        
        // Base velocity from kick
        this.velocity.set(dir2D.x * power, dir2D.y * power, lift * power * 0.8);
        
        // Add spin (perpendicular to direction for curve)
        if (Math.abs(spinAmount) > 0.01) {
            this.spin.set(0, 0, spinAmount);
        }
        
        this.lastTouchedBy = kicker;
        
        // If there's any lift, ball is now airborne
        if (lift > 0.05) {
            this.isGrounded = false;
            this.airTime = 0;
        }
        
        console.log(`Kick! Power: ${power.toFixed(2)}, Lift: ${lift.toFixed(2)}, Spin: ${spinAmount.toFixed(2)}`);
    }
    
    /**
     * Pass to a target position with appropriate power
     */
    public pass(
        targetPosition: THREE.Vector3,
        passType: 'ground' | 'lob' | 'chip' = 'ground',
        passer: 'home' | 'away' = 'home'
    ) {
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.position);
        const distance = direction.length();
        
        // Calculate power based on distance
        const power = Math.min(1.8, 0.3 + distance * 0.04);
        
        // Determine lift based on pass type
        let lift = 0;
        switch (passType) {
            case 'lob':
                lift = 0.6 + distance * 0.02; // Higher arc for longer lobs
                break;
            case 'chip':
                lift = 0.3; // Quick chip over defenders
                break;
            case 'ground':
            default:
                lift = 0; // Keep it on the deck
        }
        
        direction.normalize();
        this.kick(direction, power, 0, passer, lift);
        this.lastTouchedBy = passer;
        console.log(`Pass! Distance: ${distance.toFixed(1)}, Power: ${power.toFixed(2)}`);
    }
    
    /**
     * Shoot at goal with power, curve, and optional lift
     */
    public shoot(
        direction: THREE.Vector3,
        power: number,
        curve: number = 0,
        shooter: 'home' | 'away' = 'home',
        lift: number = 0.2 // Default slight lift for shots
    ) {
        // Shots are more powerful
        const shotPower = power * 2.5;
        this.kick(direction, shotPower, curve, shooter, lift);
        
        console.log(`SHOT! Power: ${shotPower.toFixed(2)}, Curve: ${curve.toFixed(2)}, Lift: ${lift.toFixed(2)}`);
    }
    
    /**
     * Handle collision with a player (dribble touch)
     */
    public touch(
        playerPosition: THREE.Vector3,
        playerVelocity: THREE.Vector3,
        team: 'home' | 'away'
    ) {
        // Ball inherits some player velocity (dribbling)
        const pushDir = new THREE.Vector3()
            .subVectors(this.position, playerPosition)
            .normalize();
        
        // Combine player movement with push away
        const touchVel = playerVelocity.clone().multiplyScalar(0.5);
        touchVel.add(pushDir.multiplyScalar(0.1));
        
        this.velocity.copy(touchVel);
        this.lastTouchedBy = team;
    }
    
    /**
     * Handle bounce off a surface (post, player, etc.)
     */
    public bounce(normal: THREE.Vector3) {
        // Reflect velocity around normal
        const dot = this.velocity.dot(normal);
        this.velocity.sub(normal.multiplyScalar(2 * dot));
        
        // Apply bounce coefficient
        this.velocity.multiplyScalar(this.bounceCoeff);
        
        // Add some random spin from bounce
        this.spin.z += (Math.random() - 0.5) * 0.5;
    }
    
    /**
     * Check if ball is close enough to be controlled
     */
    public isNear(position: THREE.Vector3, range: number = 1.0): boolean {
        return this.position.distanceTo(position) < range;
    }
    
    /**
     * Reset ball to position (for restarts)
     */
    public reset(x: number, y: number) {
        this.position.set(x, y, 0);
        this.velocity.set(0, 0, 0);
        this.spin.set(0, 0, 0);
        this.height = 0;
        this.isGrounded = true;
        this.airTime = 0;
        
        // Reset visual positions
        this.mesh.position.set(x, y, 0.1);
        this.mesh.scale.setScalar(1);
        this.shadow.position.set(x, y, 0.05);
        this.shadow.scale.setScalar(1);
        (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.3;
        
        this.lastTouchedBy = null;
    }
    
    /**
     * Get current speed
     */
    public get speed(): number {
        return this.velocity.length();
    }
}
