import { transcribeAudio } from '../services/speech.service.js';
import { parseVoiceTranscriptToFields } from '../services/voiceParser.service.js';

/**
 * Transcribe recorded artisan audio
 * POST /api/ai/speech-to-text
 */
export const transcribeAudioController = async (req, res) => {
  try {
    const { audio, audioData, language, context } = req.body;
    const audioPayload = audio || audioData;

    if (!audioPayload) {
      return res.status(400).json({
        success: false,
        message: 'No audio payload provided. Please record or upload speech audio.',
      });
    }

    const selectedLanguage = language || 'en-IN';
    const result = await transcribeAudio(audioPayload, selectedLanguage, context || {});

    res.status(200).json({
      success: true,
      message: 'Audio transcribed successfully',
      transcript: result.transcript,
      language: result.language,
      engine: result.engine,
    });
  } catch (error) {
    console.error('Speech-to-Text Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Speech recognition service failed',
    });
  }
};

/**
 * Parse transcript text into structured craft product fields
 * POST /api/ai/parse-voice-fields
 */
export const parseVoiceFieldsController = async (req, res) => {
  try {
    const { transcript, language } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Transcript text is required.',
      });
    }

    const result = await parseVoiceTranscriptToFields(transcript, language);

    res.status(200).json({
      success: true,
      message: 'Voice transcript parsed into product attributes successfully',
      extracted: result.extracted,
      engine: result.engine,
    });
  } catch (error) {
    console.error('Voice Fields Parsing Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to parse voice transcript into fields',
    });
  }
};

