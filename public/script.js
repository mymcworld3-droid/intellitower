//🔥 更新 state，加入加速卷
let state = {
    lv: 1,
    power: 100,
    gold: 50000,
    energy: 500,
    speedUpScrolls: 1000, //🔥 初始給 10 個加速卷測試
    terminalLevel: 1,
    terminalExp: 0,
    terminalExpMax: 5,
    isBuilding: false,
    buildEndTime: 0,
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
    1: { 普通: 60, 優秀: 30, 精良: 10 },
    2: { 普通: 20, 優秀: 40, 精良: 30, 稀有: 8, 卓越: 2 },
    3: { 優秀: 15, 精良: 35, 稀有: 30, 卓越: 15, 史詩: 4, 傳奇: 1 },
    4: { 精良: 10, 稀有: 30, 卓越: 30, 史詩: 15, 傳奇: 10, 不朽: 4, 超越: 1 },
    5: { 稀有: 5, 卓越: 15, 史詩: 30, 傳奇: 25, 不朽: 15, 超越: 8, 永恆: 2 }
};

//🔥 稀有度對應顏色表 (用於動態渲染升級機率字體)
const rarityColors = {
    '普通': '#9e9e9e', '優秀': '#4caf50', '精良': '#2196f3',
    '稀有': '#9c27b0', '卓越': '#ffeb3b', '史詩': '#ff9800',
    '傳奇': '#f44336', '不朽': '#e91e63', '超越': '#00e5ff', '永恆': '#ffffff'
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

function openUpgradeModal() {
    const curLv = state.terminalLevel;
    const nextLv = Math.min(curLv + 1, 5); 
    
    document.getElementById('upg-current-lv').innerText = curLv;
    document.getElementById('upg-next-lv').innerText = curLv >= 5 ? 'MAX' : nextLv;
    
    //🔥 更新彈窗頂部資訊
    document.getElementById('upg-modal-gold').innerText = state.gold;
    document.getElementById('upg-modal-scrolls').innerText = state.speedUpScrolls;
    
    document.getElementById('rate-current-list').innerHTML = renderRatesHTML(curLv);
    
    if (curLv >= 5) {
        document.getElementById('rate-next-list').innerHTML = '<div style="color:#aaa; text-align:center; margin-top:20px;">已達最高等級</div>';
    } else {
        document.getElementById('rate-next-list').innerHTML = renderRatesHTML(nextLv);
    }
    
    updateUpgradeProgress();
    document.getElementById('upgrade-modal').style.display = 'flex';
}

function renderRatesHTML(lv) {
    const r = gachaRates[lv];
    let html = '';
    //🔥 遍歷所有稀有度，僅顯示機率大於 0 的項目
    for (let rarity in rarityColors) {
        const chance = r[rarity] || 0;
        if (chance > 0) {
            html += `<div style="color:${rarityColors[rarity]}; font-weight:bold; margin-bottom:4px; font-size:12px;">
                ${rarity}: ${chance}%
            </div>`;
        }
    }
    return html || '<div style="color:#666;">無資料</div>';
}

function updateUpgradeProgress() {
    const btn = document.getElementById('btn-buy-exp');
    if (!btn) return;

    if (state.terminalLevel >= 5) {
        document.getElementById('upg-exp-text').innerText = 'MAX';
        document.getElementById('upg-bar-fill').style.width = '100%';
        btn.disabled = true;
        btn.innerText = '已滿級';
    } else {
        document.getElementById('upg-exp-text').innerText = `${state.terminalExp} / ${state.terminalExpMax}`;
        const pct = (state.terminalExp / state.terminalExpMax) * 100;
        document.getElementById('upg-bar-fill').style.width = `${pct}%`;
        
        if (state.isBuilding) {
            //🔥 正在構建中時按鈕不再 disable，改為允許點擊使用加速卷
            btn.disabled = false; 
            const remaining = state.buildEndTime - Date.now();
            btn.innerText = `構建中 ${formatTime(remaining > 0 ? remaining : 0)}`;
        } else if (state.terminalExp >= state.terminalExpMax) {
            btn.disabled = false;
            btn.innerText = "開始構建";
        } else {
            const cost = state.terminalLevel * 50;
            btn.disabled = false;
            btn.innerHTML = `充能 (🪙 <span id="upg-cost">${cost}</span>)`;
        }
    }
}

function buyTerminalExp() {
    //🔥 如果正在構建，觸發加速詢問
    if (state.isBuilding) {
        const remainingMs = state.buildEndTime - Date.now();
        if (remainingMs <= 0) return;

        const msPerScroll = 5 * 60 * 1000; // 5 分鐘
        const scrollsNeeded = Math.ceil(remainingMs / msPerScroll);

        if (confirm(`是否消耗 ${scrollsNeeded} 個加速卷直接完成構建？\n(當前擁有: ${state.speedUpScrolls} 個)`)) {
            useSpeedUpScroll(scrollsNeeded);
        }
        return;
    }

    if (state.terminalLevel >= 5) return;

    if (state.terminalExp >= state.terminalExpMax) {
        startBuilding();
        return;
    }

    const cost = state.terminalLevel * 50;
    if (state.gold < cost) return;

    state.gold -= cost;
    state.terminalExp += 1;
    
    //🔥 記得同步更新彈窗頂部的金幣顯示
    document.getElementById('upg-modal-gold').innerText = state.gold;
    updateUpgradeProgress();
    updateDisplay();
}

function useSpeedUpScroll(count) {
    if (state.speedUpScrolls < count) {
        alert("加速卷不足！");
        return;
    }

    state.speedUpScrolls -= count;
    // 直接完成構建
    finishBuilding();
    
    // 更新介面
    document.getElementById('upg-modal-scrolls').innerText = state.speedUpScrolls;
    updateDisplay();
}
//🔥 新增計時器變數與構建相關函式
let buildTimer = null;

function startBuilding() {
    state.isBuilding = true;
    
    //🔥 等級一為 5 分鐘 (300秒)，後續等級時間會隨之增加 (級別 * 5分鐘)
    const buildSeconds = state.terminalLevel * 5 * 60; 
    state.buildEndTime = Date.now() + buildSeconds * 1000;
    
    updateUpgradeProgress();
    
    //🔥 設定每秒更新的倒數計時器
    buildTimer = setInterval(() => {
        const now = Date.now();
        const remaining = state.buildEndTime - now;
        
        if (remaining <= 0) {
            finishBuilding();
        } else {
            const btn = document.getElementById('btn-buy-exp');
            // 確保彈窗開著時才去更新文字
            if (btn && state.isBuilding) {
                btn.innerText = `構建中 ${formatTime(remaining)}`;
            }
        }
    }, 1000);
}

function finishBuilding() {
    clearInterval(buildTimer);
    state.isBuilding = false;
    state.terminalLevel += 1;
    state.terminalExp = 0;
    
    // 升級後判斷是否到達滿級，若未滿級才增加所需格數
    if (state.terminalLevel < 5) {
        state.terminalExpMax = state.terminalLevel * 5;
    }
    
    document.getElementById('btn-terminal-level').innerText = state.terminalLevel >= 5 ? 'Lv.MAX' : `Lv.${state.terminalLevel}`;
    
    // 如果有實作 showToast 可以用來提醒玩家
    if (typeof showToast === "function") {
        showToast(`升級成功！當前為 Lv.${state.terminalLevel}`);
    }
    
    updateUpgradeProgress();
    // 如果升級完成時彈窗開著，主動刷新內容
    if (document.getElementById('upgrade-modal').style.display === 'flex') {
        openUpgradeModal(); 
    }
    updateDisplay();
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds).padStart(2, '0');
    
    return `${hStr}:${mStr}:${sStr}`;
}

function closeUpgradeModal() {
    document.getElementById('upgrade-modal').style.display = 'none';
}

function processNewItem(item) {
    pendingItem = item;
    const currentEquip = state.equipment[item.type];
    
    document.getElementById('modal-type').innerText = `[${getTranslateType(item.type)}]`;
    
    document.getElementById('modal-old-name').innerText = currentEquip.name;
    document.getElementById('modal-old-power').innerHTML = `Lv.${currentEquip.level}<br>攻擊 +${currentEquip.power}<br>生命 +${currentEquip.hp || 0}<br>防禦 +${currentEquip.def || 0}`;
    
    //🔥 彈窗新裝備資料套用顏色與特效
    const newNameEl = document.getElementById('modal-new-name');
    newNameEl.innerText = item.name;
    newNameEl.style.color = item.color;
    // 清除舊特效並加上新特效 (如果有的話)
    newNameEl.className = 'equip-name'; 
    if (item.cssClass) {
        newNameEl.classList.add(item.cssClass);
        newNameEl.style.setProperty('--rarity-color', item.color); // 傳遞顏色給 CSS 變數
    }

    document.getElementById('modal-new-power').innerHTML = `Lv.${item.level}<br>攻擊 +${item.power}<br>生命 +${item.hp}<br>防禦 +${item.def}`;
    
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
    
    //🔥 更新數值至 state，並存下 cssClass
    state.equipment[pendingItem.type] = {
        level: pendingItem.level,
        power: pendingItem.power,
        hp: pendingItem.hp,
        def: pendingItem.def,
        name: pendingItem.name,
        color: pendingItem.color,
        cssClass: pendingItem.cssClass
    };
    state.power = calculateTotalPower();
    
    //🔥 裝備欄位套用特效與顏色
    const slot = document.querySelector(`.slot[data-type="${pendingItem.type}"]`);
    slot.innerHTML = `Lv.${pendingItem.level}`; 
    slot.style.borderColor = pendingItem.color;
    slot.classList.add('active');
    
    // 移除之前的各種特效
    slot.classList.remove('effect-glow', 'effect-particle', 'effect-rainbow');
    // 如果裝備有專屬特效則掛上，並利用 CSS 變數改變發光顏色
    if (pendingItem.cssClass) {
        slot.classList.add(pendingItem.cssClass);
        slot.style.setProperty('--rarity-color', pendingItem.color);
    }

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
