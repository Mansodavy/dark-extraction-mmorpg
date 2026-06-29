/**
 *
 * Dark Extraction - StashManager
 *
 * Simple in-memory stash manager for extracted items. Can be replaced with DB persistence later.
 *
 */

const { sc } = require('@reldens/utils');

class StashManager
{

    constructor()
    {
        this.stashes = {};
    }

    getStash(playerId)
    {
        return this.stashes[playerId] || {};
    }

    addItem(playerId, itemKey, qty = 1)
    {
        if(!this.stashes[playerId]){
            this.stashes[playerId] = {};
        }
        let current = this.stashes[playerId][itemKey] || 0;
        this.stashes[playerId][itemKey] = current + qty;
        return true;
    }

    removeItem(playerId, itemKey, qty = 1)
    {
        if(!this.stashes[playerId] || !this.stashes[playerId][itemKey]){
            return false;
        }
        let current = this.stashes[playerId][itemKey];
        let newQty = current - qty;
        if(newQty <= 0){
            delete this.stashes[playerId][itemKey];
        } else {
            this.stashes[playerId][itemKey] = newQty;
        }
        return true;
    }

    clearPlayerStash(playerId)
    {
        delete this.stashes[playerId];
        return true;
    }

}

module.exports.StashManager = StashManager;
