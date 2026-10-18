import { GoogleGenAI } from '@google/genai'

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
export const MODEL = 'gemini-3.8-flash'

export async function extractJobSkills(description) {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: description.slice(0, 8000),
    config: {
      systemInstruction:
        'Extract skill requirements from this job posting. Return JSON: ' +
        '{"skills":[{"name":string,"category":string,"importance":"required"|"preferred","quote":string}]}. ' +
        'The quote must be copied exactly from the posting.',
      responseMimeType: 'application/json',
    },
  })

  const parsed = JSON.parse(res.text)
  return (parsed.skills || []).filter((s) => description.includes(s.quote))
}