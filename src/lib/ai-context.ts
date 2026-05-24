import { ProfileConfig } from '../types';

/**
 * Generates a system prompt for the AI based on the active profile and current module.
 * The AI adapts its tone, terminology, and behavior to match the user's work domain.
 */
export const buildSystemPrompt = (profile: ProfileConfig, activeModule?: string): string => {
  const moduleContext = activeModule
    ? `\nТекущий модуль: "${profile.labels[activeModule] || activeModule}".`
    : '';

  const rulesBlock = profile.aiRules.map((r, i) => `${i + 1}. ${r}`).join('\n');

  return `Ты — встроенный ИИ-помощник системы "Assistant OS".
Профиль пользователя: ${profile.name} (${profile.description}).
${moduleContext}

СТИЛЬ ОБЩЕНИЯ:
${profile.aiTone}

ПРАВИЛА:
${rulesBlock}

КРИТИЧЕСКИ ВАЖНО:
- Ты находишься ВНУТРИ рабочей системы, а не в обычном чате.
- Ты понимаешь контекст: какой модуль открыт, какая задача выполняется.
- Ты должен предлагать КОНКРЕТНЫЕ действия (создать задачу, написать письмо, добавить в отчёт).
- Не просто пиши текст — помогай связывать данные между модулями.
- Используй терминологию текущего профиля.`;
};

/**
 * Wraps user prompt with full system context for the AI.
 */
export const wrapPromptWithContext = (
  profile: ProfileConfig,
  userPrompt: string,
  activeModule?: string
): string => {
  const systemPrompt = buildSystemPrompt(profile, activeModule);
  return `${systemPrompt}

---
ЗАПРОС ПОЛЬЗОВАТЕЛЯ:
${userPrompt}`;
};

/**
 * Generates a contextual AI hint based on the current module.
 * Used to show inline AI suggestions in module headers.
 */
export const getModuleAIHint = (profile: ProfileConfig, moduleId: string): string => {
  const hints: Record<string, Record<string, string>> = {
    tasks: {
      GOV: 'ИИ поможет: уточнить формулировку поручения, определить ответственного, оценить риск срыва.',
      CEO: 'ИИ поможет: приоритизировать задачи, предложить дедлайн, написать напоминание.',
      IT: 'ИИ поможет: разбить задачу на подзадачи, оценить story points, определить blockers.',
      PRIVATE: 'ИИ поможет: составить чек-лист, напомнить о важном.',
      OPS: 'ИИ поможет: выявить узкие места, назначить ответственного, проконтролировать сроки.',
      PROJECT: 'ИИ поможет: привязать задачу к этапу, оценить влияние на критический путь.',
    },
    meetings: {
      GOV: 'ИИ поможет: составить повестку, оформить протокол, зафиксировать решения.',
      CEO: 'ИИ поможет: подготовить повестку, выделить action items, написать follow-up.',
      IT: 'ИИ поможет: создать заметки синка, выделить блокеры, сформировать action items.',
      PRIVATE: 'ИИ поможет: напомнить о встрече, подготовить список вопросов.',
      OPS: 'ИИ поможет: оформить протокол, выделить задачи, назначить ответственных.',
      PROJECT: 'ИИ поможет: оформить minutes of meeting, создать задачи из решений.',
    },
  };

  return hints[moduleId]?.[profile.id] || 'ИИ поможет с текущей задачей.';
};

/**
 * Analyzes the given module data (e.g. tasks array, journal entries) using Gemini API
 * and returns structured insights, warnings, and suggested actions.
 */
export const analyzeModuleContext = async (
  profile: ProfileConfig,
  moduleName: string,
  contextData: any
): Promise<{
  insights: string[];
  warnings: string[];
  actions: { label: string; actionId: string }[];
}> => {
  const systemPrompt = buildSystemPrompt(profile, moduleName);
  
  const prompt = `${systemPrompt}

Тебе передан текущий контекст модуля (данные на экране пользователя).
Проанализируй их и верни результат СТРОГО в формате JSON, без маркдауна и лишних символов.

Ожидаемый формат JSON:
{
  "insights": ["Инсайт 1", "Инсайт 2"], // Полезные наблюдения по данным
  "warnings": ["Предупреждение 1"], // То, что требует внимания (просрочки, пустые поля)
  "actions": [
    { "label": "Создать задачу для X", "actionId": "create_task_X" }
  ] // Рекомендуемые следующие шаги
}

ДАННЫЕ МОДУЛЯ:
${JSON.stringify(contextData, null, 2).slice(0, 3000)}`;

  try {
    const apiKeys = JSON.parse(localStorage.getItem('ew_api_keys') || '[]');
    const geminiKey = apiKeys.find((k: any) => k.id === 'gemini')?.key;
    
    if (!geminiKey) {
      throw new Error('API Key not found');
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No text in response');
    
    const parsed = JSON.parse(text);
    return {
      insights: parsed.insights || [],
      warnings: parsed.warnings || [],
      actions: parsed.actions || []
    };
  } catch (error) {
    console.error('AI Context Analysis Error:', error);
    // Fallback if API fails or no key
    return {
      insights: ['Подключите API ключ Gemini в настройках для получения AI-аналитики.'],
      warnings: [],
      actions: []
    };
  }
};
