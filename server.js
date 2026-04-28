const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// 模擬裝備資料庫
const EQUIPMENT_TYPES = ['weapon', 'head', 'chest', 'legs', 'feet', 'accessory'];
const RARITIES = [
    { name: '普通', chance: 0.6, multiplier: 1, color: '#9e9e9e' },
    { name: '稀有', chance: 0.3, multiplier: 2, color: '#2196f3' },
    { name: '史詩', chance: 0.08, multiplier: 5, color: '#9c27b0' },
    { name: '傳說', chance: 0.02, multiplier: 12, color: '#ff9800' }
];

//🔥 新增與前端對應的機率表與稀有度屬性 (取代原本的 RARITIES)
const GACHA_RATES = {
    1: { 普通: 0.80, 稀有: 0.20, 史詩: 0.00, 傳說: 0.00 },
    2: { 普通: 0.60, 稀有: 0.35, 史詩: 0.05, 傳說: 0.00 },
    3: { 普通: 0.40, 稀有: 0.40, 史詩: 0.15, 傳說: 0.05 },
    4: { 普通: 0.20, 稀有: 0.45, 史詩: 0.25, 傳說: 0.10 },
    5: { 普通: 0.00, 稀有: 0.50, 史詩: 0.35, 傳說: 0.15 }
};

const RARITIES_INFO = {
    '普通': { multiplier: 1, color: '#9e9e9e' },
    '稀有': { multiplier: 2, color: '#2196f3' },
    '史詩': { multiplier: 5, color: '#9c27b0' },
    '傳說': { multiplier: 12, color: '#ff9800' }
};

// 開箱 API
app.post('/api/unbox', (req, res) => {
    const playerLevel = req.body.playerLevel || 1; //🔥 獲取前端傳來的玩家等級
    const terminalLevel = req.body.terminalLevel || 1; //🔥 獲取終端機等級
    const randomType = EQUIPMENT_TYPES[Math.floor(Math.random() * EQUIPMENT_TYPES.length)];
    
    // 決定稀有度
    const roll = Math.random();
    const rates = GACHA_RATES[terminalLevel] || GACHA_RATES[1];
    let selectedRarityName = '普通';
    let cumulativeChance = 0;
    
    //🔥 依照傳入的終端機等級套用對應的機率
    for (const [rarity, chance] of Object.entries(rates)) {
        cumulativeChance += chance;
        if (roll <= cumulativeChance) {
            selectedRarityName = rarity;
            break;
        }
    }
    
    const selectedRarity = {
        name: selectedRarityName,
        ...RARITIES_INFO[selectedRarityName]
    };

    //🔥 裝備等級：玩家等級 +- 3 (最低為 1)
    let equipLevel = playerLevel + Math.floor(Math.random() * 7) - 3;
    if (equipLevel < 1) equipLevel = 1;

    //🔥 依據「裝備等級」與「稀有度」計算攻擊、生命、防禦
    const power = Math.floor(equipLevel * 10 * selectedRarity.multiplier * (0.8 + Math.random() * 0.4));
    const hp = Math.floor(equipLevel * 50 * selectedRarity.multiplier * (0.8 + Math.random() * 0.4));
    const def = Math.floor(equipLevel * 5 * selectedRarity.multiplier * (0.8 + Math.random() * 0.4));

    const newItem = {
        id: Date.now(),
        type: randomType,
        name: `${selectedRarity.name}級模組`,
        rarity: selectedRarity.name,
        color: selectedRarity.color,
        level: equipLevel, //🔥 傳回等級
        power: power,
        hp: hp,
        def: def,
        sellValue: Math.floor(power * 0.5)
    };

    res.json({ success: true, item: newItem });
});

app.listen(PORT, () => {
    console.log(`伺服器已啟動：http://localhost:${PORT}`);
});
