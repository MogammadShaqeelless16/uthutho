import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const googleAPIKEY = import.meta.env.GOOGLE_API_KEY;

export function generatePrompt(from, to, language, queryType, transportType) {
    const prompts = {
       en: {
            full: `Plan route from ${from} to ${to} using ${transportType}. Include time estimates, costs, and safety tips. Only provide short and simple answers with no additional text or commentary.`,
            'time-only': `Provide only the estimated travel time from ${from} to ${to} using ${transportType}. Only provide short and simple answers with no additional text or commentary.`,

            "full-bus": `Plan route from ${from} to ${to} using the Bus. Include time estimates, costs, and safety tips. Only provide short and simple answers with no additional text or commentary.`,
            "time-only-bus": `Provide only the estimated travel time from ${from} to ${to} using the Bus. Only provide short and simple answers with no additional text or commentary.`,
            "full-taxi": `Plan route from ${from} to ${to} using the Taxi. Include time estimates, costs, and safety tips. Only provide short and simple answers with no additional text or commentary.`,
            "time-only-taxi": `Provide only the estimated travel time from ${from} to ${to} using the Taxi. Only provide short and simple answers with no additional text or commentary.`,
            "full-rideshare": `Plan route from ${from} to ${to} using a ride sharing service. Include time estimates, costs, and safety tips. Only provide short and simple answers with no additional text or commentary.`,
            "time-only-rideshare": `Provide only the estimated travel time from ${from} to ${to} using a ride sharing service. Only provide short and simple answers with no additional text or commentary.`,
            "full-train": `Plan route from ${from} to ${to} using the train. Include time estimates, costs, and safety tips. Only provide short and simple answers with no additional text or commentary.`,
            "time-only-train": `Provide only the estimated travel time from ${from} to ${to} using the train. Only provide short and simple answers with no additional text or commentary.`,

        },
        zu: {
            full: `Yila indlela kusuka ${from} ukuya ${to} usebenzisa ${transportType}. Fakazi isikhathi, izindleko, nezexwayiso. Nikeza kuphela izimpendulo ezimfushane nezilula ngaphandle kombhalo owengeziwe.`,
            'time-only': `Nikeza kuphela isikhathi esilinganiselwe sokuhamba ukusuka ${from} ukuya ${to} usebenzisa ${transportType}. Nikeza kuphela izimpendulo ezimfushane nezilula ngaphandle kombhalo owengeziwe.`
        },
        xh: {
            full: `Yila indlela ukusuka ${from} ukuya ${to} usebenzisa ${transportType}. Dibana nexesha, amaxabiso, neengcebiso zokhuseleko. Nikezela kuphela iimpendulo ezimfutshane ezilula ngaphandle kombhalo owongezelelweyo.`,
            'time-only': `Nikezela kuphela ixesha eliqikelelwayo lokuhamba ukusuka ${from} ukuya ${to} usebenzisa ${transportType}. Nikezela kuphela iimpendulo ezimfutshane ezilula ngaphandle kombhalo owongezelelweyo.`
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