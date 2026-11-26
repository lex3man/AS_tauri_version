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
bun install
```

Именно bun: в репозитории лежит `bun.lock`, и Tauri вызывает `bun run build`. `npm install` тоже соберёт рабочий `node_modules`, но версии разъедутся с локом.

## Подпись релиза

Релизная сборка подписывается всегда, параметры подписи читаются из `src-tauri/gen/android/keystore.properties`:

```
storeFile=/абсолютный/путь/к/upload-keystore.jks
keyAlias=<алиас ключа>
password=<пароль; используется и для хранилища, и для ключа>
```

Этот файл лежит в репозитории — он попал туда раньше, чем появилось правило в `.gitignore`, и правило на уже отслеживаемый файл не действует. **Пароль от хранилища ключей, таким образом, есть в истории git.** Если репозиторий станет доступен шире, чем сейчас, пароль надо менять вместе с ключом, а файл убирать из индекса (`git rm --cached`).

Сам `.jks` в репозиторий не входит и лежит по абсолютному пути из `storeFile`, вне проекта. На новой машине его нужно положить туда же или поправить путь.

Без `keystore.properties` Gradle падает ещё на конфигурации: `null cannot be cast to non-null type kotlin.String`.

**Ключ подписи менять нельзя** без понимания последствий:

- `device_id`, по которому сервер опознаёт устройство, — это `ANDROID_ID`, а он привязан к ключу подписи. Другой ключ → другой `device_id` → участник перестаёт находиться в активном соревновании, отчёты и коллекции сервер не примет.
- Этим же идентификатором шифруется хранилище на устройстве (см. ниже). После переподписи приложение не прочитает ранее сохранённое состояние и стартует с чистого листа.

## Сборка APK

```bash
bun run tauri android build --apk
```

Готовый файл — около 56 МБ:

```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

`universal` — все четыре ABI в одном файле, это то, что раздаётся участникам. Сборка с нуля занимает минут десять: Rust компилируется отдельно под каждую ABI.

| Команда | Что делает |
| --- | --- |
| `bun run tauri android build` | APK и AAB сразу |
| `bun run tauri android build --apk --split-per-abi` | отдельный APK на каждую ABI |
| `bun run tauri android build --apk --target aarch64` | только arm64, заметно быстрее |
| `bun run tauri android build --apk --debug` | отладочная сборка (разрешён cleartext-трафик, не минифицируется) |

Через npm то же самое, но флаги нужно отделить: `npm run tauri android build -- --apk`.

Проверить, что APK подписан нужным ключом:

```bash
$ANDROID_HOME/build-tools/35.0.0/apksigner verify --print-certs src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

`versionName` и `versionCode` считаются из `version` в `tauri.conf.json` — CLI записывает их в `app/tauri.properties`, этот файл руками не правят. При выпуске версию поднимают в трёх местах: `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.

Установка на подключённое устройство:

```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

## Секрет шифрования хранилища

Конфиг гонки с координатами точек, состояние приложения и слайды роадбука лежат на устройстве зашифрованными (AES-256-GCM). Ключ выводится на устройстве из идентификатора устройства и секрета, зашитого при компиляции. По умолчанию берётся запасное значение из кода; для боевой сборки секрет задаётся переменной окружения:

```bash
AS_STORAGE_SECRET='строка-секрета' bun run tauri android build --apk
```

Смена секрета делает нечитаемыми данные, сохранённые прежними сборками. Приложение не упадёт — оно стартует с настройками по умолчанию, но код этапа придётся активировать заново. Поэтому секрет меняют между соревнованиями, а не в середине.

Если значение поменяли, а бинарник не пересобрался:

```bash
cargo clean -p adventuresmart --manifest-path src-tauri/Cargo.toml
```

## Разработка

```bash
bun run tauri android dev
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
- **`could not write output to .../target/... No such file or directory`** — каталог `src-tauri/target` исчез прямо во время сборки. Так ведут себя «чистильщики диска» вроде CleanMyMac: `node_modules`, `target` и каталог с именем `gen` они считают мусором разработчика и сносят по расписанию, вместе с исходниками Android-проекта. Проект нужно внести в исключения чистильщика; восстановить отслеживаемые файлы после такого можно через `git checkout -- src-tauri/gen/android`, а зависимости — через `bun install`.
