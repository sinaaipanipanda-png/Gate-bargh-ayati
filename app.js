const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'outages.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function getOutages() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
}

function saveOutages(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ۱. دریافت همه قطعی‌ها
app.get('/api/outages', (req, res) => {
    const outages = getOutages();
    res.json(outages);
});

// ۲. ثبت قطعی جدید
app.post('/api/outages', (req, res) => {
    const { password, date, outageTime, restoreTime, reason } = req.body;

    if (password !== '9412') {
        return res.status(403).json({ success: false, message: 'رمز عبور اشتباه است.' });
    }

    const outages = getOutages();
    const newCard = {
        id: Date.now(),
        date,
        outageTime,
        restoreTime,
        reason
    };

    outages.push(newCard);
    saveOutages(outages);

    res.json({ success: true, message: 'اطلاعات با موفقیت ثبت شد.' });
});

// ۳. ویرایش قطعی (جدید)
app.put('/api/outages/:id', (req, res) => {
    const { password, date, outageTime, restoreTime, reason } = req.body;
    const cardId = parseInt(req.params.id);

    if (password !== '9412') {
        return res.status(403).json({ success: false, message: 'رمز عبور اشتباه است.' });
    }

    let outages = getOutages();
    const index = outages.findIndex(item => item.id === cardId);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'کارت مورد نظر یافت نشد.' });
    }

    outages[index] = { id: cardId, date, outageTime, restoreTime, reason };
    saveOutages(outages);

    res.json({ success: true, message: 'کارت با موفقیت ویرایش شد.' });
});

// ۴. حذف قطعی
app.delete('/api/outages/:id', (req, res) => {
    const { password } = req.body;
    const cardId = parseInt(req.params.id);

    if (password !== '9412') {
        return res.status(403).json({ success: false, message: 'رمز عبور اشتباه است.' });
    }

    let outages = getOutages();
    outages = outages.filter(item => item.id !== cardId);
    saveOutages(outages);

    res.json({ success: true, message: 'کارت با موفقیت حذف شد.' });
});

app.listen(PORT, () => {
    console.log(`سرور روی پورت ${PORT} فعال شد.`);
});

// پینگ ۱۰ دقیقه‌ای بیدار نگه داشتن Render
const SITE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
setInterval(async () => {
    try {
        await fetch(SITE_URL);
    } catch (err) {}
}, 10 * 60 * 1000);
