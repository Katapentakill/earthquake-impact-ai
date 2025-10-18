# Guía de Inicio Rápido

## 1. Obtener Token de Hugging Face (GRATIS)

1. Ve a: https://huggingface.co/join
2. Crea una cuenta (email + contraseña)
3. Ve a: https://huggingface.co/settings/tokens
4. Click en "New token"
5. Dale un nombre (ej: "seismic-system")
6. Selecciona tipo: "Read"
7. Click "Generate"
8. **Copia el token** (comienza con `hf_...`)

## 2. Configurar el Sistema

1. Abre el archivo `.env` en el proyecto:
   ```bash
   notepad .env
   ```

2. Reemplaza `your_token_here` con tu token:
   ```env
   HUGGINGFACE_API_TOKEN=hf_tu_token_aqui_muy_largo
   ```

3. Guarda y cierra el archivo

## 3. Iniciar el Sistema

### Opción A: Usando el script (Recomendado)
```bash
start.bat
```

### Opción B: Manual
```bash
docker-compose up -d
```

## 4. Acceder a la Aplicación

Espera ~30 segundos y abre en tu navegador:

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Backend**: http://localhost:8000

## 5. Verificar que Funciona

1. Abre http://localhost:3000
2. Deberías ver un mapa mundial
3. En el lado derecho verás eventos recientes
4. Click en cualquier evento para ver su impacto

## 6. Detener el Sistema

```bash
stop.bat
```

O manualmente:
```bash
docker-compose down
```

## Problemas Comunes

### "Docker is not running"
→ Inicia Docker Desktop y espera a que el ícono en la barra de tareas esté verde

### "Token inválido"
→ Verifica que copiaste el token completo (empieza con `hf_`)

### "No aparecen eventos"
→ El sistema toma sismos de magnitud >= 4.5. Espera unos minutos o ajusta el filtro de magnitud mínima

### Puerto ocupado
Si el puerto 3000 o 8000 está ocupado, edita `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Cambiar 3000 por otro puerto
```

## Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs -f backend

# Reiniciar un servicio
docker-compose restart backend

# Ver estado de servicios
docker-compose ps

# Acceder a la base de datos
docker-compose exec db mysql -u seismic_user -pseismic_password_2025 seismic_db
```

## Próximos Pasos

1. Explora los filtros en el panel izquierdo
2. Revisa las estadísticas en la API: http://localhost:8000/api/events/stats/summary
3. Lee el README.md completo para configuración avanzada
4. Personaliza el modelo de IA en `.env` (variable `HUGGINGFACE_MODEL`)

## Soporte

Si algo no funciona:
1. Revisa los logs: `docker-compose logs`
2. Verifica que Docker esté corriendo
3. Asegúrate de tener internet (para acceder a USGS y Hugging Face)
4. Reinicia todo: `docker-compose down && docker-compose up -d`
