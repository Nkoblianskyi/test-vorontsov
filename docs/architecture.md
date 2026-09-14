# Архитектура

## Слои (Feature-Sliced)

```
src/
  app/                          маршруты: только сборка экранов
    (workspace)/                с сайдбаром: invoices, templates, settings
    (editor)/                   полноэкранные редакторы
  views/                        экраны-страницы (список, галерея, настройки)
  widgets/app-shell/            сайдбар и навигация
  features/
    invoice-editor/             генератор счёта
    template-editor/
      model/                    ОДНА модель редактора для обоих UI
      ui/studio/                собственная реализация
      ui/reference/             реализация 1:1 (CSS-модуль)
  entities/
    invoice/                    схема, стор, расчёт сумм, статусы, лист (Classic / Swiss)
    template/                   схема, пресеты, метаданные полей, стор, логотип
    company/                    реквизиты продавца и умолчания
  shared/                       UI-примитивы, форматирование, даты, цвет, хранилище
```

Импорты идут только сверху вниз: `app → views → widgets → features → entities → shared`.

## Модель данных

### Шаблон — `TemplateConfig` (`entities/template/model/schema.ts`)

```ts
{
  name, design: "classic" | "swiss",
  primaryColor, secondaryColor, inkColor, paperTint,
  logo: { show, src, monogram, shape, size },
  typeface, typeScale, headerLayout, ruleWeight, density, accentBand,
  payments: { bankTransfer: { enabled, details }, card: { enabled }, paypal: { enabled, email } },
  content: {
    documentTitle, dateFormat,
    fields: Record<ContentFieldKey, { show, label }>,   // 21 элемент листа
    terms, statement,                                  // тексты по умолчанию для новых счетов
  },
}
```

**Одна zod-схема — три потребителя:**

1. форма (`zodResolver`);
2. сохранение в сторе;
3. тип TypeScript.

Поле, добавленное в схему, не может обойти валидацию ни на одном пути.

Какие поля можно скрыть, а какие нет, а также под каким названием они показаны в редакторе, описано в `content-fields.ts`. Оба редактора строят вкладку Content из этого списка.

### Счёт — `InvoiceInput` (`entities/invoice/model/schema.ts`)

```ts
{
  number, status: "draft" | "sent" | "paid" | "void", templateId, currency,
  issueDate, dueDate, reference,
  customer: { name, email, address, taxId },
  items: { id, name, description, quantity, rate }[],
  discount: { type: "percent" | "amount", value },
  taxes: { id, name, rate }[], amountPaid,
  terms, statement,
}
```

Кросс-полевые правила задаются в `superRefine`:

- дата оплаты не раньше даты выставления;
- скидка в процентах не больше 100;
- уже оплаченная сумма не больше итога.

Уникальность номера проверяется при сохранении, потому что зависит от других записей.

**Статус для отображения** (`lib/status.ts`) вычисляется из сохранённого статуса, остатка и даты: `draft`, `sent`, `partial`, `overdue`, `paid`, `void`.

## Хранение

Три zustand-стора с `persist` в `localStorage`: `invoice-studio:templates`, `:invoices`, `:company`.

- `browserStorage` (`shared/lib/storage.ts`) никогда не бросает исключений. Приватный режим или переполненная квота превращаются в «не сохранилось» и тост.
- **Гидратация.** Данные есть только в браузере, поэтому экраны оборачиваются в `ClientGate`. До гидратации рендерится скелетон — ни рассинхронизации SSR, ни мигания пустых значений.
- **Демо-данные** счетов датируются относительно сегодняшнего дня, поэтому «просрочено» и «через 9 дней» верны при любом запуске.

**Как подключить бэкенд.** Методы сторов (`create`, `update`, `remove`, `markPaid` …) — единственное место записи. Их можно заменить на вызовы API: REST, tRPC или server actions. Компоненты вызывают те же методы и не меняются.

## Рендеринг листа

```
TemplateConfig ─┐
                ├─► InvoiceDocument ─► ClassicDocument (CSS-модуль, em)
Invoice data  ──┘                    └► SwissDocument   (CSS-переменные, мм)
```

- `InvoiceDocument` — чистый компонент без клиентского кода. Один и тот же компонент рисует превью в генераторе, оба редактора шаблона, миниатюры в галерее и печать.
- **Конфиг превращается в CSS-переменные** (`--c-primary`, `--doc-rule-width`, `--doc-pad` …). Смена цвета перекрашивает лист через CSS, а не пересобирает дерево.
- `toDocumentData(invoice, company, { placeholders })` отделяет данные листа от формы. Недописанные поля превращаются в серые заглушки.
- **A4 в реальных единицах.** `ScaledSheet` рисует лист шириной 210 мм и масштабирует через `transform`. Рамка резервирует масштабированный размер, чтобы прокрутка была честной. При печати `data-print` атрибуты и `@page { size: A4 }` убирают интерфейс и масштаб.

## Деньги

`computeTotals` (`entities/invoice/lib/totals.ts`):

1. строка = `qty × rate`, округление до центов;
2. скидка — процент от subtotal или фиксированная сумма, не больше subtotal;
3. налоги считаются от суммы после скидки, каждый округляется;
4. total = net + налоги; balance = total − paid.

Округление на каждом шаге делается так же, как суммы печатаются, поэтому строки на листе всегда складываются в итог на листе.

- Недописанные значения (пустое поле → `NaN`) считаются нулём, превью не ломается.
- Скрытие строки в шаблоне («Hiding a line never changes the amounts») не меняет суммы. Шаблон управляет видом, а не деньгами.
- Суммы в разных валютах в KPI не складываются.

## Редактор шаблона

`TemplateEditorProvider` (`features/template-editor/model`) используется обоими UI:

- react-hook-form с zod-резолвером, `mode: "onChange"`;
- **история** — стек снимков с дебаунсом 400 мс, до 60 шагов. Undo/redo переписывает форму через `reset`, и флаг `replaying` не даёт записать это как новое изменение;
- **dirty** — структурное сравнение с последним сохранённым снимком (`deepEqual`, без сериализации мегабайтных data-URL логотипа);
- `save()` валидирует форму, пишет в стор, при ошибке переключает на нужную вкладку и показывает первую ошибку;
- `beforeunload` при несохранённых изменениях; `Ctrl+S`, `Ctrl+Z` / `Ctrl+Shift+Z` (кроме текстовых полей).

## Качество

- `npm run typecheck`: TypeScript strict, без ошибок.
- `npm run lint`: eslint (next/core-web-vitals + typescript), без ошибок и предупреждений.
- `npm run build`: production-сборка Next.js 16 проходит.

### Ручной чек-лист

- [ ] Reference: смена цвета, названия, логотипа отражается в превью; Save закрывает; Cancel с изменениями спрашивает.
- [ ] Studio: пресет меняет вид и не трогает тексты; undo/redo; Ctrl+S; выбор реального счёта в превью.
- [ ] Генератор: сумма строки, скидка, налоги, предоплата; итоги в форме равны итогам на листе.
- [ ] Генератор: занятый номер, дата оплаты раньше даты выставления, пустое имя клиента — ошибки на месте.
- [ ] Печать: на странице только лист A4.
- [ ] Список: фильтры, поиск, «оплачен» из строки, дублирование, удаление с подтверждением.
- [ ] Шаблоны: нельзя удалить шаблон по умолчанию; удаление используемого переносит счета на шаблон по умолчанию.
- [ ] Тёмная тема: интерфейс тёмный, лист остаётся светлым.
- [ ] Мобильная ширина: переключатель Edit / Preview в редакторах.
