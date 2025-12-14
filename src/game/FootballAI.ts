import * as THREE from 'three';
import { Player } from './Player';
import { FootballRules, PlayState } from './FootballRules';
import { RouteRunner, RouteType } from './RouteRunner';

// Re-export RouteType for convenience
export { RouteType } from './RouteRunner';

/**
 * FootballAI - AI controller for receiver route running.
 * Route execution logic delegated to RouteRunner.
 */
export class FootballAI {
    private player: Player;
    public route: RouteType;
    private startPosition: THREE.Vector3 = new THREE.Vector3();
    private hasStartedRoute: boolean = false;

    constructor(player: Player, route: RouteType = RouteType.FLY) {
        this.player = player;
        this.route = route;
    }

    public setRoute(route: RouteType) {
        this.route = route;
        this.hasStartedRoute = false;
    }

    public getRouteDescription(): string {
        return RouteRunner.getRouteDescription(this.route);
    }

    public update(rules: FootballRules) {
        if (rules.playState !== PlayState.PLAY_ACTIVE) {
            if (!this.hasStartedRoute && rules.playState === PlayState.PRE_SNAP) {
                this.startPosition.copy(this.player.position);
            }
            return;
        }

        if (!this.hasStartedRoute) {
            this.startPosition.copy(this.player.position);
            this.hasStartedRoute = true;
        }

        this.runRoute();
    }

    private runRoute() {
        const moveDir = RouteRunner.getRouteDirection(
            this.route,
            this.player,
            this.startPosition
        );

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            this.player.move(moveDir.x, moveDir.y);
        }
    }
}
