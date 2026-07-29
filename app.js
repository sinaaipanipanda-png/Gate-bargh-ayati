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

// خواندن اطلاعات از فایل ذخیره‌سازی
function getOutages() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
}

// ذخیره اطلاعات جدید
function saveOutages(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API دریافت کارت‌ها برای همه کاربران
app.get('/api/outages', (req, res) => {
    const outages = getOutages();
    res.json(outages);
});

// API ایجاد کارت جدید توسط مدیر (رمز 9412)
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

    res.json({ success: true, message: 'اطلاعات با موفقیت ثبت شد.', card: newCard });
});

// API حذف کارت
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

// روشن کردن سرور
app.listen(PORT, () => {
    console.log(`سرور روی پورت ${PORT} فعال شد.`);
});

// ==========================================
// کد پینگ خودکار هر ۱۰ دقیقه برای بیدار نگه‌داشتن Render
// ==========================================
const SITE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

setInterval(async () => {
    try {
        await fetch(SITE_URL);
        console.log('پینگ ۱۰ دقیقه‌ای انجام شد - سرور بیدار است.');
    } catch (err) {
        console.error('خطا در پینگ سرور:', err.message);
    }
}, 10 * 60 * 1000);
