/**
 *
 * Dark Extraction - WeaponRegistry
 *
 * Loads weapon definitions from storage (weapons table) with a fallback default.
 *
 */

const { WeaponDefinition } = require('./weapon-definition');
const { Logger, sc } = require('@reldens/utils');

class WeaponRegistry
{

    constructor(dataServer)
    {
        this.dataServer = dataServer;
        this.weapons = {};
        this.defaultWeapon = new WeaponDefinition({
            key: 'default_pistol',
            label: 'Pistol',
            damage: 10,
            fireRate: 250,
            magazineSize: 10,
            reloadTime: 1500,
            projectileSpeed: 400,
            range: 600
        });
    }

    async loadWeapons()
    {
        if(!this.dataServer){
            return false;
        }
        try {
            let weaponsRepo = this.dataServer.getEntity('weapons');
            let rows = await weaponsRepo.loadAll();
            for(let row of rows){
                this.weapons[row.key] = new WeaponDefinition({
                    key: row.key,
                    label: row.label,
                    damage: row.damage,
                    fireRate: row.fire_rate,
                    magazineSize: row.magazine_size,
                    reloadTime: row.reload_time,
                    projectileSpeed: row.projectile_speed,
                    range: row.range,
                    affectedStat: row.affected_stat
                });
            }
            Logger.info('Loaded weapons from DB: '+Object.keys(this.weapons).length);
        } catch (error) {
            Logger.warning('Could not load weapons from DB, using fallback default.', error.message);
        }
        return true;
    }

    getWeapon(key)
    {
        return sc.get(this.weapons, key, this.defaultWeapon);
    }

}

module.exports.WeaponRegistry = WeaponRegistry;
