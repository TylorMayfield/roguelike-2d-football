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
    private readonly baseScale: number = 1.0; 
    private readonly maxHeightScale: number = 1.3;
    
    // Visuals
    private sprite: THREE.Sprite;
    
    constructor() {
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.spin = new THREE.Vector3(0, 0, 0);
        
        // Create shadow mesh (simple dark circle)
        const shadowGeometry = new THREE.CircleGeometry(0.3, 16);
        const shadowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        });
        this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.shadow.position.z = 0.05;
        
        // Create Ball Sprite
        this.mesh = new THREE.Mesh(); // Dummy wrapper? No, let's use the Sprite directly as 'mesh' property type is Mesh... 
        // Actually, existing code expects 'mesh' to be a Mesh. Let's wrap the sprite in a Group so we can rotate it? 
        // Or just use a plane mesh with transparent texture for "pixel art" which allows 3D rotation?
        // Let's use Sprite for "facing camera" look but we want it to rotate? 
        // 2D Pixel art balls usually rotate by changing frames. 
        // For simplicity, let's just rotate the sprite itself (Z rotation) for roll effect.
        
        // Wait, 'mesh' needs to be THREE.Mesh for type safety with existing code?
        // The previous code had 'public mesh: THREE.Mesh'. We should probably change it to THREE.Object3D or just return a Mesh with a plane geometry.
        // Let's use a PlaneGeometry for the "Sprite" so we can rotate it 
        
        const ballCanvas = this.createBallTexture();
        const ballTexture = new THREE.CanvasTexture(ballCanvas);
        ballTexture.magFilter = THREE.NearestFilter;
        ballTexture.minFilter = THREE.NearestFilter;
        
        const geometry = new THREE.PlaneGeometry(0.6, 0.6); // Square for sprite
        const material = new THREE.MeshBasicMaterial({ 
            map: ballTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.z = 0.2;
    }
    
    private createBallTexture(): HTMLCanvasElement {
        // Generate a 12x12 pixel ball pattern
        const size = 12;
        const canvas = document.createElement('canvas');
        canvas.width = size * 8; // Scale up
        canvas.height = size * 8;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        
        // Draw low-res ball
        const tempC = document.createElement('canvas');
        tempC.width = size; tempC.height = size;
        const tCtx = tempC.getContext('2d')!;
        
        // White circle
        tCtx.fillStyle = '#ffffff';
        tCtx.beginPath();
        tCtx.arc(6, 6, 5, 0, Math.PI * 2);
        tCtx.fill();
        
        // Black spots (pixels)
        tCtx.fillStyle = '#222222';
        // Center spot
        tCtx.fillRect(5, 5, 2, 2);
        // Side spots
        tCtx.fillRect(2, 4, 2, 1);
        tCtx.fillRect(8, 7, 2, 1);
        tCtx.fillRect(5, 2, 2, 1);
        tCtx.fillRect(4, 9, 2, 1);
        
        // Outline (Cell Shading)
        // Scan and outline
        const pixels = tCtx.getImageData(0,0,size,size).data;
        tCtx.fillStyle = '#000000';
        for (let y=0; y<size; y++) {
            for (let x=0; x<size; x++) {
                const i = (y*size + x) * 4;
                if (pixels[i+3] === 0) { // Transparent
                    // Check neighbors for solid
                    let hasSolid = false;
                    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy]) => {
                        const nx = x+dx, ny = y+dy;
                        if (nx>=0 && nx<size && ny>=0 && ny<size) {
                            const ni = (ny*size + nx) * 4;
                            if (pixels[ni+3] > 0) hasSolid = true;
                        }
                    });
                    if (hasSolid) tCtx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Scale up to main canvas
        ctx.scale(8, 8);
        ctx.drawImage(tempC, 0, 0);
        
        return canvas;
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
        // Drastically reduced for realistic speed (0.3 to 0.7 range)
        const power = Math.min(0.7, 0.3 + distance * 0.02);
        
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
        // Shots are more powerful but not rocket-powered
        // Reduced to 0.4 multiplier (Input 1.0-2.0 -> Speed 0.4-0.8)
        const shotPower = power * 0.4;
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
