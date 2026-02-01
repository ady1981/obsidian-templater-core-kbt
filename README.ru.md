# Пример установки и использования
## Установка
* установить Obsidian и Templater-плагин
* установить, настроить env-параметры и запустить сервер AI-функций (например, через docker)
* настроить obsidian-templater-core-kbt для Obsidian Templater:
    - скачать репозиторий [obsidian-templater-core-kbt](https://github.com/ady1981/obsidian-templater-core-kbt) в папку. Обозначим путь к этой папке как OBS_CORE_KBT.
    - обозначим директорию с рабочим Obsidian vault как KNOWLEDGE
    - для настройки теймплетов нужно:
        * скопировать содержимое папки `$OBS_CORE_KBT/src` в папку `$KNOWLEDGE/_scripts` (или создать ссылку)
        * скопировать содержимое папки `$OBS_CORE_KBT/templates` в папку `$KNOWLEDGE/_templates` (или создать ссылку)
        * в конфиге плагина Templater в Obsidian: в значении `User script functions / script files folder location` указать `_scripts`
        * в конфиге плагина Templater в Obsidian: в значении `Template folder location` указать `_templates`

## Пример использования
* создать новый документ в Obsidian vault - `geography.md`
* в документе написать вопрос: "Столица России"
* выделить текст
* вызвать кастомный теймплейт через команду в Obsidian: `Templater: Open insert template modal → factual_qa`. После вычисления теймплейта в активный документ вставится результат генерации:
```
Столица России
- Столицей России является Москва.
  - [reference.1:: Общеизвестный географический факт // internal knowledge]
```