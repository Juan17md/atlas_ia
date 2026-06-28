# Guía Post-Auditoría — Atlas IA

## Resumen de Hallazgos y Correcciones

### Seguridad y Control de Acceso

| Hallazgo | Gravedad | Acción Tomada |
|----------|----------|---------------|
| `getTrainingLogs()` expone datos sin verificar coach-atleta | **Crítica** | Agregada `verifyCoachAccess()` antes de retornar logs |
| `getWeeklyActivity()` sin filtro por relación coach-atleta | **Crítica** | Agregada `verifyCoachAccess()` |
| `getWeeklyProgress()` sin filtro por relación coach-atleta | **Crítica** | Agregada `verifyCoachAccess()` |
| `getPersonalRecords()` sin filtro por relación coach-atleta | **Crítica** | Agregada `verifyCoachAccess()` |
| `getStrengthProgress()` sin filtro por relación coach-atleta | **Crítica** | Agregada `verifyCoachAccess()` |
| `getStrengthHistory()` sin filtro por relación coach-atleta | **Crítica** | Agregada `verifyCoachAccess()` |
| `analyzeAthleteProgress()` sin filtro + retorna `success: true` en catch | **Crítica** | Agregado `verifyCoachAccess()` + `success: false` en catch |
| `getAllUsers()` expone todos los usuarios del sistema | **Alta** | Filtrado por `coachId` del coach autenticado |
| `updateUserRole()` permite cambiar rol a cualquiera | **Alta** | Restringido a solo `athlete`/`advanced_athlete` + verifica coach-atleta |
| `deleteUser()` permite eliminar cualquier usuario | **Alta** | Verifica coach-atleta antes de eliminar |
| `logWorkoutSession()` sin validación Zod en production | **Crítica** | Agregado `WorkoutSessionSchema.safeParse()` |
| `updateRoutine()` sin validación Zod | **Alta** | Agregado `RoutineSchema.partial().safeParse()` |

### Firebase Auth Custom Claims

| Hallazgo | Gravedad | Acción Tomada |
|----------|----------|---------------|
| `registerUser()` no asigna custom claims al usuario | **Alta** | Agregado `adminAuth.setCustomUserClaims(uid, { role })` |
| `updateUserRole()` actualiza Firestore pero no los claims del token | **Alta** | Agregado `adminAuth.setCustomUserClaims(uid, { role: newRole })` |

### Prompt Injection en IA

| Hallazgo | Gravedad | Acción Tomada |
|----------|----------|---------------|
| `chatWithCoachAI()` — `message` interpolado sin sanitizar | **Alta** | Aplicado `sanitizeForAI()` |
| `suggestSubstitute()` — `exerciseName` interpolado sin sanitizar | **Alta** | Aplicado `sanitizeForAI()` |
| `generateExerciseDetails()` — `exerciseName` interpolado sin sanitizar | **Alta** | Aplicado `sanitizeForAI()` |
| `generateRoutineWithAI()` — `userPrompt` interpolado sin sanitizar | **Alta** | Aplicado `sanitizeForAI()` |
| `chatWithAI()` — historial de mensajes enviado sin sanitizar | **Alta** | Aplicado `sanitizeForAI()` solo para mensajes `role: "user"` |
| `analyzeWorkoutSession()` — `sessionNotes` y `feedback` sin sanitizar | **Alta** | Aplicado `sanitizeForAI()` |
| `sanitizeForAI()` no exportada, solo usada internamente en `ai.ts` | **Media** | Agregado `export` |

### Performance y Caché

| Hallazgo | Gravedad | Acción Tomada |
|----------|----------|---------------|
| `analyzeViviIntelligence()` se ejecuta en cada mensaje del chat | **Media** | Cache de 5 minutos: verifica `lastAnalyzed` antes de re-analizar |
| `revalidateTag()` con 1 argumento en Next.js 16.1.6 (requiere 2) | **Media** | Corregidas todas las llamadas a `revalidateTag(tag, "default")` |

### UX y Estabilidad

| Hallazgo | Gravedad | Acción Tomada |
|----------|----------|---------------|
| Dashboard sin `error.tsx` — errores inesperados quedan sin manejo | **Media** | Agregado `error.tsx` con botón de reintento |
| `useEffect` en `workout-logger-context` sin cleanup (`getExercises()`) | **Media** | Agregado flag `isMounted` |
| `useEffect` en `workout-logger-context` usa `routineDay: any` | **Media** | Tipado como `ProviderRoutineDay` |

### Console Logs Residuales

| Hallazgo | Gravedad | Acción Tomada |
|----------|----------|---------------|
| `routine-actions.ts` — 9 `console.log` con prefijo `>>>` | **Baja** | Eliminados para evitar fuga de datos en logs de producción |

---

## Checklist de Verificación Post-Corrección

### Seguridad
- [x] Verificar que un coach no pueda ver datos de atletas no vinculados
- [x] Verificar que `updateUserRole` solo permita `athlete`/`advanced_athlete`
- [x] Verificar que `deleteUser` solo elimine atletas vinculados al coach
- [x] Verificar que `getAllUsers` solo retorne atletas del coach autenticado
- [x] Verificar que `linkWithCoach` requiera un código de invitación (vs UID directo)
- [x] Verificar que los custom claims se asignan correctamente al registrarse

### Validación
- [x] Verificar que `logWorkoutSession` rechace datos inválidos con Zod
- [x] Verificar que `updateRoutine` rechace datos inválidos con Zod
- [x] Verificar que los errores de validación incluyan mensajes descriptivos

### IA
- [ ] Verificar que inputs con caracteres especiales no rompan los prompts
- [ ] Verificar que la caché de Vivi (5 min) funcione correctamente
- [ ] Verificar que `sanitizeForAI` trunque inputs > 500 caracteres

### Build
- [x] Verificar que `next build --webpack` compile sin errores
- [x] Verificar que `revalidateTag` siempre use 2 argumentos en Next.js 16.1.6

---

## Pendientes Abordados

| Pendiente | Estado |
|-----------|--------|
| Custom claims en `registerUser()` y `updateUserRole()` | ✅ Implementado (`adminAuth.setCustomUserClaims`) |
| `firestore.rules` usar `request.auth.token.role` | ✅ Actualizado (sin fallback a `get()`) |
| `linkWithCoach()` con códigos de invitación | ✅ Implementado (código 8 chars, generado en registro) |
| Rate limiting en server actions | ✅ Implementado (en memoria, `src/lib/rate-limiter.ts`) |
| Monitoreo de errores (Sentry) | ✅ Configurado (falta `SENTRY_DSN` en `.env` para activar) |

## Pendientes Restantes

1. **Ejecutar `npx playwright install chromium` con conexión estable** — Los tests de login con Playwright requieren Chromium descargado. Alternativa: usar `scripts/verify-data.mjs` que verifica datos vía Firebase Admin SDK sin necesidad de navegador.
2. **Agregar `SENTRY_DSN` en `.env`** — Cuando se tenga cuenta en Sentry, descomentar variables en `.env` para activar crash reporting.
3. **Verificación manual de IA** — Probar inputs con caracteres especiales y verificar caché de Vivi (5 min) interactivamente.
4. **Migrar rate limiting a Redis** — Si la app escala, el rate limiting en memoria se pierde al reiniciar el servidor.

## Resultados de Verificación (2026-06-27)

### Tests de Datos (verify-data.mjs)
- ✅ Custom claims asignados correctamente para coach, atleta1, atleta2, avanzado
- ✅ Documentos Firestore existen con datos correctos
- ✅ Relaciones coach-atleta vinculadas en Firestore

### Tests de Login (Playwright)
- ✅ **Coach** — Login exitoso (`coach@test.com`)
- ✅ **Atleta** — Login exitoso (`atleta1@test.com`)
- ✅ **Avanzado** — Login exitoso (`avanzado@test.com`)
- Screenshots guardados en `/tmp/atlas-{role}.png`

### Build
- ✅ `next build --webpack` compila sin errores
