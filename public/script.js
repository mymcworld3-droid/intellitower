//🔥 更新 state，讓裝備預設為物件以便記錄名稱
let state = {
    lv: 1,
    power: 100,
    gold: 0,
    energy: 50,
    equipment: {
        weapon: { power: 0, name: '無裝備' },
        head: { power: 0, name: '無裝備' },
        chest: { power: 0, name: '無裝備' },
        legs: { power: 0, name: '無裝備' },
        feet: { power: 0, name: '無裝備' },
        accessory: { power: 0, name: '無裝備' }
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
        const response = await fetch('/api/unbox', { method: 'POST' });
        const data = await response.json();
        processNewItem(data.item);
    } catch (err) {
        console.error("解碼錯誤", err);
    }
}

function processNewItem(item) {
    //🔥 改為彈出比對畫面，不再自動裝備
    pendingItem = item;
    const currentEquip = state.equipment[item.type];
    
    document.getElementById('modal-type').innerText = `[${getTranslateType(item.type)}]`;
    
    // 舊裝備資料
    document.getElementById('modal-old-name').innerText = currentEquip.name;
    document.getElementById('modal-old-power').innerText = `Power +${currentEquip.power}`;
    
    // 新裝備資料
    document.getElementById('modal-new-name').innerText = item.name;
    document.getElementById('modal-new-name').style.color = item.color;
    document.getElementById('modal-new-power').innerText = `Power +${item.power}`;
    
    // 計算差異
    const diff = item.power - currentEquip.power;
    const diffSpan = document.getElementById('modal-diff');
    if (diff > 0) {
        diffSpan.innerText = `+${diff} (提升)`;
        diffSpan.className = 'diff-positive';
    } else {
        diffSpan.innerText = `${diff} (較弱)`;
        diffSpan.className = 'diff-negative';
    }

    // 回收金額
    document.getElementById('modal-recycle-val').innerText = item.sellValue;

    // 顯示彈窗
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

// 初始化
updateDisplay();
