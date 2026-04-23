import { GoogleGenAI, Modality } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
    try {
        const session = await ai.live.connect({
            model: 'gemini-2.0-flash',
            config: {
                temperature: 0.7,
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                systemInstruction: { parts: [{ text: "Hello" }] },
            }
        });
        session.sendRealtimeInput([{ media: { mimeType: 'audio/pcm;rate=16000', data: 'AABB' } }]);
        console.log("Connected and sent OK");
    } catch (e) { console.error(e) }
}
test();
