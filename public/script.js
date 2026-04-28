//🔥 更新 state，加入詳細的數值
let state = {
    lv: 1,
    power: 100,
    gold: 0,
    energy: 50,
    equipment: {
        weapon: { level: 0, power: 0, hp: 0, def: 0, name: '無' },
        head: { level: 0, power: 0, hp: 0, def: 0, name: '無' },
        chest: { level: 0, power: 0, hp: 0, def: 0, name: '無' },
        legs: { level: 0, power: 0, hp: 0, def: 0, name: '無' },
        feet: { level: 0, power: 0, hp: 0, def: 0, name: '無' },
        accessory: { level: 0, power: 0, hp: 0, def: 0, name: '無' }
    }
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
        showToast("算力耗盡！請先透過答題補充");
        return;
    }

    state.energy -= 1;
    updateDisplay();

    try {
        //🔥 傳送目前玩家等級給後端
        const response = await fetch('/api/unbox', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerLevel: state.lv })
        });
        const data = await response.json();
        processNewItem(data.item);
    } catch (err) {
        console.error("解碼錯誤", err);
    }
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

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerText = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 2000);
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
    
    showToast(`裝備成功：${pendingItem.name}！`);
    closeModal();
    updateDisplay();
}

function confirmRecycle() {
    if (!pendingItem) return;
    
    state.gold += pendingItem.sellValue;
    showToast(`回收成功：獲得 ${pendingItem.sellValue} 金幣`);
    
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
