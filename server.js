const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// 模擬裝備資料庫
const EQUIPMENT_TYPES = ['weapon', 'head', 'chest', 'legs', 'feet', 'accessory'];
//🔥 全新的 10 階稀有度機率表
const GACHA_RATES = {
    1: { 普通: 0.60, 優秀: 0.30, 精良: 0.10, 稀有: 0, 卓越: 0, 史詩: 0, 傳奇: 0, 不朽: 0, 超越: 0, 永恆: 0 },
    2: { 普通: 0.20, 優秀: 0.40, 精良: 0.30, 稀有: 0.08, 卓越: 0.02, 史詩: 0, 傳奇: 0, 不朽: 0, 超越: 0, 永恆: 0 },
    3: { 普通: 0, 優秀: 0.15, 精良: 0.35, 稀有: 0.30, 卓越: 0.15, 史詩: 0.04, 傳奇: 0.01, 不朽: 0, 超越: 0, 永恆: 0 },
    4: { 普通: 0, 優秀: 0, 精良: 0.10, 稀有: 0.30, 卓越: 0.30, 史詩: 0.15, 傳奇: 0.10, 不朽: 0.04, 超越: 0.01, 永恆: 0 },
    5: { 普通: 0, 優秀: 0, 精良: 0, 稀有: 0.05, 卓越: 0.15, 史詩: 0.30, 傳奇: 0.25, 不朽: 0.15, 超越: 0.08, 永恆: 0.02 }
};

//🔥 定義 10 階稀有度的顏色、倍率與專屬特效 class
const RARITIES_INFO = {
    '普通': { multiplier: 1, color: '#9e9e9e', cssClass: '' },
    '優秀': { multiplier: 1.5, color: '#4caf50', cssClass: '' },
    '精良': { multiplier: 2.5, color: '#2196f3', cssClass: '' },
    '稀有': { multiplier: 4, color: '#9c27b0', cssClass: '' },
    '卓越': { multiplier: 7, color: '#ffeb3b', cssClass: 'effect-glow' }, // 亮外框
    '史詩': { multiplier: 12, color: '#ff9800', cssClass: 'effect-glow' }, // 亮外框
    '傳奇': { multiplier: 25, color: '#f44336', cssClass: 'effect-glow' }, // 亮外框
    '不朽': { multiplier: 50, color: '#e91e63', cssClass: 'effect-particle' }, // 粒子發光
    '超越': { multiplier: 100, color: '#00e5ff', cssClass: 'effect-particle' }, // 粒子發光 (使用亮青藍色以區分精良)
    '永恆': { multiplier: 300, color: '#ffffff', cssClass: 'effect-rainbow' } // 彩虹特效
};

// 開箱 API
app.post('/api/unbox', (req, res) => {
    const playerLevel = req.body.playerLevel || 1; 
    const terminalLevel = req.body.terminalLevel || 1; 
    const randomType = EQUIPMENT_TYPES[Math.floor(Math.random() * EQUIPMENT_TYPES.length)];
    
    // 決定稀有度
    const roll = Math.random();
    const rates = GACHA_RATES[terminalLevel] || GACHA_RATES[1];
    let selectedRarityName = '普通';
    let cumulativeChance = 0;
    
    for (const [rarity, chance] of Object.entries(rates)) {
        cumulativeChance += chance;
        if (roll <= cumulativeChance && chance > 0) {
            selectedRarityName = rarity;
            break;
        }
    }
    
    const selectedRarity = {
        name: selectedRarityName,
        ...RARITIES_INFO[selectedRarityName]
    };

    let equipLevel = playerLevel + Math.floor(Math.random() * 7) - 3;
    if (equipLevel < 1) equipLevel = 1;

    const power = Math.floor(equipLevel * 10 * selectedRarity.multiplier * (0.8 + Math.random() * 0.4));
    const hp = Math.floor(equipLevel * 50 * selectedRarity.multiplier * (0.8 + Math.random() * 0.4));
    const def = Math.floor(equipLevel * 5 * selectedRarity.multiplier * (0.8 + Math.random() * 0.4));

    const newItem = {
        id: Date.now(),
        type: randomType,
        name: `${selectedRarity.name}級模組`,
        rarity: selectedRarity.name,
        color: selectedRarity.color,
        cssClass: selectedRarity.cssClass, //🔥 傳遞特效 class 給前端
        level: equipLevel, 
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
