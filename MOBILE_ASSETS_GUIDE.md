# Guía de Configuración de Iconos y Splash Screen

Para generar los iconos de Android e iOS en este proyecto de CORA, sigue estos pasos:

## 1. Requisitos de Imagen
Crea una carpeta `/assets` en la raíz del proyecto con:
- `icon-only.png` (1024x1024) - Icono general.
- `icon-foreground.png` y `icon-background.png` - Para iconos adaptativos de Android.
- `splash.png` (2732x2732) - Pantalla de carga.

## 2. Generación automática
Una vez tengas los archivos en la carpeta `assets`, la herramienta se encarga de distribuirlos en las carpetas nativas (`android/` e `ios/`).

El comando estándar (fuera de este editor) sería:
```bash
npx @capacitor/assets generate
```

## 3. Ubicación Manual (Si prefieres no usar la herramienta)
Si decides hacerlo manualmente, los archivos se encuentran en:

### iOS
`ios/App/App/Assets.xcassets/AppIcon.appiconset`

### Android
`android/app/src/main/res/` (carpetas mipmap y drawable)

---
**Nota:** Asegúrate de haber ejecutado primero `npx cap add ios` y `npx cap add android` para que las carpetas nativas existan antes de generar los assets.