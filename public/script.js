//🔥 更新 state，加入終端機等級與升級進度
let state = {
    lv: 1,
    power: 100,
    gold: 500, // 給一點初始金幣方便測試
    energy: 50,
    terminalLevel: 1,
    terminalExp: 0,
    terminalExpMax: 5,
    equipment: {
        weapon: { level: 0, power: 0, hp: 0, def: 0, name: '無' },
        head: { level: 0, power: 0, hp: 0, def: 0, name: '無' },
        chest: { level: 0, power: 0, hp: 0, def: 0, name: '無' },
        legs: { level: 0, power: 0, hp: 0, def: 0, name: '無' },
        feet: { level: 0, power: 0, hp: 0, def: 0, name: '無' },
        accessory: { level: 0, power: 0, hp: 0, def: 0, name: '無' }
    }
};

//🔥 全域機率表設定 (與伺服器同步)
const gachaRates = {
    1: { 普通: 80, 稀有: 20, 史詩: 0, 傳說: 0 },
    2: { 普通: 60, 稀有: 35, 史詩: 5, 傳說: 0 },
    3: { 普通: 40, 稀有: 40, 史詩: 15, 傳說: 5 },
    4: { 普通: 20, 稀有: 45, 史詩: 25, 傳說: 10 },
    5: { 普通: 0, 稀有: 50, 史詩: 35, 傳說: 15 } // 最高5級示範
};

let pendingItem = null; //🔥 新增變數暫存待確認的裝備

function updateDisplay() {
    document.getElementById('val-lv').innerText = state.lv;
    document.getElementById('val-power').innerText = state.power;
    document.getElementById('val-gold').innerText = state.gold;
    document.getElementById('val-energy').innerText = state.energy;
}

async function triggerUnbox() {
    if (state.energy <= 0) {
        return;
    }
    state.energy -= 1;
    updateDisplay();
    try {
        const response = await fetch('/api/unbox', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                playerLevel: state.lv,
                terminalLevel: state.terminalLevel //🔥 傳遞解碼器等級
            })
        });
        const data = await response.json();
        processNewItem(data.item);
    } catch (err) {
        console.error("解碼錯誤", err);
    }
}

function renderRatesHTML(lv) {
    const r = gachaRates[lv];
    return `
        <div style="color:#9e9e9e;">普通: ${r['普通']}%</div>
        <div style="color:#2196f3;">稀有: ${r['稀有']}%</div>
        <div style="color:#9c27b0;">史詩: ${r['史詩']}%</div>
        <div style="color:#ff9800;">傳說: ${r['傳說']}%</div>
    `;
}

function openUpgradeModal() {
    const curLv = state.terminalLevel;
    const nextLv = Math.min(curLv + 1, 5); 
    
    document.getElementById('upg-current-lv').innerText = curLv;
    document.getElementById('upg-next-lv').innerText = curLv >= 5 ? 'MAX' : nextLv;
    
    document.getElementById('rate-current-list').innerHTML = renderRatesHTML(curLv);
    
    //🔥 判斷是否滿級，滿級時隱藏下一級機率並顯示提示
    if (curLv >= 5) {
        document.getElementById('rate-next-list').innerHTML = '<div style="color:#aaa; text-align:center; margin-top:10px;">已達最高等級</div>';
    } else {
        document.getElementById('rate-next-list').innerHTML = renderRatesHTML(nextLv);
    }
    
    updateUpgradeProgress();
    document.getElementById('upgrade-modal').style.display = 'flex';
}

function updateUpgradeProgress() {
    //🔥 新增滿級判斷，改變介面顯示
    if (state.terminalLevel >= 5) {
        document.getElementById('upg-exp-text').innerText = 'MAX';
        document.getElementById('upg-bar-fill').style.width = '100%';
        
        const btn = document.getElementById('btn-buy-exp');
        btn.disabled = true;
        btn.innerText = '已滿級';
    } else {
        document.getElementById('upg-exp-text').innerText = `${state.terminalExp} / ${state.terminalExpMax}`;
        const pct = (state.terminalExp / state.terminalExpMax) * 100;
        document.getElementById('upg-bar-fill').style.width = `${pct}%`;
        
        const cost = state.terminalLevel * 50; // 充能費用隨等級提升
        document.getElementById('upg-cost').innerText = cost;
        
        const btn = document.getElementById('btn-buy-exp');
        btn.disabled = false;
        btn.innerHTML = `充能 (🪙 <span id="upg-cost">${cost}</span>)`;
    }
}

function buyTerminalExp() {
    //🔥 如果已經滿級，直接返回，避免後續扣除金幣
    if (state.terminalLevel >= 5) {
        return;
    }

    const cost = state.terminalLevel * 50;
    
    if (state.gold < cost) {
        return;
    }

    // 扣除金幣並增加進度格
    state.gold -= cost;
    state.terminalExp += 1;
    
    // 如果格滿了，觸發升級 (模擬耗時)
    if (state.terminalExp >= state.terminalExpMax) {
        document.getElementById('btn-buy-exp').disabled = true;
        document.getElementById('btn-buy-exp').innerText = "升級構建中...";
        
        // 模擬升級需要時間 (2秒)
        setTimeout(() => {
            state.terminalLevel += 1;
            state.terminalExp = 0;
            
            //🔥 升級後判斷是否到達滿級，若未滿級才增加所需格數
            if (state.terminalLevel < 5) {
                state.terminalExpMax = state.terminalLevel * 5; // 升級所需格數增加 (5, 10, 15...)
            }
            
            document.getElementById('btn-terminal-level').innerText = state.terminalLevel >= 5 ? 'Lv.MAX' : `Lv.${state.terminalLevel}`;
            document.getElementById('btn-buy-exp').disabled = false;
            
            showToast(`升級成功！當前為 Lv.${state.terminalLevel}`);
            updateUpgradeProgress();
            openUpgradeModal(); // 刷新畫面
            updateDisplay();
        }, 2000);
    } else {
        //🔥 確保沒升級時也會更新進度與畫面
        updateUpgradeProgress();
        updateDisplay();
    }
}

function closeUpgradeModal() {
    document.getElementById('upgrade-modal').style.display = 'none';
}

function processNewItem(item) {
    pendingItem = item;
    const currentEquip = state.equipment[item.type];
    
    document.getElementById('modal-type').innerText = `[${getTranslateType(item.type)}]`;
    
    //🔥 舊裝備資料：顯示等級、攻擊、生命、防禦
    document.getElementById('modal-old-name').innerText = currentEquip.name;
    document.getElementById('modal-old-power').innerHTML = `Lv.${currentEquip.level}<br>攻擊 +${currentEquip.power}<br>生命 +${currentEquip.hp || 0}<br>防禦 +${currentEquip.def || 0}`;
    
    //🔥 新裝備資料
    document.getElementById('modal-new-name').innerText = item.name;
    document.getElementById('modal-new-name').style.color = item.color;
    document.getElementById('modal-new-power').innerHTML = `Lv.${item.level}<br>攻擊 +${item.power}<br>生命 +${item.hp}<br>防禦 +${item.def}`;
    
    // 計算差異 (目前以戰力為主)
    const diff = item.power - currentEquip.power;
    const diffSpan = document.getElementById('modal-diff');
    if (diff > 0) {
        diffSpan.innerText = `+${diff} (提升)`;
        diffSpan.className = 'diff-positive';
    } else {
        diffSpan.innerText = `${diff} (較弱)`;
        diffSpan.className = 'diff-negative';
    }

    document.getElementById('modal-recycle-val').innerText = item.sellValue;
    document.getElementById('compare-modal').style.display = 'flex';
}

function calculateTotalPower() {
    let base = 100;
    for (let key in state.equipment) {
        base += state.equipment[key].power; //🔥 改為讀取物件的 power
    }
    return base;
}

function confirmEquip() {
    if (!pendingItem) return;
    
    //🔥 更新數值至 state
    state.equipment[pendingItem.type] = {
        level: pendingItem.level,
        power: pendingItem.power,
        hp: pendingItem.hp,
        def: pendingItem.def,
        name: pendingItem.name,
        color: pendingItem.color
    };
    state.power = calculateTotalPower();
    
    //🔥 介面文字只顯示等級
    const slot = document.querySelector(`.slot[data-type="${pendingItem.type}"]`);
    slot.innerHTML = `Lv.${pendingItem.level}`; 
    slot.style.borderColor = pendingItem.color;
    slot.classList.add('active');

    closeModal();
    updateDisplay();
}

function confirmRecycle() {
    if (!pendingItem) return;
    
    state.gold += pendingItem.sellValue;   
    closeModal();
    updateDisplay();
}

function closeModal() {
    document.getElementById('compare-modal').style.display = 'none';
    pendingItem = null;
}

function getTranslateType(type) {
    const types = {
        weapon: '武器', head: '頭部', chest: '身體', 
        legs: '腿部', feet: '鞋子', accessory: '飾品'
    };
    return types[type] || type;
}
// 初始化
updateDisplay();
