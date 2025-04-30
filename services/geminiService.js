import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { supabase } from '../supabase';

const googleAPIKEY = import.meta.env.GOOGLE_API_KEY;

async function findMatchingLocationName(locationName) {
  const tables = ['hubs', 'stops', 'routes'];
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('name')
      .ilike('name', `%${locationName}%`)
      .limit(1);

    if (error) {
      console.error(`Error querying ${table}:`, error);
      continue; 
    }

    if (data && data.length > 0) {
      return { table, name: data[0].name };
    }
  }
  return null;
}

export async function generatePrompt(from, to, language, queryType, transportType) {
    let additionalContext = '';

    const fromMatch = await findMatchingLocationName(from);
    if (fromMatch) {
      additionalContext += `The user mentioned a known ${fromMatch.table.slice(0,-1)} called ${fromMatch.name}. `;
    }

    const toMatch = await findMatchingLocationName(to);
    if (toMatch) {
      additionalContext += `The user mentioned a known ${toMatch.table.slice(0,-1)} called ${toMatch.name}. `;
    }

    const prompts = {
        en: {
            full: `${additionalContext}Plan route from ${from} to ${to} using ${transportType}. Include time estimates, costs, and safety tips.`,
            'time-only': `${additionalContext}Provide only the estimated travel time from ${from} to ${to} using ${transportType}.`
        },
        zu: {
            full: `${additionalContext}Yila indlela kusuka ${from} ukuya ${to} usebenzisa ${transportType}. Fakazi isikhathi, izindleko, nezexwayiso.`,
            'time-only': `${additionalContext}Nikeza kuphela isikhathi esilinganiselwe sokuhamba ukusuka ${from} ukuya ${to} usebenzisa ${transportType}.`
        },
        xh: {
            full: `${additionalContext}Yila indlela ukusuka ${from} ukuya ${to} usebenzisa ${transportType}. Dibana nexesha, amaxabiso, neengcebiso zokhuseleko.`,
            'time-only': `${additionalContext}Nikezela kuphela ixesha eliqikelelwayo lokuhamba ukusuka ${from} ukuya ${to} usebenzisa ${transportType}.`
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