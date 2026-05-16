# GUÍA COMPLETA: DEPLOYMENT EN RAILWAY

## 📋 PRE-REQUISITOS
1. ✅ Cuenta Railway activa: https://railway.app (con GitHub conectado)
2. ✅ Backend pushed a tu fork: `https://github.com/LeonardoG2005/fluxlab-backend`
3. ✅ PostgreSQL database en Supabase (ya tienes credenciales en tu `.env`)

---

## 🚀 PASO 1: CREAR NUEVO PROYECTO EN RAILWAY

### 1a. Acceder a Railway Dashboard
- Ve a https://railway.app/dashboard
- Click **"New Project"**

### 1b. Conectar GitHub
- Selecciona **"Deploy from GitHub"**
- Si no está conectado GitHub, click "Configure GitHub" y autoriza Railway
- Busca tu fork: **`LeonardoG2005/fluxlab-backend`**
- Click **"Import"**

### 1c. Railway crea el servicio automático
- Railway detecta `Procfile` y `package.json`
- Crea un servicio llamado "backend" (o similar)
- **Status**: "Building..." → espera a que compile

---

## ⚙️ PASO 2: CONFIGURAR VARIABLES DE ENTORNO

### 2a. Ir a Variables del Servicio
- En el dashboard de tu proyecto, click en el servicio **"backend"**
- Pestaña **"Variables"**

### 2b. Agregar variables (REQUERIDAS para producción)

Copia estos valores desde tu Supabase:

```
NODE_ENV                  = production
PORT                      = (dejar vacío o 3000 - Railway lo sobrescribe)
HOST                      = 0.0.0.0
DATABASE_URL              = postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require
SUPABASE_PROJECT_ID       = tu-project-id
SUPABASE_URL              = https://tu-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc... (copia del .env local)
DB_SSL                    = true
SWAGGER_ENABLED           = false
CORS_ORIGINS              = (dejarlo para después cuando tengas URL de Vercel)
```

### 2c. Buscar DATABASE_URL en Supabase
**Si no tienes `DATABASE_URL` listo:**
- Ve a https://supabase.com → Tu Proyecto → Settings → Database → Connection String
- Copia la URL con tu password
- Formato: `postgresql://postgres.XXXXX:PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require`

---

## 🔌 PASO 3: (OPCIONAL) AGREGAR DATABASE EN RAILWAY

Railway puede provisionar PostgreSQL automático, pero tú ya usas Supabase.
**Recomendación: Saltate este paso, usa tu Supabase actual.**

Si quisieras PostgreSQL en Railway:
- Click "Add Plugin" → Selecciona PostgreSQL
- Pero esto complica: tendrías que migrar datos, cambiar credenciales
- **No lo recomiendo** en una auditoría de producción

---

## ✅ PASO 4: VERIFICAR DEPLOYMENT

### 4a. Esperar a que build & deploy complete
- Railway compila con `npm run build`
- Inicia con `npm run start:prod` (vía Procfile)
- Debe decir: ✓ "Successfully deployed"

### 4b. Obtener URL pública
- En el dashboard, ve al servicio "backend"
- Pestaña **"Settings"**
- Busca **"Domains"** o "Public URL"
- Debe verse algo como: `https://fluxlab-backend-production-xxxx.railway.app`
- **Cópialo, lo necesitarás para el frontend**

### 4c. Probar el health check
Abre en el navegador o terminal:
```bash
curl https://fluxlab-backend-production-xxxx.railway.app/api/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "uptime": 45.3,
  "timestamp": "2026-05-16T16:30:00.000Z"
}
```

Si ves error:
- ❌ Revisa **Logs** en Railway (pestaña "Logs")
- ❌ Busca `DATABASE_URL` o variables faltantes
- ❌ Verifica que `NODE_ENV=production` esté seteado

---

## 🔄 PASO 5: CONFIGURAR CORS PARA FRONTEND

**Una vez que el frontend esté deployed en Vercel:**

1. Ve a Railway → Tu servicio → Variables
2. Actualiza:
   ```
   CORS_ORIGINS = https://tu-app.vercel.app
   ```
3. Guarda y Railway redeploy automático

---

## 🐛 TROUBLESHOOTING

### Build falla
**Error**: `npm ERR! code EWORKSPACEMISMATCH`
- Limpia `package-lock.json` y re-push a GitHub
- Railway reinicia el build

**Error**: `TypeORM Error: Cannot connect to database`
- Verifica `DATABASE_URL` está correct (sslmode=require)
- Comprueba que Supabase está activo
- Revisa firewall: Supabase debe permitir ips de Railway

### App corre pero health devuelve 500
- Revisa logs: `Railway → Logs`
- Busca `SUPABASE_PROJECT_ID` o `SUPABASE_SERVICE_ROLE_KEY` faltantes
- Los JWT tokens fallan sin estas vars

### Todo ok pero rutas protected dan 401
**Normal**: Los endpoints requieren JWT Bearer token válido
- Usa `/api/health` y `/api/public` para testing sin auth
- Para otros endpoints, necesitas token de Supabase

---

## 📌 RESUMEN: CHECKLIST RAILWAY

- [ ] Fork pushed a GitHub (https://github.com/LeonardoG2005/fluxlab-backend)
- [ ] Railway proyecto creado desde GitHub
- [ ] Backend service compilando sin errores
- [ ] Variables de entorno seteadas (DATABASE_URL, SUPABASE_*)
- [ ] Build & Deploy: Status = "Success"
- [ ] Health check responde OK: `GET /api/health`
- [ ] Public route funciona: `GET /api/public` → `{ message: "Public route" }`
- [ ] Logs muestran: "API escuchando en http://0.0.0.0:PORT/api"
- [ ] URL pública de Railway obtenida (para frontend)

---

## 🚨 NOTAS CRÍTICAS

1. **NUNCA** expongas `SUPABASE_SERVICE_ROLE_KEY` en el frontend
   - Es solo para el backend
   - Vercel/frontend usará `SUPABASE_URL` + `SUPABASE_PUBLIC_KEY` (diferente)

2. **CORS**: Cuando uses frontend en Vercel, actualiza `CORS_ORIGINS`
   - Dev: `http://localhost:5173` (local)
   - Prod: `https://tu-app.vercel.app` (Vercel)

3. **Redeploys**: Cualquier cambio en variables o code:
   - Git push → Railway detecta cambios → Auto rebuild & deploy
   - O click "Trigger Deploy" en el dashboard

4. **Monitoreo**:
   - Pestaña "Logs" es tu mejor amigo
   - Busca `ERROR` o `Unhandled Exception`

---

## ✨ SI TODO VA BIEN

Cuando veas:
```
[Nest] 12345 - 16/05/2026, 4:30:00 p.m. LOG [NestApplication] 
Nest application successfully started +3ms
API escuchando en http://0.0.0.0:3000/api
```

**Backend en Railway está LISTO. 🎉**

Ahora podemos pasar a **FASE 2: Frontend en Vercel**.
