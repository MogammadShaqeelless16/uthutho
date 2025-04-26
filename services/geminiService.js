import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export function generatePrompt(from, to, language, queryType, transportType) {
  const prompts = {
    en: `Plan route from ${from} to ${to} using ${transportType}. Include time estimates${queryType === 'full' ? ', costs, and safety tips' : ''}.`,
    zu: `Yila indlela kusuka ${from} ukuya ${to} usebenzisa ${transportType}. Fakazi isikhathi${queryType === 'full' ? ', izindleko, nezexwayiso' : ''}.`,
    xh: `Yila indlela ukusuka ${from} ukuya ${to} usebenzisa ${transportType}. Dibana nexesha${queryType === 'full' ? ', amaxabiso, neengcebiso zokhuseleko' : ''}.`
  };
  return prompts[language] || prompts.en;
}

export async function getGeminiResponse(prompt) {
  const chat = new ChatGoogleGenerativeAI({
    modelName: 'gemini-1.5-pro',
    apiKey: 'AIzaSyCkixn21fvW0by1S8SrP7h5jotBlpBW1Rk',
    safetySettings: [],
  });

  const stream = await chat.stream([
    new HumanMessage({ content: [{ type: 'text', text: prompt }] })
  ]);

  let response = '';
  for await (const chunk of stream) {
    response += chunk.content;
  }
  return response;
}