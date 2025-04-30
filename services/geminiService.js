import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { supabase } from '../supabase';


const googleAPIKEY = import.meta.env.GOOGLE_API_KEY;



export async function generatePrompt(from, to, language, queryType, transportType) {
    const prompts = {
        en: {
            full: `Plan route from ${from} to ${to} using ${transportType}. Include time estimates, costs, and safety tips. Only provide the facts do not add any additional commentary.`,
            'time-only': `Provide only the estimated travel time from ${from} to ${to} using ${transportType}. Only provide the facts do not add any additional commentary.`,

            "full-bus": `Plan route from ${from} to ${to} using the Bus. Include time estimates, costs, and safety tips. Only provide the facts do not add any additional commentary.`,
            "time-only-bus": `Provide only the estimated travel time from ${from} to ${to} using the Bus. Only provide the facts do not add any additional commentary.`,
            "full-taxi": `Plan route from ${from} to ${to} using the Taxi. Include time estimates, costs, and safety tips. Only provide the facts do not add any additional commentary.`,
            "time-only-taxi": `Provide only the estimated travel time from ${from} to ${to} using the Taxi. Only provide the facts do not add any additional commentary.`,
            "full-rideshare": `Plan route from ${from} to ${to} using a ride sharing service. Include time estimates, costs, and safety tips. Only provide the facts do not add any additional commentary.`,
            "time-only-rideshare": `Provide only the estimated travel time from ${from} to ${to} using a ride sharing service. Only provide the facts do not add any additional commentary.`,
            "full-train": `Plan route from ${from} to ${to} using the train. Include time estimates, costs, and safety tips. Only provide the facts do not add any additional commentary.`,
            "time-only-train": `Provide only the estimated travel time from ${from} to ${to} using the train. Only provide the facts do not add any additional commentary.`,



        },
        zu: {
            full: `${additionalContext}Yila indlela kusuka ${from} ukuya ${to} usebenzisa ${transportType}. Fakazi isikhathi, izindleko, nezexwayiso. Ungangezi okunye ukuhlaziya.`,
            'time-only': `${additionalContext}Nikeza kuphela isikhathi esilinganiselwe sokuhamba ukusuka ${from} ukuya ${to} usebenzisa ${transportType}. Ungangezi okunye ukuhlaziya.`
        },
        xh: {
            full: `${additionalContext}Yila indlela ukusuka ${from} ukuya ${to} usebenzisa ${transportType}. Dibana nexesha, amaxabiso, neengcebiso zokhuseleko. Ungongezi naluphi na uphawu.`,
            'time-only': `${additionalContext}Nikezela kuphela ixesha eliqikelelwayo lokuhamba ukusuka ${from} ukuya ${to} usebenzisa ${transportType}. Ungongezi naluphi na uphawu.`
        }
    };
    if(queryType === 'full'){
        return  prompts[language]?.full || prompts.en.full;
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