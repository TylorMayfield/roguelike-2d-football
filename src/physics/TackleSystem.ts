import * as THREE from 'three';
import { Player } from '../game/Player';
import { Defender } from '../game/Defender';

/**
 * Result of a tackle attempt
 */
export interface TackleResult {
    success: boolean;
    tackleType: 'full' | 'trip' | 'stumble' | 'missed';
    knockbackForce: THREE.Vector3;
    ballCarrierSlowdown: number; // 0-1, applied to velocity
}

/**
 * Entity that can be involved in a tackle
 */
export interface TackleEntity {
    position: THREE.Vector3;
    velocity?: THREE.Vector3;
    mesh: THREE.Mesh;
    mass?: number;
}

/**
 * TackleSystem - Physics-based tackle detection and resolution.
 * 
 * Factors considered:
 * - Relative velocity (head-on vs chase)
 * - Approach angle (front, side, behind)
 * - Player sizes/masses
 * - Momentum exchange
 */
export class TackleSystem {
    private static readonly TACKLE_RANGE = 1.2;
    private static readonly MIN_TACKLE_VELOCITY = 0.1;
    
    /**
     * Check if a tackle can occur between tackler and ball carrier
     */
    public static canTackle(
        tackler: TackleEntity,
        ballCarrier: TackleEntity
    ): boolean {
        const distance = tackler.position.distanceTo(ballCarrier.position);
        return distance < this.TACKLE_RANGE;
    }
    
    /**
     * Attempt a tackle and calculate physics-based result
     */
    public static attemptTackle(
        tackler: TackleEntity,
        ballCarrier: TackleEntity
    ): TackleResult {
        const distance = tackler.position.distanceTo(ballCarrier.position);
        
        // Out of range
        if (distance > this.TACKLE_RANGE) {
            return {
                success: false,
                tackleType: 'missed',
                knockbackForce: new THREE.Vector3(),
                ballCarrierSlowdown: 0
            };
        }
        
        // Calculate approach angle (0 = front, 180 = behind)
        const approachAngle = this.calculateApproachAngle(tackler, ballCarrier);
        
        // Calculate relative velocity
        const tacklerVel = tackler.velocity || new THREE.Vector3();
        const carrierVel = ballCarrier.velocity || new THREE.Vector3();
        const relativeVelocity = new THREE.Vector3().subVectors(tacklerVel, carrierVel);
        const closingSpeed = relativeVelocity.length();
        
        // Get masses
        const tacklerMass = tackler.mass || 1.0;
        const carrierMass = ballCarrier.mass || 1.0;
        
        // Calculate tackle power
        const tacklePower = this.calculateTacklePower(
            approachAngle,
            closingSpeed,
            tacklerMass,
            carrierMass
        );
        
        // Calculate break-tackle chance
        const breakChance = this.calculateBreakTackleChance(
            ballCarrier,
            tacklePower
        );
        
        // Roll for tackle success
        const roll = Math.random();
        
        if (roll < breakChance) {
            // Break tackle - ball carrier pushes through
            return {
                success: false,
                tackleType: 'stumble',
                knockbackForce: this.calculateKnockback(tackler, ballCarrier, 0.2),
                ballCarrierSlowdown: 0.3
            };
        }
        
        // Tackle succeeds - determine type
        if (tacklePower > 0.7) {
            // Full tackle
            return {
                success: true,
                tackleType: 'full',
                knockbackForce: this.calculateKnockback(tackler, ballCarrier, 0.5),
                ballCarrierSlowdown: 1.0
            };
        } else if (tacklePower > 0.4) {
            // Trip
            return {
                success: true,
                tackleType: 'trip',
                knockbackForce: this.calculateKnockback(tackler, ballCarrier, 0.3),
                ballCarrierSlowdown: 0.8
            };
        } else {
            // Weak tackle, still success but barely
            return {
                success: true,
                tackleType: 'stumble',
                knockbackForce: this.calculateKnockback(tackler, ballCarrier, 0.1),
                ballCarrierSlowdown: 0.5
            };
        }
    }
    
    /**
     * Calculate approach angle in degrees
     * 0 = head-on, 90 = side, 180 = from behind
     */
    private static calculateApproachAngle(
        tackler: TackleEntity,
        ballCarrier: TackleEntity
    ): number {
        const carrierVel = ballCarrier.velocity || new THREE.Vector3(1, 0, 0);
        if (carrierVel.length() < 0.01) {
            return 0; // Standing still, treat as head-on
        }
        
        const tackleDir = new THREE.Vector3()
            .subVectors(ballCarrier.position, tackler.position)
            .normalize();
        const carrierDir = carrierVel.clone().normalize();
        
        // Dot product gives us cosine of angle
        const dot = tackleDir.dot(carrierDir);
        
        // Convert to degrees (0-180)
        return Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
    }
    
    /**
     * Calculate tackle power (0-1) based on physics factors
     */
    private static calculateTacklePower(
        approachAngle: number,
        closingSpeed: number,
        tacklerMass: number,
        carrierMass: number
    ): number {
        // Angle modifier: front = 1.0, side = 0.75, behind = 0.5
        let angleMod = 1.0;
        if (approachAngle > 120) {
            angleMod = 0.5; // Behind
        } else if (approachAngle > 60) {
            angleMod = 0.75; // Side
        }
        
        // Speed modifier (closing speed helps)
        const speedMod = Math.min(1.5, 0.5 + closingSpeed * 2);
        
        // Mass ratio modifier
        const massRatio = tacklerMass / carrierMass;
        const massMod = Math.min(1.5, Math.max(0.5, massRatio));
        
        // Combine factors
        const power = angleMod * speedMod * massMod * 0.5;
        
        return Math.min(1.0, Math.max(0, power));
    }
    
    /**
     * Calculate chance that ball carrier breaks the tackle
     */
    private static calculateBreakTackleChance(
        ballCarrier: TackleEntity,
        tacklePower: number
    ): number {
        const carrierVel = ballCarrier.velocity || new THREE.Vector3();
        const speed = carrierVel.length();
        const mass = ballCarrier.mass || 1.0;
        
        // Faster, heavier carriers break tackles more
        const carrierPower = 0.1 + speed * 0.2 + (mass - 1.0) * 0.1;
        
        // Break chance increases if tackle power is low
        const breakChance = carrierPower * (1.0 - tacklePower);
        
        return Math.min(0.5, Math.max(0, breakChance)); // Cap at 50%
    }
    
    /**
     * Calculate knockback force applied to ball carrier
     */
    private static calculateKnockback(
        tackler: TackleEntity,
        ballCarrier: TackleEntity,
        strength: number
    ): THREE.Vector3 {
        const knockDir = new THREE.Vector3()
            .subVectors(ballCarrier.position, tackler.position)
            .normalize();
        
        return knockDir.multiplyScalar(strength);
    }
    
    /**
     * Quick distance check for tackle range
     */
    public static isInTackleRange(
        tackler: TackleEntity | THREE.Vector3,
        ballCarrier: TackleEntity | THREE.Vector3,
        customRange?: number
    ): boolean {
        const range = customRange || this.TACKLE_RANGE;
        const pos1 = tackler instanceof THREE.Vector3 ? tackler : tackler.position;
        const pos2 = ballCarrier instanceof THREE.Vector3 ? ballCarrier : ballCarrier.position;
        
        return pos1.distanceTo(pos2) < range;
    }
}
