import * as THREE from 'three';
import { SoccerBall } from '../game/SoccerBall';

describe('SoccerBall', () => {
    let ball: SoccerBall;

    beforeEach(() => {
        ball = new SoccerBall();
    });

    describe('Initial State', () => {
        it('should start at origin', () => {
            expect(ball.position.x).toBe(0);
            expect(ball.position.y).toBe(0);
        });

        it('should have zero velocity', () => {
            expect(ball.velocity.length()).toBe(0);
        });

        it('should have zero spin', () => {
            expect(ball.spin.length()).toBe(0);
        });
    });

    describe('kick()', () => {
        it('should set velocity in kick direction', () => {
            const dir = new THREE.Vector3(1, 0, 0);
            ball.kick(dir, 2.0);
            
            expect(ball.velocity.x).toBeGreaterThan(0);
            expect(ball.velocity.length()).toBeCloseTo(2.0, 1);
        });

        it('should add spin when specified', () => {
            const dir = new THREE.Vector3(1, 0, 0);
            ball.kick(dir, 2.0, 0.5);
            
            expect(ball.spin.z).toBeCloseTo(0.5, 2);
        });

        it('should set lastTouchedBy', () => {
            ball.kick(new THREE.Vector3(1, 0, 0), 1.0, 0, 'away');
            expect(ball.lastTouchedBy).toBe('away');
        });
    });

    describe('shoot()', () => {
        it('should apply more power than kick', () => {
            const dir = new THREE.Vector3(1, 0, 0);
            
            const kickBall = new SoccerBall();
            kickBall.kick(dir.clone(), 1.0);
            
            const shootBall = new SoccerBall();
            shootBall.shoot(dir.clone(), 1.0);
            
            expect(shootBall.velocity.length()).toBeGreaterThan(kickBall.velocity.length());
        });
    });

    describe('update()', () => {
        it('should apply velocity to position', () => {
            ball.velocity.set(1, 0, 0);
            ball.update(0.016);
            
            expect(ball.position.x).toBeGreaterThan(0);
        });

        it('should apply friction to slow ball', () => {
            ball.velocity.set(1, 0, 0);
            const initialSpeed = ball.velocity.length();
            
            ball.update(0.016);
            
            expect(ball.velocity.length()).toBeLessThan(initialSpeed);
        });

        it('should decay spin over time', () => {
            ball.spin.set(0, 0, 1);
            const initialSpin = ball.spin.length();
            
            ball.update(0.016);
            
            expect(ball.spin.length()).toBeLessThan(initialSpin);
        });

        it('should stop when velocity is very low', () => {
            ball.velocity.set(0.001, 0, 0);
            ball.update(0.016);
            
            expect(ball.velocity.length()).toBe(0);
        });
    });

    describe('isNear()', () => {
        it('should return true for close positions', () => {
            ball.position.set(0, 0, 0);
            const nearPos = new THREE.Vector3(0.5, 0, 0);
            
            expect(ball.isNear(nearPos, 1.0)).toBe(true);
        });

        it('should return false for far positions', () => {
            ball.position.set(0, 0, 0);
            const farPos = new THREE.Vector3(10, 0, 0);
            
            expect(ball.isNear(farPos, 1.0)).toBe(false);
        });
    });

    describe('reset()', () => {
        it('should reset position to specified coordinates', () => {
            ball.velocity.set(5, 5, 0);
            ball.spin.set(1, 1, 1);
            
            ball.reset(10, 20);
            
            expect(ball.position.x).toBe(10);
            expect(ball.position.y).toBe(20);
            expect(ball.velocity.length()).toBe(0);
            expect(ball.spin.length()).toBe(0);
        });
    });

    describe('Magnus Effect', () => {
        it('should curve ball with spin', () => {
            ball.position.set(0, 0, 0);
            ball.velocity.set(2, 0, 0);  // Moving right
            ball.spin.set(0, 0, 1);      // Top spin
            
            const startY = ball.position.y;
            
            // Run several update cycles
            for (let i = 0; i < 10; i++) {
                ball.update(0.016);
            }
            
            // Ball should have curved (y changed)
            expect(ball.position.y).not.toBe(startY);
        });
    });
});
