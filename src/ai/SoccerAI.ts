import * as THREE from 'three';
import { SoccerPlayer, SoccerPosition, Team } from '../game/SoccerPlayer';

export enum AIState {
    IDLE,
    CHASE_BALL,
    POSITION,
    SUPPORT_ATTACK,
    DEFEND,
    MARK_PLAYER,
    GOALKEEPER_POSITION
}

export enum PlayerRole {
    GOALKEEPER,
    DEFENDER,
    MIDFIELDER,
    ATTACKER
}

interface FormationPosition {
    x: number;
    y: number;
}

// Formation positions
const FORMATION_433: Record<SoccerPosition, FormationPosition> = {
    [SoccerPosition.GK]: { x: -55, y: 0 },
    [SoccerPosition.LB]: { x: -40, y: -25 },
    [SoccerPosition.CB]: { x: -45, y: -8 },
    [SoccerPosition.RB]: { x: -40, y: 25 },
    [SoccerPosition.CDM]: { x: -30, y: 0 },
    [SoccerPosition.CM]: { x: -15, y: 0 },
    [SoccerPosition.CAM]: { x: -5, y: 0 },
    [SoccerPosition.LM]: { x: -20, y: -20 },
    [SoccerPosition.RM]: { x: -20, y: 20 },
    [SoccerPosition.LW]: { x: 10, y: -25 },
    [SoccerPosition.RW]: { x: 10, y: 25 },
    [SoccerPosition.ST]: { x: 20, y: 0 },
};

/**
 * Get player role from position
 */
function getRole(pos: SoccerPosition): PlayerRole {
    switch (pos) {
        case SoccerPosition.GK: return PlayerRole.GOALKEEPER;
        case SoccerPosition.CB:
        case SoccerPosition.LB:
        case SoccerPosition.RB: return PlayerRole.DEFENDER;
        case SoccerPosition.CDM:
        case SoccerPosition.CM:
        case SoccerPosition.CAM:
        case SoccerPosition.LM:
        case SoccerPosition.RM: return PlayerRole.MIDFIELDER;
        case SoccerPosition.LW:
        case SoccerPosition.RW:
        case SoccerPosition.ST: return PlayerRole.ATTACKER;
        default: return PlayerRole.MIDFIELDER;
    }
}

/**
 * SoccerAI - Role-based AI for soccer players
 */
export class SoccerAI {
    public state: AIState = AIState.POSITION;
    public player: SoccerPlayer;
    public role: PlayerRole;
    
    private formationPos: FormationPosition;
    private ballPosition: THREE.Vector3 = new THREE.Vector3();
    private isAttacking: boolean = false;
    
    // Smooth movement
    private targetPosition: THREE.Vector3 = new THREE.Vector3();
    private currentVelocity: THREE.Vector3 = new THREE.Vector3();
    private smoothingFactor: number = 0.1;
    
    // Decision timing
    private decisionTimer: number = 0;
    private decisionInterval: number = 0.4;
    
    // Cached positions
    private supportOffset: THREE.Vector3 = new THREE.Vector3();
    private supportTimer: number = 0;
    
    // Role-specific parameters
    private aggressiveness: number = 0.5;
    private positioningStrictness: number = 0.5;
    private chaseRange: number = 15;
    
    constructor(player: SoccerPlayer) {
        this.player = player;
        this.role = getRole(player.soccerPosition);
        
        const basePos = FORMATION_433[player.soccerPosition];
        this.formationPos = player.team === 'away' 
            ? { x: -basePos.x, y: basePos.y }
            : basePos;
        
        // Set role-specific parameters
        this.initializeRoleParameters();
        this.randomizeSupportPosition();
    }
    
    private initializeRoleParameters() {
        switch (this.role) {
            case PlayerRole.GOALKEEPER:
                this.aggressiveness = 0.1;
                this.positioningStrictness = 0.9;
                this.chaseRange = 8;
                this.smoothingFactor = 0.15;
                break;
            case PlayerRole.DEFENDER:
                this.aggressiveness = 0.4;
                this.positioningStrictness = 0.7;
                this.chaseRange = 12;
                this.smoothingFactor = 0.1;
                break;
            case PlayerRole.MIDFIELDER:
                this.aggressiveness = 0.6;
                this.positioningStrictness = 0.5;
                this.chaseRange = 18;
                this.smoothingFactor = 0.12;
                break;
            case PlayerRole.ATTACKER:
                this.aggressiveness = 0.8;
                this.positioningStrictness = 0.3;
                this.chaseRange = 20;
                this.smoothingFactor = 0.1;
                break;
        }
    }
    
    private randomizeSupportPosition() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 6 + Math.random() * 8;
        this.supportOffset.set(Math.cos(angle) * dist, Math.sin(angle) * dist, 0);
    }
    
    public update(ballPos: THREE.Vector3, teamHasBall: boolean, nearestOpponent: SoccerPlayer | null, dt: number = 0.016) {
        this.ballPosition.copy(ballPos);
        this.isAttacking = teamHasBall;
        
        this.decisionTimer += dt;
        if (this.decisionTimer >= this.decisionInterval) {
            this.decisionTimer = 0;
            this.determineState(teamHasBall, nearestOpponent);
        }
        
        this.supportTimer += dt;
        if (this.supportTimer > 2.5) {
            this.supportTimer = 0;
            this.randomizeSupportPosition();
        }
        
        this.calculateTargetPosition(nearestOpponent);
        this.smoothMovement(dt);
    }
    
    private determineState(teamHasBall: boolean, nearestOpponent: SoccerPlayer | null) {
        const distToBall = this.player.position.distanceTo(this.ballPosition);
        
        // Role-specific decision making
        switch (this.role) {
            case PlayerRole.GOALKEEPER:
                this.state = AIState.GOALKEEPER_POSITION;
                break;
                
            case PlayerRole.DEFENDER:
                if (!teamHasBall) {
                    if (distToBall < this.chaseRange * 0.6) {
                        this.state = AIState.CHASE_BALL;
                    } else if (nearestOpponent && this.player.position.distanceTo(nearestOpponent.position) < 8) {
                        this.state = AIState.MARK_PLAYER;
                    } else {
                        this.state = AIState.DEFEND;
                    }
                } else {
                    this.state = AIState.POSITION;
                }
                break;
                
            case PlayerRole.MIDFIELDER:
                if (teamHasBall) {
                    if (distToBall < 25) {
                        this.state = AIState.SUPPORT_ATTACK;
                    } else {
                        this.state = AIState.POSITION;
                    }
                } else {
                    if (distToBall < this.chaseRange) {
                        this.state = AIState.CHASE_BALL;
                    } else {
                        this.state = AIState.DEFEND;
                    }
                }
                break;
                
            case PlayerRole.ATTACKER:
                if (teamHasBall) {
                    this.state = AIState.SUPPORT_ATTACK;
                } else {
                    if (distToBall < this.chaseRange * 0.5) {
                        this.state = AIState.CHASE_BALL;
                    } else {
                        this.state = AIState.POSITION;
                    }
                }
                break;
        }
    }
    
    private calculateTargetPosition(nearestOpponent: SoccerPlayer | null) {
        switch (this.state) {
            case AIState.GOALKEEPER_POSITION:
                this.calculateGoalkeeperPosition();
                break;
            case AIState.CHASE_BALL:
                this.targetPosition.copy(this.ballPosition);
                break;
            case AIState.POSITION:
                this.calculateFormationTarget();
                break;
            case AIState.SUPPORT_ATTACK:
                this.calculateSupportTarget();
                break;
            case AIState.DEFEND:
                this.calculateDefendTarget();
                break;
            case AIState.MARK_PLAYER:
                if (nearestOpponent) this.calculateMarkTarget(nearestOpponent);
                break;
        }
    }
    
    private calculateGoalkeeperPosition() {
        const goalX = this.player.team === 'home' ? -58 : 58;
        // Track ball horizontally within goal line
        const targetY = Math.max(-8, Math.min(8, this.ballPosition.y * 0.4));
        // Move forward slightly if ball is close
        const distToBall = this.player.position.distanceTo(this.ballPosition);
        const forward = distToBall < 20 ? 3 : 0;
        const targetX = this.player.team === 'home' ? goalX + forward : goalX - forward;
        
        this.targetPosition.set(targetX, targetY, 0);
    }
    
    private calculateFormationTarget() {
        // More fluid formation - drift with the ball significantly
        // This makes the team shape "shift" up and down the pitch with play
        const ballInfluenceX = 0.5 * (1 - this.positioningStrictness);
        const ballInfluenceY = 0.3; // Always shift Y a bit
        
        let targetX = this.formationPos.x + this.ballPosition.x * ballInfluenceX;
        const targetY = this.formationPos.y + this.ballPosition.y * ballInfluenceY;
        
        // Clamp X to reasonable field areas based on position
        if (this.role === PlayerRole.DEFENDER) {
            // Defenders shouldn't go too far forward
            const goalX = this.player.team === 'home' ? -60 : 60;
            const maxX = this.player.team === 'home' ? 10 : -10;
            targetX = Math.max(Math.min(targetX, Math.max(goalX, maxX)), Math.min(goalX, maxX)); 
            // Simplified clamping logic: 
            if (this.player.team === 'home') targetX = Math.min(targetX, 0); 
            else targetX = Math.max(targetX, 0); 
        }
        
        this.targetPosition.set(targetX, targetY, 0);
    }
    
    private calculateSupportTarget() {
        // Attackers push forward more to receive through balls
        const forwardDir = this.player.team === 'home' ? 1 : -1;
        const forwardBias = this.role === PlayerRole.ATTACKER ? 20 * forwardDir : 5 * forwardDir;
        
        this.targetPosition.set(
            Math.max(-55, Math.min(55, this.ballPosition.x + this.supportOffset.x + forwardBias)),
            Math.max(-35, Math.min(35, this.ballPosition.y + this.supportOffset.y)),
            0
        );
    }
    
    private calculateDefendTarget() {
        const goalX = this.player.team === 'home' ? -60 : 60;
        
        // Stay between ball and goal!
        // Lerp factor determines "how deep" to drop
        const depth = this.role === PlayerRole.DEFENDER ? 0.3 : 0.6; 
        // 0.3 means closer to goal (30% from goal to ball)
        
        const targetX = goalX + (this.ballPosition.x - goalX) * depth;
        // Match ball Y for blocking, but keep some formation width
        const widthResist = 0.5;
        const targetY = this.formationPos.y * widthResist + this.ballPosition.y * (1 - widthResist);
        
        this.targetPosition.set(targetX, targetY, 0);
    }
    
    private calculateMarkTarget(opponent: SoccerPlayer) {
        const goalX = this.player.team === 'home' ? -60 : 60;
        const targetX = opponent.position.x + (goalX - opponent.position.x) * 0.2;
        this.targetPosition.set(targetX, opponent.position.y, 0);
    }
    
    private smoothMovement(dt: number) {
        const dir = new THREE.Vector3().subVectors(this.targetPosition, this.player.position);
        const dist = dir.length();
        
        if (dist < 0.5) {
            this.currentVelocity.multiplyScalar(0.85);
        } else {
            dir.normalize();
            let targetSpeed = this.player.getSpeed();
            if (this.state === AIState.POSITION) targetSpeed *= 0.5;
            if (this.state === AIState.CHASE_BALL) targetSpeed *= 1.2;
            if (dist < 3) targetSpeed *= dist / 3;
            
            const targetVel = dir.multiplyScalar(targetSpeed);
            this.currentVelocity.lerp(targetVel, this.smoothingFactor);
        }
        
        this.player.velocity.copy(this.currentVelocity);
        if (this.currentVelocity.length() < 0.002) {
            this.player.velocity.set(0, 0, 0);
            this.currentVelocity.set(0, 0, 0);
        }
    }
    
    public getFormationPosition(): FormationPosition {
        return this.formationPos;
    }
}
