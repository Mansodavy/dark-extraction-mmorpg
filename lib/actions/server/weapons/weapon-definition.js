/**
 *
 * Dark Extraction - WeaponDefinition
 *
 * Defines weapon properties for the shooter system (damage, fire rate, ammo, reload, range).
 *
 */

const { sc } = require('@reldens/utils');

class WeaponDefinition
{

    constructor(props = {})
    {
        this.key = sc.get(props, 'key', 'default_weapon');
        this.label = sc.get(props, 'label', 'Default Weapon');
        this.damage = sc.get(props, 'damage', 10);
        this.fireRate = sc.get(props, 'fireRate', 250); // ms between shots
        this.magazineSize = sc.get(props, 'magazineSize', 10);
        this.reloadTime = sc.get(props, 'reloadTime', 1500); // ms
        this.projectileSpeed = sc.get(props, 'projectileSpeed', 400);
        this.range = sc.get(props, 'range', 600);
        this.affectedStat = sc.get(props, 'affectedStat', 'hp');
        this.objectWidth = sc.get(props, 'objectWidth', 8);
        this.objectHeight = sc.get(props, 'objectHeight', 8);
        this.hitPriority = sc.get(props, 'hitPriority', 2);
    }

}

module.exports.WeaponDefinition = WeaponDefinition;
