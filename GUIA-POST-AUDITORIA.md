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
- [ ] Verificar que un coach no pueda ver datos de atletas no vinculados
- [ ] Verificar que `updateUserRole` solo permita `athlete`/`advanced_athlete`
- [ ] Verificar que `deleteUser` solo elimine atletas vinculados al coach
- [ ] Verificar que `getAllUsers` solo retorne atletas del coach autenticado
- [ ] Verificar que `linkWithCoach` requiera un código de invitación (vs UID directo)
- [ ] Verificar que los custom claims se asignan correctamente al registrarse

### Validación
- [ ] Verificar que `logWorkoutSession` rechace datos inválidos con Zod
- [ ] Verificar que `updateRoutine` rechace datos inválidos con Zod
- [ ] Verificar que los errores de validación incluyan mensajes descriptivos

### IA
- [ ] Verificar que inputs con caracteres especiales no rompan los prompts
- [ ] Verificar que la caché de Vivi (5 min) funcione correctamente
- [ ] Verificar que `sanitizeForAI` trunque inputs > 500 caracteres

### Build
- [ ] Verificar que `next build --webpack` compile sin errores
- [ ] Verificar que `revalidateTag` siempre use 2 argumentos en Next.js 16.1.6

---

## Pendientes No Abordados (Próximas Iteraciones)

1. **Custom claims en middleware/rules** — Los claims se asignan ahora en `registerUser()` y `updateUserRole()`, pero las Firestore rules aún dependen del fallback de lectura del documento `users/{uid}`. Se recomienda actualizar `firestore.rules` para usar `request.auth.token.role`.
2. **`linkWithCoach()`** — Actualmente usa el UID del coach como código. Riesgo bajo si los UIDs no son adivinables, pero se recomienda implementar códigos de invitación generados por el coach.
3. **Rate limiting en server actions** — Las server actions no tienen protección contra abuso (Vercel Hobby no tiene built-in). Considerar implementar rate limiting manual o migrar a Pro.
4. **Monitoreo de errores** — No hay sistema de monitoreo (Sentry, etc.) para tracking de errores en producción.
