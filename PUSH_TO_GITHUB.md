# วิธี Push โปรเจกต์ AgentOps Dashboard ขึ้น GitHub

## 1) แตก zip แล้วเข้าโฟลเดอร์โปรเจกต์

```powershell
cd "C:\path\to\AgentOps Dashboard - Copy"
```

## 2) ติดตั้ง Git และล็อกอิน GitHub

```powershell
git --version
gh --version
gh auth login
```

เลือก:
- GitHub.com
- HTTPS
- Login with browser

## 3) สร้าง repo ใหม่บน GitHub และ push

เปลี่ยน `agentops-dashboard` เป็นชื่อ repo ที่ต้องการ:

```powershell
git init
git add .
git commit -m "Initial commit: AgentOps Dashboard"
gh repo create agentops-dashboard --private --source=. --remote=origin --push
```

ถ้าต้องการ repo public ให้ใช้:

```powershell
gh repo create agentops-dashboard --public --source=. --remote=origin --push
```

## 4) ถ้ามี repo อยู่แล้ว

เปลี่ยน URL เป็น repo ของคุณ:

```powershell
git init
git add .
git commit -m "Initial commit: AgentOps Dashboard"
git branch -M main
git remote add origin https://github.com/USERNAME/agentops-dashboard.git
git push -u origin main
```

## 5) หลัง push แล้วรันเว็บบนเครื่อง

```powershell
npm install
npm run dev
```

เปิด:

```text
http://localhost:3000
```

## หมายเหตุสำคัญ

ไฟล์ `.env` จริงห้าม push ขึ้น GitHub ให้ใช้ `.env.example` เป็นตัวอย่างเท่านั้น
