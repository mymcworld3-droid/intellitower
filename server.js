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

// 開箱 API
app.post('/api/unbox', (req, res) => {
    const playerLevel = req.body.playerLevel || 1; //🔥 獲取前端傳來的玩家等級
    const randomType = EQUIPMENT_TYPES[Math.floor(Math.random() * EQUIPMENT_TYPES.length)];
    
    // 決定稀有度
    const roll = Math.random();
    let selectedRarity = RARITIES[0];
    let cumulativeChance = 0;
    for (const r of RARITIES) {
        cumulativeChance += r.chance;
        if (roll <= cumulativeChance) {
            selectedRarity = r;
            break;
        }
    }

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
