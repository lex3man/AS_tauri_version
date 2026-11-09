# AdventureSmart

Навигация и хронометраж для ралли-рейдов. Android-приложение на Tauri 2: бэкенд на Rust, интерфейс на React + TypeScript.

- `src/` — интерфейс (React, Vite, Tailwind)
- `src-tauri/` — бэкенд на Rust: состояние гонки, GPS, отчёты, шифрование хранилища
- `src-tauri/gen/android/` — Gradle-проект, сгенерированный Tauri и доработанный вручную (подпись, ProGuard, манифест). Он лежит в репозитории, `tauri android init` заново выполнять не нужно — это затрёт правки

## Что нужно на машине сборки

| Инструмент | Версия | Зачем |
| --- | --- | --- |
| Node.js | 22+ | npm-скрипты и Tauri CLI |
| Bun | 1.3+ | `beforeBuildCommand` в `tauri.conf.json` — это `bun run build`. Без bun сборка падает ещё до Gradle |
| Rust | stable (текущая сборка — 1.99) | бэкенд |
| Android SDK | compileSdk 36 + build-tools | |
| Android NDK | 29.0.14033849 (r29) | кросс-компиляция Rust под Android |
| JDK | 17+ | Gradle 9.6.1 и AGP 9.3.1. Подходит JBR из Android Studio |

Таргеты Rust:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

Переменные окружения (в `~/.zshrc`):

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/29.0.14033849"
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

Зависимости фронтенда ставятся один раз:

```bash
npm install
```

## Подпись релиза

Релизная сборка подписывается всегда, параметры подписи читаются из `src-tauri/gen/android/keystore.properties`. Файл в `.gitignore` и в репозиторий не попадает — на новой машине его нужно создать рядом с `gradlew`:

```
storeFile=/абсолютный/путь/к/adventuresmart.jks
keyAlias=<алиас ключа>
password=<пароль; используется и для хранилища, и для ключа>
```

Без этого файла Gradle падает ещё на конфигурации: `null cannot be cast to non-null type kotlin.String`.

**Ключ подписи менять нельзя** без понимания последствий:

- `device_id`, по которому сервер опознаёт устройство, — это `ANDROID_ID`, а он привязан к ключу подписи. Другой ключ → другой `device_id` → участник перестаёт находиться в активном соревновании, отчёты и коллекции сервер не примет.
- Этим же идентификатором шифруется хранилище на устройстве (см. ниже). После переподписи приложение не прочитает ранее сохранённое состояние и стартует с чистого листа.

## Сборка APK

```bash
npm run tauri android build -- --apk
```

Готовый файл:

```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

`universal` — все четыре ABI в одном файле, это то, что раздаётся участникам.

| Команда | Что делает |
| --- | --- |
| `npm run tauri android build` | APK и AAB сразу |
| `npm run tauri android build -- --apk --split-per-abi` | отдельный APK на каждую ABI |
| `npm run tauri android build -- --apk --target aarch64` | только arm64, заметно быстрее |
| `npm run tauri android build -- --apk --debug` | отладочная сборка (разрешён cleartext-трафик, не минифицируется) |

`versionName` и `versionCode` считаются из `version` в `tauri.conf.json` — CLI записывает их в `app/tauri.properties`, этот файл руками не правят. При выпуске версию поднимают в трёх местах: `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.

Установка на подключённое устройство:

```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

## Секрет шифрования хранилища

Конфиг гонки с координатами точек, состояние приложения и слайды роадбука лежат на устройстве зашифрованными (AES-256-GCM). Ключ выводится на устройстве из идентификатора устройства и секрета, зашитого при компиляции. По умолчанию берётся запасное значение из кода; для боевой сборки секрет задаётся переменной окружения:

```bash
AS_STORAGE_SECRET='строка-секрета' npm run tauri android build -- --apk
```

Смена секрета делает нечитаемыми данные, сохранённые прежними сборками. Приложение не упадёт — оно стартует с настройками по умолчанию, но код этапа придётся активировать заново. Поэтому секрет меняют между соревнованиями, а не в середине.

Если значение поменяли, а бинарник не пересобрался:

```bash
cargo clean -p adventuresmart --manifest-path src-tauri/Cargo.toml
```

## Разработка

```bash
npm run tauri android dev
```

Собирает отладочную версию, ставит её на подключённое по USB устройство (нужна включённая отладка по USB) и держит hot-reload интерфейса.

Только интерфейс, в браузере, без Android:

```bash
bun run dev
```

Часть экранов в браузере работать не будет — всё, что ходит в GPS, в хранилище и в плагины Tauri, живёт только на устройстве.

## Проверки перед сборкой

```bash
cargo test --manifest-path src-tauri/Cargo.toml --lib
```

```bash
npx tsc --noEmit
```

`roadbook::load_images_test` скачивает слайды с `advsmart.net` — без сети он упадёт.

## Если сборка падает

- **`bun: command not found`** — Tauri запускает `bun run build` из `tauri.conf.json`. Поставьте bun или поменяйте `beforeBuildCommand` на `npm run build`.
- **`null cannot be cast to non-null type kotlin.String`** — нет `src-tauri/gen/android/keystore.properties` или в нём не хватает ключа.
- **NDK не найден** — не задан `NDK_HOME`, либо версия в SDK отличается от указанной в переменной.
- **`error: linker ... not found` или таргет не собирается** — проверьте, что `cargo` берётся из rustup, а не из Homebrew: `which -a cargo` должен первым показать `~/.cargo/bin/cargo`. Homebrew-овский Rust не умеет android-таргеты.
- **Gradle подобрал мусор из прошлой сборки** — `cd src-tauri/gen/android && ./gradlew clean`, затем собрать заново.
