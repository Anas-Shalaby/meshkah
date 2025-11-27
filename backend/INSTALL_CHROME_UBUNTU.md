# تثبيت Google Chrome على Ubuntu 24.04

## الطريقة 1: تثبيت Google Chrome (موصى به)

```bash
# تحديث قائمة الحزم
sudo apt-get update

# تثبيت الحزم المطلوبة
sudo apt-get install -y wget gnupg

# إضافة مفتاح GPG لـ Google
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -

# إضافة مستودع Google Chrome
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list

# تحديث قائمة الحزم مرة أخرى
sudo apt-get update

# تثبيت Google Chrome
sudo apt-get install -y google-chrome-stable

# التحقق من التثبيت
google-chrome --version
```

## الطريقة 2: تثبيت Chromium (أخف وأسرع)

```bash
# تحديث قائمة الحزم
sudo apt-get update

# تثبيت Chromium
sudo apt-get install -y chromium-browser

# التحقق من التثبيت
chromium-browser --version
```

## الطريقة 3: تثبيت Chromium من Snap (أسهل)

```bash
sudo snap install chromium
```

## بعد التثبيت

بعد تثبيت Chrome أو Chromium، يمكنك:

1. **تعيين متغير البيئة** (اختياري):

```bash
# للـ Google Chrome
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# أو للـ Chromium
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

2. **إضافة المتغير إلى ملف البيئة** لجعله دائم:

```bash
echo 'export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable' >> ~/.bashrc
source ~/.bashrc
```

3. **إعادة تشغيل التطبيق**:

```bash
pm2 restart index
```

## ملاحظات مهمة

- **Google Chrome** أكبر حجماً لكنه أكثر استقراراً
- **Chromium** أخف وأسرع لكن قد يحتاج تحديثات أكثر
- بعد التثبيت، الكود سيجد Chrome تلقائياً في المسارات الشائعة

## التحقق من المسار

للعثور على مسار Chrome المثبت:

```bash
which google-chrome-stable
# أو
which chromium-browser
```
