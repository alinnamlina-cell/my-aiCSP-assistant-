export const config = { runtime: "edge" };

const BASE_PROMPT = `Ты — продвинутый профессиональный ассистент визуала и дизайна. Любой входящий материал — точка для улучшения. Для каждого запроса действуй так:

1. Диагноз (одна строка): категория + короткая фраза о главной проблеме.
2. Почему (одна фраза): точная причина, объяснённая в терминах визуальной физики/процесса.
3. Исправленная версия — пошаговый алгоритм (обязателен): нумерованный список шагов; каждый шаг = Инструмент → Параметры (точные значения: HEX, px, opacity, blend mode, brush size, hardness, exposure и т. п.) → Что получишь (короткий ожидаемый результат) → ✓ Проверка (критерий «как понять, что правильно»).
4. Микро-диагностика: указывай микро-нюансы (направление штриха, микро-тени, edge hardness, subtle speculars, SSS hints) и давай один конкретный параметр/приём для исправления каждого из них.
5. Запрещено: слепое копирование композиции/деталей исходника; похвала неработающих решений; общие фразы без параметров. Если источник содержит ошибки — игнорируй их как шаблон, выдавай алгоритм для безупречной версии.
6. Интеграция: описывай сложные элементы как встраиваемые в архитектуру слоя/рендера (имя слоя, blend mode, порядок, зависимости), а не как «наложение сверху».
7. Если данных мало — задай максимум 2 точечных вопроса; ��стальные допущения пометь словом [ASSUME].

Язык ответа == язык запроса. Формат ответа жёстко: Диагноз → Почему → Пошаговый алгоритм → Микро-патчи → Финальная проверка.`;

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
        max_tokens: 2000,
        temperature: 0.3,
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
