/**
 *
 * Dark Extraction - LootTable
 *
 * Loot table with rarity weights and zone tier filtering.
 *
 */

const { Logger, sc } = require('@reldens/utils');

class LootTable
{

    constructor(rewards, zoneTier = 1)
    {
        this.rewards = rewards || [];
        this.zoneTier = zoneTier;
        // default rarity weights (common -> legendary)
        this.rarityWeights = {
            0: 60,
            1: 25,
            2: 10,
            3: 5
        };
    }

    getRandomReward()
    {
        if(0 === this.rewards.length){
            return null;
        }
        let eligible = this.rewards.filter(r => r.zoneTier <= this.zoneTier);
        if(0 === eligible.length){
            Logger.warning('No eligible rewards for zone tier.', this.zoneTier);
            return null;
        }
        let byRarity = {};
        for(let reward of eligible){
            let rarity = sc.get(reward, 'rarity', 0);
            if(!byRarity[rarity]){
                byRarity[rarity] = [];
            }
            byRarity[rarity].push(reward);
        }
        let weights = [];
        let rarities = [];
        for(let rarity of Object.keys(byRarity).map(Number).sort((a, b) => a - b)){
            weights.push(this.rarityWeights[rarity] || 1);
            rarities.push(rarity);
        }
        let totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        let sum = 0;
        let selectedRarity = rarities[0];
        for(let i = 0; i < rarities.length; i++){
            sum += weights[i];
            if(random <= sum){
                selectedRarity = rarities[i];
                break;
            }
        }
        let pool = byRarity[selectedRarity];
        return pool[Math.floor(Math.random() * pool.length)];
    }

    getMultipleRewards(count)
    {
        let results = [];
        for(let i = 0; i < count; i++){
            let reward = this.getRandomReward();
            if(reward){
                results.push(reward);
            }
        }
        return results;
    }

}

module.exports.LootTable = LootTable;
