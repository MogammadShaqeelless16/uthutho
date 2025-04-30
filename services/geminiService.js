import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const googleAPIKEY = import.meta.env.GOOGLE_API_KEY;

export function generatePrompt(from, to, language, queryType, transportType) {
    const prompts = {
        en: {
            full: `Plan route from ${from} to ${to} using ${transportType}. Include time estimates, costs, and safety tips.`,
            'time-only': `Provide only the estimated travel time from ${from} to ${to} using ${transportType}.`
        },
        zu: {
            full: `Yila indlela kusuka ${from} ukuya ${to} usebenzisa ${transportType}. Fakazi isikhathi, izindleko, nezexwayiso.`,
            'time-only': `Nikeza kuphela isikhathi esilinganiselwe sokuhamba ukusuka ${from} ukuya ${to} usebenzisa ${transportType}.`
        },
        xh: {
            full: `Yila indlela ukusuka ${from} ukuya ${to} usebenzisa ${transportType}. Dibana nexesha, amaxabiso, neengcebiso zokhuseleko.`,
            'time-only': `Nikezela kuphela ixesha eliqikelelwayo lokuhamba ukusuka ${from} ukuya ${to} usebenzisa ${transportType}.`
        }
    };
    if(queryType === 'full'){
        return prompts[language]?.full || prompts.en.full;
    }
    return prompts[language]?.[queryType] || prompts.en[queryType];
}

export async function getGeminiResponse(prompt) {
  const chat = new ChatGoogleGenerativeAI({
    modelName: 'gemini-1.5-pro',
    apiKey: googleAPIKEY,
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