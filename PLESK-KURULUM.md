# Masrafci Plesk Kurulumu

Bu proje artik Supabase kullanmaz. Uygulama tek bir Node.js servisi olarak calisir:

- `dist/` icindeki React arayuzu servis eder
- `server-dist/` icindeki Express API calisir
- verileri ayni sunucudaki PostgreSQL veritabanina yazar

## Git deposu

- Git SSH adresi: `git@github.com:ozalaksu/Harcama.git`
- Deploy key bu repo icin eklenmelidir

## 1. Sunucu gereksinimleri

- Plesk Node.js extension aktif olmali
- Sunucuda PostgreSQL kurulu olmali
- Node.js 20+ onerilir

## 2. PostgreSQL hazirligi

Ornek veritabani kurulumu:

```sql
CREATE DATABASE masrafci;
CREATE USER masrafci_user WITH PASSWORD 'guclu-bir-sifre';
GRANT ALL PRIVILEGES ON DATABASE masrafci TO masrafci_user;
```

Not:

- Tablolari ayrica olusturman gerekmez
- uygulama ilk acilista `events` ve `app_sessions` tablolarini otomatik olusturur

## 3. Proje ayari

Repoda ornek dosya olarak [`app.config.example.json`](C:/Masrafcı/app.config.example.json:1) bulunur.
Sunucuda bunu `app.config.json` olarak olusturup su icerikle kullanin:

```json
{
  "server": {
    "port": 3000
  },
  "auth": {
    "password": "617714Bocek",
    "sessionDurationDays": 30
  },
  "database": {
    "host": "127.0.0.1",
    "port": 5432,
    "database": "payadmin",
    "user": "kahyaburak",
    "password": "617714Bocek",
    "ssl": false,
    "maintenanceDatabase": "postgres"
  }
}
```

Gercek `app.config.json` dosyasi repoya gonderilmez; sunucuda yerel olarak tutulmalidir.

Uygulama acilisinda su akis otomatik calisir:

- once `payadmin` veritabaninin varligini kontrol eder
- yoksa `postgres` bakim veritabanina baglanip `payadmin` veritabanini olusturmayi dener
- sonra gerekli tablolari otomatik olusturur

Not:

- bunun calismasi icin `kahyaburak` kullanicisinda veritabani olusturma yetkisi olmali
- yetki yoksa Plesk tarafinda kullaniciya `CREATEDB` benzeri yetki verilmeden uygulama bunu asamaz

## 4. Plesk Node.js ayari

Plesk icinde alan adinizda su degerleri kullanin:

- Application Root: proje kok dizini
- Document Root: `dist`
- Application Startup File: `server-dist/index.js`
- Application Mode: `production`

Ardindan sirayla:

```bash
npm install
npm run build
```

Sonra Plesk uzerinden Node.js uygulamasini `Restart App` ile baslatin.

## 5. GitHub deploy key

GitHub repo:

- `ozalaksu/Harcama`

GitHub'da repo icinde:

1. `Settings`
2. `Deploy keys`
3. `Add deploy key`

Title onerisi:

- `plesk-paylas-keyifcin-com`

Key alanina su public key eklenir:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIA3dLhaFpkQNzpYt/AeVsMZ3vKrk7WzL/RHHpAteEZ7Y plesk-deploy-key-paylas.keyifcin.com
```

Yazma ihtiyaci yoksa `Allow write access` kapali kalsin.

Plesk Git alani icin repository URL:

```text
git@github.com:ozalaksu/Harcama.git
```

Sunucuda private key olarak su dosya kullanilir:

- [github_plesk_ed25519](C:/Masrafcı/deploy-keys/github_plesk_ed25519:1)

Not:

- `deploy-keys/` klasoru da repoya gonderilmez

## 6. Ilk kontrol

Uygulama kalktiginda su kontrolleri yapin:

1. Ana domain aciliyor mu
2. Giris ekrani geliyor mu
3. `https://alanadiniz/api/health` cevabi `{\"ok\":true}` donuyor mu
4. Yeni etkinlik eklenebiliyor mu

## 7. Lokal gelistirme

```bash
npm install
npm run build
npm run dev:server
```

Frontend'i ayri gelistirmek istersen:

```bash
npm run dev
```

Bu durumda Vite gelistirme sunucusu sadece arayuzu calistirir; API icin ayrica `npm run dev:server` acik olmalidir.
