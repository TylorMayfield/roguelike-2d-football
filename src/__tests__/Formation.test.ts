import { OffensiveFormations, DefensiveFormations, FormationSpot } from '../game/Formation';

describe('Formations', () => {
    describe('OffensiveFormations', () => {
        it('should have Shotgun formation', () => {
            expect(OffensiveFormations['Shotgun']).toBeDefined();
        });

        it('should have IForm formation', () => {
            expect(OffensiveFormations['IForm']).toBeDefined();
        });

        describe('Shotgun Formation', () => {
            const shotgun = OffensiveFormations['Shotgun'];

            it('should have 6 positions (5 OL + QB)', () => {
                expect(shotgun.length).toBe(6);
            });

            it('should have a Center at x=0, y=0', () => {
                const center = shotgun.find(s => s.role === 'Center');
                expect(center).toBeDefined();
                expect(center!.x).toBe(0);
                expect(center!.y).toBe(0);
            });

            it('should have QB behind the line', () => {
                const qb = shotgun.find(s => s.role === 'QB');
                expect(qb).toBeDefined();
                expect(qb!.x).toBeLessThan(0); // Behind LOS
            });

            it('should have offensive line symmetric around center', () => {
                const lGuard = shotgun.find(s => s.role === 'LGuard');
                const rGuard = shotgun.find(s => s.role === 'RGuard');
                const lTackle = shotgun.find(s => s.role === 'LTackle');
                const rTackle = shotgun.find(s => s.role === 'RTackle');

                expect(lGuard!.y).toBe(-rGuard!.y);
                expect(lTackle!.y).toBe(-rTackle!.y);
            });
        });
    });

    describe('DefensiveFormations', () => {
        it('should have 4-3 formation', () => {
            expect(DefensiveFormations['4-3']).toBeDefined();
        });

        describe('4-3 Formation', () => {
            const fourThree = DefensiveFormations['4-3'];

            it('should have 7 positions (4 DL + 3 LB)', () => {
                expect(fourThree.length).toBe(7);
            });

            it('should have defensive line ahead of LOS', () => {
                const dLine = fourThree.filter(s => s.role.startsWith('D'));
                dLine.forEach(player => {
                    expect(player.x).toBeGreaterThan(0); // Ahead of LOS
                });
            });

            it('should have linebackers behind D-line', () => {
                const linebackers = fourThree.filter(s => s.role.includes('LB'));
                const dLineX = fourThree.find(s => s.role === 'DT_L')!.x;
                
                linebackers.forEach(lb => {
                    expect(lb.x).toBeGreaterThan(dLineX);
                });
            });
        });
    });

    describe('Formation Symmetry', () => {
        it('offensive formation should be symmetric on Y axis', () => {
            const shotgun = OffensiveFormations['Shotgun'];
            const yValues = shotgun.map(s => s.y);
            
            // For each positive Y, there should be a matching negative Y
            yValues.filter(y => y > 0).forEach(y => {
                expect(yValues).toContain(-y);
            });
        });

        it('defensive formation should be symmetric on Y axis', () => {
            const fourThree = DefensiveFormations['4-3'];
            const yValues = fourThree.map(s => s.y);
            
            yValues.filter(y => y > 0).forEach(y => {
                expect(yValues).toContain(-y);
            });
        });
    });
});
