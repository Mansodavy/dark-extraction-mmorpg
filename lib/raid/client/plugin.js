/**
 *
 * Dark Extraction - RaidPlugin (client)
 *
 * Client-side plugin that registers the raid message listener.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { RaidMessageListener } = require('./message-listener');
const { Logger, sc } = require('@reldens/utils');

class RaidPlugin extends PluginInterface
{

    setup(props)
    {
        this.gameManager = sc.get(props, 'gameManager', false);
        this.events = sc.get(props, 'events', false);
        if(!this.gameManager || !this.events){
            Logger.error('Missing dependencies in RaidPlugin client.');
            return;
        }
        this.listenMessages();
    }

    listenMessages()
    {
        let listeners = sc.get(this.gameManager.config.client, 'message.listeners', false);
        if(!listeners){
            Logger.error('Client message listeners config not found.');
            return;
        }
        listeners['raid'] = new RaidMessageListener();
    }

}

module.exports.RaidPlugin = RaidPlugin;
