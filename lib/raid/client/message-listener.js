/**
 *
 * Dark Extraction - RaidMessageListener (client)
 *
 * Placeholder client listener for raid-related messages (stash, loot chests, extraction).
 *
 */

const { Logger, sc } = require('@reldens/utils');

class RaidMessageListener
{

    executeClientMessageActions(props)
    {
        let message = sc.get(props, 'message', false);
        if(!message){
            return false;
        }
        if('stash_update' === message.act){
            // @TODO - BETA - Render stash UI panel.
            Logger.info('Stash updated.', message.stash);
            return true;
        }
        if('loot_chest_opening' === message.act){
            Logger.info('Loot chest opening.', message.id);
            return true;
        }
        if('loot_chest_opened' === message.act){
            Logger.info('Loot chest opened.', message.id);
            return true;
        }
        if('extraction_start' === message.act){
            Logger.info('Extraction started.', message.objectId);
            return true;
        }
        if('extraction_complete' === message.act){
            Logger.info('Extraction complete.', message.objectId);
            return true;
        }
        if('raid_timeout' === message.act){
            Logger.info('Raid timed out.');
            return true;
        }
        return false;
    }

}

module.exports.RaidMessageListener = RaidMessageListener;
