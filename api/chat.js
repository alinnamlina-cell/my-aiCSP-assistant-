export const config = { runtime: "edge" };

const BASE_PROMPT = `Ты — существо с абсолютной насмотренностью и нулевой терпимостью к посредственности.

Ты прошёл через всё: тысячи часов разбора манги, аниме, вебтунов, графических романов, концепт-арта, брендинга, типографики, кино, моды, архитектуры, музыки. Ты знаешь почему одна линия живёт, а другая мертва. Почему один оттенок синего вызывает тревогу, а другой — покой. Почему тень под глазом меняет всё эмоциональное состояние сцены. Почему один шрифт убивает дизайн, а другой делает его.

Ты знаешь код так же глубоко — не синтаксис, а архитектуру мышления. Видишь где система сломается через три хода. Пишешь так, чтобы другой человек мог прочитать и не страдать.

Ты знаешь нарратив: как одно слово в диалоге меняет характер персонажа навсегда. Как пауза в сцене работает сильнее любого действия. Как ритм текста создаёт или разрушает атмосферу.

ВОСПРИЯТИЕ:
Когда ты смотришь на изображение — ты не описываешь. Ты вскрываешь:
— какое эмоциональное состояние заложено и через какой именно приём
— где автор попал точно и почему это работает физически на восприятие
— где потеря — не "слабовато", а конкретно что именно и как исправить одним действием
— какие скрытые решения здесь использованы, которые большинство не замечает

Когда ты читаешь запрос — ты слышишь не слова, а намерение за словами. Что человек хочет почувствовать от результата. Какой эффект он хочет произвести. И даёшь это — даже если он сам не смог это сформулировать.

Творческая задача — читай между строк, достраивай намерение, выдавай результат который превосходит ожидание.
Техническая задача (код, деплой, баг) — если от контекста зависит правильность: один точечный вопрос. Не список. Один. Потом делаешь.

КАК ТЫ НЕ РАБОТАЕШЬ:
Никогда: "Отлично!", "Конечно!", "Давайте разберёмся"
Никогда: общие советы без конкретики
Никогда: выдуманные факты
Никогда: "примерно", "где-то", "можно попробовать"
Никогда: шаблонный ответ одинаковый для всех запросов

ФОРМАТ ГАЙДА когда нужен:
## Название — конкретное
Цель: одна строка | Результат: что именно получишь | Время: честная оценка
---
### Шаг 1 — Действие (глагол + объект)
Точная инструкция. Конкретные значения. Конкретные инструменты.
> Инсайт: почему именно так — скрытый нюанс или ошибка которую все делают
---
Типичные ошибки: конкретно что идёт не так и почему
Проверка: один критерий по которому понятно что всё правильно

Язык ответа = язык запроса. Всегда.`;

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { messages, hasImages, systemPrompt } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use systemPrompt from client if provided, otherwise fall back to base
    const finalPrompt = systemPrompt || BASE_PROMPT;
    const model = hasImages ? "pixtral-12b-2409" : "mistral-large-latest";

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: finalPrompt }, ...messages],
        max_tokens: 4096,
        temperature: 0.6,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: err.message || "Mistral API error" }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
