let state = {
    lv: 1,
    power: 100,
    gold: 0,
    energy: 50,
    equipment: {
        weapon: 0, head: 0, chest: 0, legs: 0, feet: 0, accessory: 0
    }
};

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
    const currentPower = state.equipment[item.type];
    
    if (item.power > currentPower) {
        // 裝備更好的
        state.equipment[item.type] = item.power;
        state.power = calculateTotalPower();
        
        // 更新 UI 槽位
        const slot = document.querySelector(`.slot[data-type="${item.type}"]`);
        slot.innerHTML = `<strong>${item.name}</strong><br>+${item.power}`;
        slot.style.borderColor = item.color;
        slot.classList.add('active');
        
        showToast(`獲得裝備：${item.name}！戰力提升`);
    } else {
        // 出售較弱的
        state.gold += item.sellValue;
        showToast(`回收模組：獲得 ${item.sellValue} 金幣`);
    }
    updateDisplay();
}

function calculateTotalPower() {
    let base = 100;
    for (let key in state.equipment) {
        base += state.equipment[key];
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
