# 🌙 دليل تشخيص الثيم الرمضاني

## خطوات التشخيص السريع

### 1. افتح Console (F12)
ابحث عن هذه الرسائل:

```javascript
🌙 Fetching Ramadan theme from: http://localhost:4000/api/admin/theme/ramadan
🌙 Ramadan theme response: {success: true, enabled: true}
🌙 Ramadan theme enabled: true
✅ Added ramadan-theme class to HTML
🌙 HTML classes on mount: ramadan-theme
```

### 2. تأكد من HTML Class
في Console اكتب:
```javascript
document.documentElement.classList
```
يجب أن تجد `ramadan-theme`

### 3. تأكد من CSS Variables
في Console اكتب:
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--ramadan-primary')
```
يجب أن يعيد: `#7440e9`

### 4. اختبار بسيط
افتح `http://localhost:5173/test-ramadan-theme.html`

## الإصلاحات المطبقة

✅ تحديث `RamadanThemeContext.jsx` - إضافة console.log
✅ تحديث API URL مع fallback
✅ توحيد `isRamadanThemeActive` في كل الصفحات
✅ إنشاء ملف اختبار

## إذا لم يظهر الثيم

### الحل 1: Force Refresh
```javascript
// في Console
localStorage.clear();
location.reload(true);
```

### الحل 2: تفعيل يدوي
```javascript
// في Console
document.documentElement.classList.add('ramadan-theme');
```

### الحل 3: فحص API
```bash
curl http://localhost:4000/api/admin/theme/ramadan
```
يجب أن يعيد: `{"success":true,"enabled":true}`

## الملفات المهمة

- `frontend/src/context/RamadanThemeContext.jsx` - Context الثيم
- `frontend/src/styles/ramadan-theme.css` - CSS Variables
- `frontend/src/styles/ramadan-patterns.css` - الزخارف
- `frontend/public/assets/islamic-patterns/*.svg` - ملفات الزخارف

## المشكلة الشائعة

إذا كان API يعيد `enabled: true` لكن الثيم لا يظهر:
1. تأكد من تحميل ملفات CSS في `App.jsx`
2. تأكد من أن `RamadanThemeProvider` يغلف التطبيق
3. افحص Console للأخطاء

## الألوان المستخدمة

- Primary: `#7440e9` (بنفسجي)
- Gold: `#d4af37` (ذهبي)
- Background: `#f7f6fb` → `#f3edff` → `#e9e4f5` (تدرج فاتح)

