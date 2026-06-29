/**
 *
 * Dark Extraction - WeaponManager
 *
 * Manages a player's equipped weapon: ammo, reload, fire-rate cooldown, and projectile creation.
 *
 */

const TypePhysicalAttack = require('../skills/type-physical-attack');
const { sc } = require('@reldens/utils');

class WeaponManager
{

    constructor(props = {})
    {
        this.player = sc.get(props, 'player', false);
        this.weapon = sc.get(props, 'weapon', false);
        this.ammo = this.weapon ? this.weapon.magazineSize : 0;
        this.lastShotTime = 0;
        this.reloading = false;
        this.reloadTimeout = null;
    }

    canShoot(now)
    {
        if(!this.weapon || !this.player || !this.player.physicalBody || !this.player.physicalBody.world){
            return false;
        }
        if(this.reloading){
            return false;
        }
        if(this.ammo <= 0){
            return false;
        }
        return now - this.lastShotTime >= this.weapon.fireRate;
    }

    shoot(angle, room)
    {
        let now = Date.now();
        if(!this.canShoot(now)){
            return false;
        }
        this.ammo--;
        this.lastShotTime = now;
        let from = this.player.getPosition();
        let target = this.calculateTargetPosition(from, angle);
        let skill = this.createWeaponSkill(room);
        this.player.physicalBody.world.shootBullet(from, target, skill);
        return true;
    }

    reload()
    {
        if(this.reloading || !this.weapon){
            return false;
        }
        this.reloading = true;
        this.reloadTimeout = setTimeout(() => {
            this.ammo = this.weapon.magazineSize;
            this.reloading = false;
        }, this.weapon.reloadTime);
        return true;
    }

    calculateTargetPosition(from, angleRad)
    {
        return {
            x: from.x + Math.cos(angleRad) * this.weapon.range,
            y: from.y + Math.sin(angleRad) * this.weapon.range
        };
    }

    createWeaponSkill(room)
    {
        let skill = new TypePhysicalAttack({
            key: this.weapon.key,
            owner: this.player,
            magnitude: this.weapon.projectileSpeed,
            objectWidth: this.weapon.objectWidth,
            objectHeight: this.weapon.objectHeight,
            hitPriority: this.weapon.hitPriority,
            range: this.weapon.range,
            affectedStat: this.weapon.affectedStat
        });
        skill.room = room;
        skill.customExecuteOnHit = async (target) => {
            if(!target || !target.stats){
                return false;
            }
            let affectedProperty = this.weapon.affectedStat;
            let currentValue = target.stats[affectedProperty];
            if(undefined === currentValue){
                return false;
            }
            let newValue = Math.max(0, currentValue - this.weapon.damage);
            target.stats[affectedProperty] = newValue;
            if(target.state){
                target.state[affectedProperty] = newValue;
            }
            return true;
        };
        return skill;
    }

}

module.exports.WeaponManager = WeaponManager;
