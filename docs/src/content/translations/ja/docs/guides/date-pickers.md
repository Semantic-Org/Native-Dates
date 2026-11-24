---
source: "9de557f3ce5d"
title: 日付ピッカーと UI
lede: ブラウザ標準の入力欄や日付ピッカーと Native Dates を連携させ、従来の Date を使うウィジェットを UI 境界に閉じ込めます。
---

アプリケーションの状態やドメインロジックでは、そのまま Native Dates の値を保持します。

ISO 文字列や JavaScript 標準の `Date` への変換は、ブラウザの入力要素やサードパーティ製ウィジェットがそれを要求するコンポーネントの境界だけに留めます。こうすることで、タイムゾーンのルールやカレンダー計算を UI ライブラリ特有のクセから切り離せます。

## ネイティブ HTML 入力

ネイティブの HTML 日付・時刻コントロールは標準の ISO 文字列をそのまま読み書きできます。ピッカーライブラリは不要で、タイムゾーンをまたいでカレンダー日付がずれることもありません。

| コントロール | 入力欄への書き込み | コアへの読み戻し |
|---|---|---|
| `<input type="date">` | `d.toString()` | 空でない文字列を [`date()`](/api/date-fn/) に渡し、タイムゾーンを持たないカレンダー日付を取得します。 |
| `<input type="time">` | `t.format('HH:mm')`（`step="1"` 指定時は `t.toString()`） | `value` を [`time()`](/api/time-fn/) に渡し、タイムゾーンを持たない時刻を取得します。 |
| `<input type="month">` | `ym.toString()` | `value` を [`yearMonth()`](/api/year-month-fn/) に渡し、請求月やカードの有効期限として扱います。 |
| `<input type="datetime-local">` | `dt.format('YYYY-MM-DDTHH:mm')` | `value` とタイムゾーンを [`datetime()`](/api/datetime-fn/) に渡し、特定の時点を作成します。 |

入力欄の値と上下限を状態にバインドし、変更された文字列を対応するファクトリで解析して戻します。

```js
import { date, time, today, yearMonth } from 'native-dates';

const due = date('2026-11-16');
const opens = time('9:30am');
const billing = yearMonth('2026-11');

// <input type="date" value={due.toString()} min={today().toString()}>
due.toString(); // '2026-11-16'

// <input type="time" value={opens.format('HH:mm')}>
opens.format('HH:mm'); // '09:30'

// <input type="month" value={billing.toString()}>
billing.toString(); // '2026-11'
```

フォームで日付と時刻を別々の入力欄から受け取る場合は、それぞれのコントロールを対応する型にバインドしたまま保ちます。特定の時点を組み立てるときに [`at()`](/api/calendar-date/#at) で結合します。

```js
const rawDate = '2026-11-16';
const rawTime = '09:30';

const day = rawDate ? date(rawDate) : null;
const clock = rawTime ? time(rawTime) : null;
const startsAt = day && clock ? day.at(clock, 'America/Los_Angeles') : null;

startsAt?.toString(); // '2026-11-16T17:30:00.000Z'
```

:::warning[解析前に空の入力をガードする]
HTML の入力欄をクリアすると空文字列が渡され、テキスト入力型のピッカーでは入力途中で無効な `Date` が渡されることがあります。コアのファクトリは暗黙に今日へフォールバックせずエラーをスローするため、呼び出す前に空の値や `NaN` を確認してください。
:::

## React Day Picker

React Day Picker は、選択された日付をローカルタイムゾーンの0時を表す JavaScript 標準の `Date` で表現します。状態には [`CalendarDate`](/api/calendar-date/) を保持し、props の境界で変換してください。

```jsx
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { date, today } from 'native-dates';

function DueDateField() {
  const [due, setDue] = useState(() => date('2026-11-16'));

  return (
    <DayPicker
      mode="single"
      selected={due?.toJSDate()}
      disabled={{ before: today().toJSDate() }}
      onSelect={(picked) => setDue(picked ? date(picked) : null)}
    />
  );
}
```

範囲選択では、変換処理を2つの小さなヘルパーにまとめ、状態として [`DateRange`](/api/ranges/) を保持します。ユーザーが選択途中のときは終了日が未定義だったり開始日と同じだったりするため、`picked.to ?? picked.from` にフォールバックして有効な範囲を保ちます。

```js
import { date, dateRange } from 'native-dates';

function toPickerRange(range) {
  if (!range) return undefined;
  return { from: range.start.toJSDate(), to: range.end.toJSDate() };
}

function fromPickerRange(picked) {
  if (!picked?.from) return null;
  return dateRange(date(picked.from), date(picked.to ?? picked.from));
}

const stay = dateRange('2026-11-16', '2026-11-20');
const pickerValue = toPickerRange(stay);
const restored = fromPickerRange(pickerValue);

restored.count('days'); // 5
restored.toString(); // '2026-11-16/2026-11-20'
```

デフォルトでは、[`toJSDate()`](/api/calendar-date/#tojsdate) と `date()` はブラウザのタイムゾーンに従います。[`configure()`](/api/configure/) でアプリのデフォルトタイムゾーンを上書きしている場合は、カレンダーグリッドの日付がずれないよう、両方の呼び出しにブラウザのタイムゾーンを渡してください。

```js
const host = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pickerDate = due.toJSDate(host);
const picked = date(pickerDate, host);
```

## MUI X と Date ベースのピッカー

`AdapterDateFns` を使う場合、MUI X Date Pickers は値と変更ハンドラーの props に JavaScript 標準の `Date` を受け渡します。アダプターは `LocalizationProvider` と薄いラッパーコンポーネントの内側に閉じ込め、レガシーな `Date` がアプリケーションの状態に漏れないようにします。

テキスト入力型のピッカーはキー入力ごとに変更ハンドラーを発火させ、入力途中では無効な `Date` を渡します。変換する前に `Number.isNaN()` で確認してください。

```jsx
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { date, today } from 'native-dates';

function CalendarDatePicker({ value, onChange, ...props }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        {...props}
        value={value ? value.toJSDate() : null}
        minDate={today().toJSDate()}
        onChange={(next) => {
          if (!next || Number.isNaN(next.getTime())) {
            onChange(null);
            return;
          }
          onChange(date(next));
        }}
      />
    </LocalizationProvider>
  );
}
```

日時ピッカーでも同じ境界ヘルパーを使い、返される時点のタイムゾーンがぶれないよう [`datetime()`](/api/datetime-fn/) に明示的な IANA タイムゾーンを渡します。

```js
import { datetime } from 'native-dates';

function fromPickerMoment(next, zone) {
  if (!next || Number.isNaN(next.getTime())) return null;
  return datetime(next, zone);
}

const meeting = fromPickerMoment(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
meeting.format('short', 'en-US'); // '11/16/26, 9:30 AM'
```

## フォームとスキーマバリデーション

React Hook Form や Zod のようなフォームツールでは、編集中はフィールドを文字列のまま保持し、スキーマバリデーションの段階で型付きの値へ解析するとすっきり扱えます。

厳格な ISO 入力コントロールでは、スキーマ内で各文字列を変換し、解析済みの型に対してドメイン固有のチェックを直接記述します。

```js
import { z } from 'zod';
import { date } from 'native-dates';

const isoDate = z.string().transform((raw, ctx) => {
  try {
    return date(raw);
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid YYYY-MM-DD date' });
    return z.NEVER;
  }
});

const bookingSchema = z
  .object({ checkIn: isoDate, checkOut: isoDate })
  .refine(({ checkIn, checkOut }) => checkOut.isAfter(checkIn), {
    message: 'Check-out must come after check-in',
    path: ['checkOut'],
  });
```

ユーザーがテキストボックスに「Nov 16, 2026」のような口語的な日付を入力する場合は、[loose プラグイン](/plugins/loose/)を読み込んで `{ loose: true }` を渡します。読み取れない文字列はエラーをスローせず `null` を返すため、`try` ブロックが不要になります。

```js
import '@native-dates/plugins/loose';
import { date, isCalendarDate } from 'native-dates';

function parseTypedDate(raw, locale = 'en-US') {
  const parsed = date(raw, { loose: true, locale });
  return isCalendarDate(parsed) ? parsed : null;
}

parseTypedDate('Nov 16, 2026')?.toString(); // '2026-11-16'
parseTypedDate('not a date'); // null
```

すでに解析済みの状態を検証するカスタムスキーマルールには、[`isCalendarDate()`](/api/kind-of/) や `isDateTime()` のような型ガードもそのまま組み込めます。

## チャート・テーブル・読み取り専用の Date 互換表示

チャートやデータテーブルのライブラリは、`getTime()` や `getHours()` といった標準のゲッター経由でタイムスタンプを読み取るのが一般的です。

アプリ起動時に [legacy-date プラグイン](/plugins/legacy-date/)を一度インポートしておくと、これらの読み取り専用ゲッターが [`DateTime`](/api/date-time/) に追加されます。ローカルゲッターは実行環境の OS ではなくインスタンス自身のタイムゾーン基準で評価され、値を書き換えるセッターはエラーをスローします。

```js
import '@native-dates/plugins/legacy-date';
import { compare, datetime } from 'native-dates';

const rows = [
  { id: 'b', createdAt: datetime('2026-11-16T18:00:00Z', 'America/New_York') },
  { id: 'a', createdAt: datetime('2026-11-16T14:30:00Z', 'America/New_York') },
];

// 読み取り専用の Date ゲッターを使う処理に DateTime の値をそのまま渡す
rows[0].createdAt.getHours(); // 13
rows[0].createdAt.getTime(); // 1794852000000

// 単一のコア型で行をソートする
const sorted = [...rows].sort((a, b) => compare(a.createdAt, b.createdAt));
sorted[0].id; // 'a'
```

すべて日付、またはすべて日時のように1種類の型を保持する列のソートには、テーブルの比較関数内で [`compare()`](/api/compare/) を呼び出します。異なる種類を混ぜて比較するとエラーがスローされます。

:::tip[ウィジェットが instanceof Date を検査する場合]
legacy-date プラグインは `DateTime` を拡張するだけであり、標準の `Date` としての型判定は偽装しません。チャートやテーブルがオブジェクトの型を検査したり値を直接書き換えたりする場合は、データ系列の境界で `dt.toJSDate()` または `dt.epochMilliseconds` を渡してください。
:::

## API やデータベースへの送信

UI の境界で解析したフォームの値は、手動で変換しなくてもそのまま `JSON.stringify()` に渡せます。ISO 通信形式や JSON・データベース行からファクトリへ戻す手順は、[保存と送信](/guides/storing-and-sending/)を参照してください。
