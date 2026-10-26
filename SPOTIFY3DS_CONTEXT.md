# Contexto: Spotify 3DS (reproductor MP3 para old 3DS)

Pega este archivo al inicio del chat nuevo. Objetivo: escribir desde cero el código fuente de un reproductor de música para Old Nintendo 3DS llamado **Spotify 3DS**, inspirado en MangoMusic pero más ligero. No existe código fuente de MangoMusic, así que NO se recompila nada: es un proyecto nuevo.

## Entorno del usuario
- El usuario tiene devkitPro/devkitARM, makerom y bannertool en su PC. El agente en la nube NO puede acceder a ellas.
- Entregable: proyecto C (libctru + citro2d/citro3d) con Makefile, que el usuario compila con `make` y empaqueta a `.cia`. Si falla, el usuario pega el error y se corrige.
- Rama de trabajo: `claude/beautiful-franklin-nxfc1y` del repo `fxangeel/animal_world_web`.
- Idioma: español.
- El usuario quiere usar una skill "REA" (análisis de ingeniería inversa); no estaba disponible en el chat anterior. Si esta sesión la tiene, úsala. Si no, pedir su SKILL.md.

## Análisis de MangoMusic (mangomusic.cia, 4,1 MB)
- Homebrew ctrulib. Título `MANGOMUSIC`, app SD, `.code` 1,8 MB sin comprimir, bss ~30 MB, stack 256 KB.
- Servicios pedidos: am:net, boss:U, cecd:u, cfg:nor, csnd:SND, dsp::DSP, frd:u, fs:USER, gsp::Gpu, gsp::Lcd, hid:USER, http:C, ir:rst, ir:USER, news:u, nwm::UDS, ptm:u, pxi:dev.
- Decodificadores incluidos: MP3, Opus, FLAC, WavPack, WAV, AAC; PNG/JPEG, zlib, HTTP, rastros de ffmpeg/AVI.
- RomFS (2,1 MB): iconos .t3x (download, searchweb, list, ecualizador, visual, menu, random, edit, delete, camara, drum, refresh, check), kick.mp3/snare.mp3 (drum pad), scene.gltf + scene.bin ("Mario Dancing" de cna101, CC-BY-4.0), license.txt, además de rutas `/3ds/dsp`.

## Funciones a conservar
Reproductor MP3, lista de reproducción, aleatorio, ecualizador, visualizador de audio (2D), descarga y búsqueda web, editar y borrar de la lista, refresh de biblioteca.

## Funciones a eliminar (decisión del usuario)
- Drum pad (pads táctiles, kick.mp3, snare.mp3, icono drum).
- Escena 3D "Mario Dancing" (pesada y con licencia que exige crédito).
- Cámara, y decodificadores distintos de MP3 (el usuario solo usa MP3).

## Plan técnico
- Decodificación MP3 con minimp3 (header-only) en un hilo aparte; salida por ndsp (necesita dspfirm.cdc en `/3ds/dspfirm.cdc`).
- Evitar el bss de 30 MB: buffers de audio pequeños (ring buffer), carga perezosa de portadas, texturas .t3x mínimas.
- UI con citro2d: pantalla superior = portada/visualizador; inferior = controles táctiles y lista. Tema oscuro verde estilo Spotify (sin usar logos ni marca registrada reales).
- Red solo con servicios necesarios (http:C / soc). Quitar servicios que no se usen del exheader (boss, cecd, news, ir, nwm, frd, cam).
- Banner e icono propios (48x48 icon, 256x128 banner), título "Spotify 3DS".
- Proyecto: `source/`, `romfs/`, `gfx/`, `Makefile`, `app.rsf`, y `README` con comandos de compilación: `make` → `.3dsx`, luego `bannertool` + `makerom` → `.cia`.

## Primer paso en el chat nuevo
1. Crear la estructura del proyecto en este repo (carpeta `spotify3ds/`).
2. Escribir main.c, audio (minimp3 + ndsp), UI y lista de reproducción; compilar mentalmente / revisar errores.
3. Dar al usuario los comandos exactos para compilar y generar el CIA.
