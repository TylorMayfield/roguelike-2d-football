import * as THREE from 'three';
import { Player } from './Player';

export enum RouteType {
    FLY = 'fly',
    SLANT = 'slant',
    POST = 'post',
    CURL = 'curl',
    BLOCK = 'block'
}

/**
 * RouteRunner - Executes specific route patterns for receivers.
 */
export class RouteRunner {
    /**
     * Calculate movement direction based on route type and current position.
     */
    public static getRouteDirection(
        route: RouteType,
        player: Player,
        startPosition: THREE.Vector3
    ): THREE.Vector3 {
        const moveDir = new THREE.Vector3(0, 0, 0);
        const currentX = player.position.x;
        const distanceRun = currentX - startPosition.x;

        switch (route) {
            case RouteType.FLY:
                moveDir.set(1, 0, 0);
                break;

            case RouteType.SLANT:
                if (distanceRun < 5) {
                    moveDir.set(1, 0, 0);
                } else {
                    // Cut inside based on field position
                    if (startPosition.y > 0) {
                        moveDir.set(1, -1, 0);
                    } else {
                        moveDir.set(1, 1, 0);
                    }
                }
                break;
            
            case RouteType.POST:
                if (distanceRun < 10) {
                    moveDir.set(1, 0, 0);
                } else {
                    // Cut towards center
                    if (startPosition.y > 0) {
                        moveDir.set(1, -0.5, 0);
                    } else {
                        moveDir.set(1, 0.5, 0);
                    }
                }
                break;

            case RouteType.CURL:
                if (distanceRun < 8) {
                    moveDir.set(1, 0, 0);
                } else if (distanceRun < 8.5) {
                    // Turn frame - stop
                    moveDir.set(0, 0, 0);
                } else {
                    // Come back slightly
                    moveDir.set(-0.1, 0, 0);
                }
                break;
                
            case RouteType.BLOCK:
                // Blocking handled elsewhere
                moveDir.set(0, 0, 0);
                break;
        }

        return moveDir;
    }

    /**
     * Get route description for display purposes.
     */
    public static getRouteDescription(route: RouteType): string {
        switch (route) {
            case RouteType.FLY: return 'Go Deep';
            case RouteType.SLANT: return 'Quick Slant';
            case RouteType.POST: return 'Post Route';
            case RouteType.CURL: return 'Curl Route';
            case RouteType.BLOCK: return 'Stay & Block';
            default: return 'Unknown';
        }
    }
}
