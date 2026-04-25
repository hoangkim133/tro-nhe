/**
 * Store - LocalStorage CRUD for Nhà Trọ app
 * Manages houses, rooms, meters data
 */
const Store = (() => {
    const STORAGE_KEY = 'nhatro_data';
    const SYNC_QUEUE_KEY = 'nhatro_sync_queue';
    const SETTINGS_KEY = 'nhatro_settings';

    // --- Helpers ---
    function generateId(prefix) {
        return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function now() {
        return new Date().toISOString();
    }

    function getData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : { houses: [] };
        } catch (e) {
            console.error('Store: error reading data', e);
            return { houses: [] };
        }
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        // Trigger sync
        if (typeof Sync !== 'undefined') {
            Sync.enqueue(data);
        }
    }

    function getSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    // --- Houses ---
    function getHouses() {
        const data = getData();
        return (data.houses || []).filter(h => !h.deleted);
    }

    function getHouse(houseId) {
        const data = getData();
        return (data.houses || []).find(h => h.id === houseId && !h.deleted);
    }

    function addHouse(house) {
        const data = getData();
        const newHouse = {
            id: generateId('h'),
            name: house.name || '',
            address: house.address || '',
            defaultRates: {
                rent: house.rentRate || 0,
                electric: house.electricRate || 3500,
                water: house.waterRate || 15000,
                garbage: house.garbageRate || 20000,
                internet: house.internetRate || 100000
            },
            rooms: [],
            updatedAt: now(),
            deleted: false
        };
        data.houses.push(newHouse);
        saveData(data);
        return newHouse;
    }

    function updateHouse(houseId, updates) {
        const data = getData();
        const house = data.houses.find(h => h.id === houseId);
        if (!house) return null;

        if (updates.name !== undefined) house.name = updates.name;
        if (updates.address !== undefined) house.address = updates.address;
        if (updates.defaultRates) {
            house.defaultRates = { ...house.defaultRates, ...updates.defaultRates };
        }
        house.updatedAt = now();
        saveData(data);
        return house;
    }

    function deleteHouse(houseId) {
        const data = getData();
        const house = data.houses.find(h => h.id === houseId);
        if (house) {
            house.deleted = true;
            house.updatedAt = now();
            saveData(data);
        }
    }

    // --- Rooms ---
    function getRooms(houseId) {
        const house = getHouse(houseId);
        if (!house) return [];
        return (house.rooms || []).filter(r => !r.deleted);
    }

    function getRoom(houseId, roomId) {
        const house = getHouse(houseId);
        if (!house) return null;
        return (house.rooms || []).find(r => r.id === roomId && !r.deleted);
    }

    function addRoom(houseId, room) {
        const data = getData();
        const house = data.houses.find(h => h.id === houseId);
        if (!house) return null;

        const newRoom = {
            id: generateId('r'),
            name: room.name || '',
            tenant: room.tenant || '',
            phone: room.phone || '',
            rentPrice: room.rentPrice || 0,
            initialElectric: room.initialElectric || 0,
            initialWater: room.initialWater || 0,
            customRates: room.customRates || null,
            meters: [],
            updatedAt: now(),
            deleted: false
        };
        if (!house.rooms) house.rooms = [];
        house.rooms.push(newRoom);
        house.updatedAt = now();
        saveData(data);
        return newRoom;
    }

    function updateRoom(houseId, roomId, updates) {
        const data = getData();
        const house = data.houses.find(h => h.id === houseId);
        if (!house) return null;
        const room = (house.rooms || []).find(r => r.id === roomId);
        if (!room) return null;

        if (updates.name !== undefined) room.name = updates.name;
        if (updates.tenant !== undefined) room.tenant = updates.tenant;
        if (updates.phone !== undefined) room.phone = updates.phone;
        if (updates.rentPrice !== undefined) room.rentPrice = updates.rentPrice;
        if (updates.customRates !== undefined) room.customRates = updates.customRates;
        room.updatedAt = now();
        house.updatedAt = now();
        saveData(data);
        return room;
    }

    function deleteRoom(houseId, roomId) {
        const data = getData();
        const house = data.houses.find(h => h.id === houseId);
        if (!house) return;
        const room = (house.rooms || []).find(r => r.id === roomId);
        if (room) {
            room.deleted = true;
            room.updatedAt = now();
            house.updatedAt = now();
            saveData(data);
        }
    }

    // --- Meters ---
    function getMeters(houseId, roomId) {
        const room = getRoom(houseId, roomId);
        if (!room) return [];
        return (room.meters || []).sort((a, b) => b.month.localeCompare(a.month));
    }

    function getLatestMeter(houseId, roomId) {
        const meters = getMeters(houseId, roomId);
        return meters.length > 0 ? meters[0] : null;
    }

    function getMeterByMonth(houseId, roomId, month) {
        const meters = getMeters(houseId, roomId);
        return meters.find(m => m.month === month) || null;
    }

    function getRatesForRoom(houseId, roomId) {
        const house = getHouse(houseId);
        const room = getRoom(houseId, roomId);
        if (!house || !room) return null;

        const d = house.defaultRates || {};
        const c = room.customRates || {};
        const v = (custom, def, fallback) => custom != null ? custom : (def != null ? def : fallback);

        return {
            electric: v(c.electric, d.electric, 3500),
            water: v(c.water, d.water, 15000),
            garbage: v(c.garbage, d.garbage, 20000),
            internet: v(c.internet, d.internet, 100000),
            rent: v(room.rentPrice, d.rent, 0)
        };
    }

    function addMeter(houseId, roomId, meterData) {
        const data = getData();
        const house = data.houses.find(h => h.id === houseId);
        if (!house) return null;
        const room = (house.rooms || []).find(r => r.id === roomId);
        if (!room) return null;

        // Use custom rates if provided (for editing), otherwise use room's rates
        const rates = meterData.customRates || getRatesForRoom(houseId, roomId);

        const electricUsage = (meterData.electricNew || 0) - (meterData.electricOld || 0);
        const waterUsage = (meterData.waterNew || 0) - (meterData.waterOld || 0);

        const totalAmount =
            (rates.rent || 0) +
            (electricUsage * (rates.electric || 0)) +
            (waterUsage * (rates.water || 0)) +
            (rates.garbage || 0) +
            (rates.internet || 0);

        // Preserve paid status if editing existing meter
        if (!room.meters) room.meters = [];
        const existingMeter = room.meters.find(m => m.month === meterData.month);
        const wasPaid = existingMeter ? existingMeter.paid : false;

        const newMeter = {
            id: generateId('m'),
            month: meterData.month,
            electricOld: meterData.electricOld || 0,
            electricNew: meterData.electricNew || 0,
            waterOld: meterData.waterOld || 0,
            waterNew: meterData.waterNew || 0,
            ratesSnapshot: { ...rates },
            totalAmount: totalAmount,
            paid: wasPaid,
            createdAt: existingMeter ? existingMeter.createdAt : now()
        };

        // Remove existing meter for same month if exists
        room.meters = room.meters.filter(m => m.month !== meterData.month);
        room.meters.push(newMeter);

        room.updatedAt = now();
        house.updatedAt = now();
        saveData(data);
        return newMeter;
    }

    function togglePaid(houseId, roomId, meterId) {
        const data = getData();
        const house = data.houses.find(h => h.id === houseId);
        if (!house) return;
        const room = (house.rooms || []).find(r => r.id === roomId);
        if (!room) return;
        const meter = (room.meters || []).find(m => m.id === meterId);
        if (meter) {
            meter.paid = !meter.paid;
            room.updatedAt = now();
            house.updatedAt = now();
            saveData(data);
        }
    }

    // --- Get all meters across all houses/rooms (for history view) ---
    function getAllMeters() {
        const houses = getHouses();
        const allMeters = [];
        for (const house of houses) {
            const rooms = (house.rooms || []).filter(r => !r.deleted);
            for (const room of rooms) {
                for (const meter of (room.meters || [])) {
                    allMeters.push({
                        ...meter,
                        roomName: room.name,
                        tenantName: room.tenant,
                        houseName: house.name,
                        houseId: house.id,
                        roomId: room.id
                    });
                }
            }
        }
        return allMeters.sort((a, b) => b.month.localeCompare(a.month) || b.createdAt.localeCompare(a.createdAt));
    }

    // --- Get current month string ---
    function getCurrentMonth() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    // --- Format currency ---
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    }

    // --- Format month display ---
    function formatMonth(month) {
        const [y, m] = month.split('-');
        return `Tháng ${parseInt(m)}/${y}`;
    }

    // --- Export full data (for sync) ---
    function exportData() {
        return getData();
    }

    // --- Import full data (from restore) ---
    function importData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    return {
        getHouses, getHouse, addHouse, updateHouse, deleteHouse,
        getRooms, getRoom, addRoom, updateRoom, deleteRoom,
        getMeters, getLatestMeter, getMeterByMonth, getRatesForRoom,
        addMeter, togglePaid, getAllMeters,
        getCurrentMonth, formatCurrency, formatMonth,
        getSettings, saveSettings,
        exportData, importData,
        generateId
    };
})();
