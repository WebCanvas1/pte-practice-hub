/**
 * GENERATED FILE — do not edit by hand.
 * Run `bun run scripts/gen-question-seed.ts` to regenerate.
 *
 * Seed question bank used by the in-memory development store. The same data is
 * emitted as SQL in migrations/0004_question_seed.sql for Cloudflare D1.
 *
 * All content is original sample material written for this platform and is not
 * official Pearson PTE material.
 */
import type { QuestionContent, QuestionStatus } from "@/config/questions";
import type { DifficultyKey, ModuleKey } from "@/config/site";

export interface SeedOption {
  label: string;
  content: string;
  isCorrect: boolean;
  position: number;
}

export interface SeedQuestion {
  id: string;
  module: ModuleKey;
  type: string;
  difficulty: DifficultyKey;
  title: string;
  instructions: string;
  prompt: string;
  passage: string;
  correctAnswer: string;
  alternativeAnswers: string[];
  modelAnswer: string;
  explanation: string;
  scoringConfig: Record<string, unknown>;
  scoreWeight: number;
  topic: string;
  tags: string[];
  estimatedSeconds: number;
  sourceReference: string;
  adminNotes: string;
  aiConfidence: number;
  status: QuestionStatus;
  content: QuestionContent;
  options: SeedOption[];
  audio: { url: string; transcript: string; durationSeconds: number } | null;
  image: { url: string; altText: string } | null;
  usage: { attempts: number; avgScore: number; correctRate: number };
}

export const questionSeed: SeedQuestion[] = [
  {
    "id": "qst_seed_read_aloud_1",
    "module": "speaking",
    "type": "read_aloud",
    "difficulty": "intermediate",
    "title": "Read Aloud — Renewable energy 1",
    "instructions": "The student reads a short text aloud within the preparation and recording time.",
    "prompt": "Read the text aloud as naturally and clearly as you can.",
    "passage": "Coastal wetlands store carbon at a rate far higher than most forests, yet they are cleared quickly because their value is easy to overlook. Restoring even a narrow strip of mangrove can protect a shoreline during storms while returning habitat to juvenile fish.",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "Coastal wetlands store carbon at a rate far higher than most forests, yet they are cleared quickly because their value is easy to overlook. Restoring even a narrow strip of mangrove can protect a shoreline during storms while returning habitat to juvenile fish.",
    "explanation": "Sample item written for this platform to demonstrate the Read Aloud task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 15
    },
    "scoreWeight": 1,
    "topic": "Renewable energy",
    "tags": [
      "renewable-energy",
      "speaking",
      "intermediate"
    ],
    "estimatedSeconds": 55,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.77,
    "status": "published",
    "content": {
      "preparationSeconds": 35,
      "recordingSeconds": 40
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 7,
      "avgScore": 58,
      "correctRate": 0.48
    }
  },
  {
    "id": "qst_seed_read_aloud_2",
    "module": "speaking",
    "type": "read_aloud",
    "difficulty": "easy",
    "title": "Read Aloud — Remote work 2",
    "instructions": "The student reads a short text aloud within the preparation and recording time.",
    "prompt": "Read the text aloud as naturally and clearly as you can.",
    "passage": "City planners increasingly treat footpaths as infrastructure rather than decoration. When a suburb is designed so that shops, schools and transport stops sit within a fifteen-minute walk, residents drive less and local businesses trade more consistently through the week.",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "City planners increasingly treat footpaths as infrastructure rather than decoration. When a suburb is designed so that shops, schools and transport stops sit within a fifteen-minute walk, residents drive less and local businesses trade more consistently through the week.",
    "explanation": "Sample item written for this platform to demonstrate the Read Aloud task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 15
    },
    "scoreWeight": 1,
    "topic": "Remote work",
    "tags": [
      "remote-work",
      "speaking",
      "easy"
    ],
    "estimatedSeconds": 55,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.82,
    "status": "approved",
    "content": {
      "preparationSeconds": 35,
      "recordingSeconds": 40
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 14,
      "avgScore": 61,
      "correctRate": 0.56
    }
  },
  {
    "id": "qst_seed_repeat_sentence_1",
    "module": "speaking",
    "type": "repeat_sentence",
    "difficulty": "easy",
    "title": "Repeat Sentence — Public health 1",
    "instructions": "The student listens to a sentence and repeats it exactly.",
    "prompt": "Listen to the sentence, then repeat it exactly as you heard it.",
    "passage": "",
    "correctAnswer": "The conference has been moved to the lecture theatre on the ground floor.",
    "alternativeAnswers": [],
    "modelAnswer": "The conference has been moved to the lecture theatre on the ground floor.",
    "explanation": "Sample item written for this platform to demonstrate the Repeat Sentence task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 15
    },
    "scoreWeight": 1,
    "topic": "Public health",
    "tags": [
      "public-health",
      "speaking",
      "easy"
    ],
    "estimatedSeconds": 35,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.87,
    "status": "published",
    "content": {
      "recordingSeconds": 15
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/repeat_sentence-1.mp3",
      "transcript": "The conference has been moved to the lecture theatre on the ground floor.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 21,
      "avgScore": 64,
      "correctRate": 0.64
    }
  },
  {
    "id": "qst_seed_repeat_sentence_2",
    "module": "speaking",
    "type": "repeat_sentence",
    "difficulty": "hard",
    "title": "Repeat Sentence — Marine biology 2",
    "instructions": "The student listens to a sentence and repeats it exactly.",
    "prompt": "Listen to the sentence, then repeat it exactly as you heard it.",
    "passage": "",
    "correctAnswer": "The library extension will open before the start of the second semester.",
    "alternativeAnswers": [],
    "modelAnswer": "The library extension will open before the start of the second semester.",
    "explanation": "Sample item written for this platform to demonstrate the Repeat Sentence task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 15
    },
    "scoreWeight": 1,
    "topic": "Marine biology",
    "tags": [
      "marine-biology",
      "speaking",
      "hard"
    ],
    "estimatedSeconds": 35,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.92,
    "status": "draft",
    "content": {
      "recordingSeconds": 15
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/repeat_sentence-2.mp3",
      "transcript": "The library extension will open before the start of the second semester.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 28,
      "avgScore": 67,
      "correctRate": 0.72
    }
  },
  {
    "id": "qst_seed_describe_image_1",
    "module": "speaking",
    "type": "describe_image",
    "difficulty": "hard",
    "title": "Describe Image — Education technology 1",
    "instructions": "The student describes an image after 25 seconds of preparation.",
    "prompt": "Look at the chart. In 25 seconds, prepare to describe the trends in education technology shown between 2021 and 2024.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "The chart compares education technology figures across four years. The overall trend rises steadily, with the sharpest increase between the third and fourth year, before levelling off at the end of the period.",
    "explanation": "Sample item written for this platform to demonstrate the Describe Image task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 15
    },
    "scoreWeight": 1,
    "topic": "Education technology",
    "tags": [
      "education-technology",
      "speaking",
      "hard"
    ],
    "estimatedSeconds": 65,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.72,
    "status": "published",
    "content": {
      "preparationSeconds": 25,
      "recordingSeconds": 40
    },
    "options": [],
    "audio": null,
    "image": {
      "url": "https://assets.example.com/pte-samples/describe_image-1.png",
      "altText": "Bar chart showing education technology figures across four years"
    },
    "usage": {
      "attempts": 35,
      "avgScore": 70,
      "correctRate": 0.8
    }
  },
  {
    "id": "qst_seed_describe_image_2",
    "module": "speaking",
    "type": "describe_image",
    "difficulty": "intermediate",
    "title": "Describe Image — Transport planning 2",
    "instructions": "The student describes an image after 25 seconds of preparation.",
    "prompt": "Look at the chart. In 25 seconds, prepare to describe the trends in transport planning shown between 2021 and 2024.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "The chart compares transport planning figures across four years. The overall trend rises steadily, with the sharpest increase between the third and fourth year, before levelling off at the end of the period.",
    "explanation": "Sample item written for this platform to demonstrate the Describe Image task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 15
    },
    "scoreWeight": 1,
    "topic": "Transport planning",
    "tags": [
      "transport-planning",
      "speaking",
      "intermediate"
    ],
    "estimatedSeconds": 65,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.77,
    "status": "approved",
    "content": {
      "preparationSeconds": 25,
      "recordingSeconds": 40
    },
    "options": [],
    "audio": null,
    "image": {
      "url": "https://assets.example.com/pte-samples/describe_image-2.png",
      "altText": "Bar chart showing transport planning figures across four years"
    },
    "usage": {
      "attempts": 42,
      "avgScore": 73,
      "correctRate": 0.4
    }
  },
  {
    "id": "qst_seed_retell_lecture_1",
    "module": "speaking",
    "type": "retell_lecture",
    "difficulty": "intermediate",
    "title": "Retell Lecture — Food systems 1",
    "instructions": "The student listens to a lecture and retells it in their own words.",
    "prompt": "Retell the lecture in your own words.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "The speaker explains the main idea, gives one supporting example, and closes with the practical implication for planners.",
    "explanation": "Sample item written for this platform to demonstrate the Retell Lecture task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 15
    },
    "scoreWeight": 1,
    "topic": "Food systems",
    "tags": [
      "food-systems",
      "speaking",
      "intermediate"
    ],
    "estimatedSeconds": 90,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.82,
    "status": "published",
    "content": {
      "preparationSeconds": 10,
      "recordingSeconds": 40
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/retell_lecture-1.mp3",
      "transcript": "Coastal wetlands store carbon at a rate far higher than most forests, yet they are cleared quickly because their value is easy to overlook. Restoring even a narrow strip of mangrove can protect a shoreline during storms while returning habitat to juvenile fish.",
      "durationSeconds": 19
    },
    "image": null,
    "usage": {
      "attempts": 49,
      "avgScore": 76,
      "correctRate": 0.48
    }
  },
  {
    "id": "qst_seed_retell_lecture_2",
    "module": "speaking",
    "type": "retell_lecture",
    "difficulty": "easy",
    "title": "Retell Lecture — Space research 2",
    "instructions": "The student listens to a lecture and retells it in their own words.",
    "prompt": "Retell the lecture in your own words.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "The speaker explains the main idea, gives one supporting example, and closes with the practical implication for planners.",
    "explanation": "Sample item written for this platform to demonstrate the Retell Lecture task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 15
    },
    "scoreWeight": 1,
    "topic": "Space research",
    "tags": [
      "space-research",
      "speaking",
      "easy"
    ],
    "estimatedSeconds": 90,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.87,
    "status": "draft",
    "content": {
      "preparationSeconds": 10,
      "recordingSeconds": 40
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/retell_lecture-2.mp3",
      "transcript": "City planners increasingly treat footpaths as infrastructure rather than decoration. When a suburb is designed so that shops, schools and transport stops sit within a fifteen-minute walk, residents drive less and local businesses trade more consistently through the week.",
      "durationSeconds": 19
    },
    "image": null,
    "usage": {
      "attempts": 56,
      "avgScore": 79,
      "correctRate": 0.56
    }
  },
  {
    "id": "qst_seed_answer_short_question_1",
    "module": "speaking",
    "type": "answer_short_question",
    "difficulty": "easy",
    "title": "Answer Short Question — Behavioural science 1",
    "instructions": "The student answers a short general-knowledge question in one or a few words.",
    "prompt": "Which instrument is used to measure temperature?",
    "passage": "",
    "correctAnswer": "A thermometer",
    "alternativeAnswers": [
      "thermometer"
    ],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Answer Short Question task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Behavioural science",
    "tags": [
      "behavioural-science",
      "speaking",
      "easy"
    ],
    "estimatedSeconds": 20,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.92,
    "status": "published",
    "content": {
      "recordingSeconds": 10
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/answer_short_question-1.mp3",
      "transcript": "Which instrument is used to measure temperature?",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 63,
      "avgScore": 82,
      "correctRate": 0.64
    }
  },
  {
    "id": "qst_seed_answer_short_question_2",
    "module": "speaking",
    "type": "answer_short_question",
    "difficulty": "hard",
    "title": "Answer Short Question — Water management 2",
    "instructions": "The student answers a short general-knowledge question in one or a few words.",
    "prompt": "How many minutes are there in two hours?",
    "passage": "",
    "correctAnswer": "One hundred and twenty",
    "alternativeAnswers": [
      "120",
      "one hundred twenty"
    ],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Answer Short Question task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Water management",
    "tags": [
      "water-management",
      "speaking",
      "hard"
    ],
    "estimatedSeconds": 20,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.72,
    "status": "approved",
    "content": {
      "recordingSeconds": 10
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/answer_short_question-2.mp3",
      "transcript": "How many minutes are there in two hours?",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 70,
      "avgScore": 55,
      "correctRate": 0.72
    }
  },
  {
    "id": "qst_seed_respond_to_situation_1",
    "module": "speaking",
    "type": "respond_to_situation",
    "difficulty": "hard",
    "title": "Respond to a Situation — Digital privacy 1",
    "instructions": "The student responds appropriately to a described everyday situation.",
    "prompt": "A classmate asks to borrow your notes the day before an assessment, but your notes are incomplete. Respond politely and offer a practical alternative.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "I would explain the change politely, apologise for the short notice, and propose meeting in the library study area at the same time instead.",
    "explanation": "Sample item written for this platform to demonstrate the Respond to a Situation task format.",
    "scoringConfig": {
      "criteria": {
        "appropriacy": 1,
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 20
    },
    "scoreWeight": 1,
    "topic": "Digital privacy",
    "tags": [
      "digital-privacy",
      "speaking",
      "hard"
    ],
    "estimatedSeconds": 60,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.77,
    "status": "published",
    "content": {
      "preparationSeconds": 20,
      "recordingSeconds": 40
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/respond_to_situation-1.mp3",
      "transcript": "A classmate asks to borrow your notes the day before an assessment, but your notes are incomplete. Respond politely and offer a practical alternative.",
      "durationSeconds": 11
    },
    "image": null,
    "usage": {
      "attempts": 77,
      "avgScore": 58,
      "correctRate": 0.8
    }
  },
  {
    "id": "qst_seed_respond_to_situation_2",
    "module": "speaking",
    "type": "respond_to_situation",
    "difficulty": "intermediate",
    "title": "Respond to a Situation — Urban living 2",
    "instructions": "The student responds appropriately to a described everyday situation.",
    "prompt": "Your study group has booked a room for tonight, but a lecturer has just asked to use it for a make-up class. Explain the situation to your group and suggest what to do.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "I would explain the change politely, apologise for the short notice, and propose meeting in the library study area at the same time instead.",
    "explanation": "Sample item written for this platform to demonstrate the Respond to a Situation task format.",
    "scoringConfig": {
      "criteria": {
        "appropriacy": 1,
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 20
    },
    "scoreWeight": 1,
    "topic": "Urban living",
    "tags": [
      "urban-living",
      "speaking",
      "intermediate"
    ],
    "estimatedSeconds": 60,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.82,
    "status": "draft",
    "content": {
      "preparationSeconds": 20,
      "recordingSeconds": 40
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/respond_to_situation-2.mp3",
      "transcript": "Your study group has booked a room for tonight, but a lecturer has just asked to use it for a make-up class. Explain the situation to your group and suggest what to do.",
      "durationSeconds": 12
    },
    "image": null,
    "usage": {
      "attempts": 84,
      "avgScore": 61,
      "correctRate": 0.4
    }
  },
  {
    "id": "qst_seed_summarize_group_discussion_1",
    "module": "speaking",
    "type": "summarize_group_discussion",
    "difficulty": "intermediate",
    "title": "Summarize Group Discussion — Renewable energy 1",
    "instructions": "The student summarises a short multi-speaker discussion.",
    "prompt": "Summarise the discussion in your own words.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "The speakers weigh cost against accessibility. Two favour the change if support is provided, while the third wants a trial before any full rollout.",
    "explanation": "Sample item written for this platform to demonstrate the Summarize Group Discussion task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 15
    },
    "scoreWeight": 1,
    "topic": "Renewable energy",
    "tags": [
      "renewable-energy",
      "speaking",
      "intermediate"
    ],
    "estimatedSeconds": 130,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.87,
    "status": "published",
    "content": {
      "preparationSeconds": 10,
      "recordingSeconds": 120
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/summarize_group_discussion-1.mp3",
      "transcript": "Two colleagues and a supervisor debate whether to shorten weekly meetings and share written updates instead.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 91,
      "avgScore": 64,
      "correctRate": 0.48
    }
  },
  {
    "id": "qst_seed_summarize_group_discussion_2",
    "module": "speaking",
    "type": "summarize_group_discussion",
    "difficulty": "easy",
    "title": "Summarize Group Discussion — Remote work 2",
    "instructions": "The student summarises a short multi-speaker discussion.",
    "prompt": "Summarise the discussion in your own words.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "The speakers weigh cost against accessibility. Two favour the change if support is provided, while the third wants a trial before any full rollout.",
    "explanation": "Sample item written for this platform to demonstrate the Summarize Group Discussion task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "oral_fluency": 1,
        "pronunciation": 1
      },
      "maxScore": 15
    },
    "scoreWeight": 1,
    "topic": "Remote work",
    "tags": [
      "remote-work",
      "speaking",
      "easy"
    ],
    "estimatedSeconds": 130,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.92,
    "status": "approved",
    "content": {
      "preparationSeconds": 10,
      "recordingSeconds": 120
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/summarize_group_discussion-2.mp3",
      "transcript": "Three students discuss whether their campus should replace printed handouts with tablets, weighing cost, accessibility and study habits.",
      "durationSeconds": 10
    },
    "image": null,
    "usage": {
      "attempts": 98,
      "avgScore": 67,
      "correctRate": 0.56
    }
  },
  {
    "id": "qst_seed_reading_writing_fill_blanks_1",
    "module": "reading",
    "type": "reading_writing_fill_blanks",
    "difficulty": "easy",
    "title": "Reading and Writing Fill in the Blanks — Public health 1",
    "instructions": "A passage with blanks; the student selects the best word from a dropdown.",
    "prompt": "Select the word that best fits each blank.",
    "passage": "Coastal wetlands store carbon at a rate far higher than most forests, yet they are cleared [[1]] because their value is easy to overlook. Restoring even a narrow strip of mangrove can protect a shoreline during storms while returning habitat to juvenile fish.",
    "correctAnswer": "1: consistent",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Reading and Writing Fill in the Blanks task format.",
    "scoringConfig": {
      "criteria": {
        "reading": 1,
        "writing": 1
      },
      "maxScore": 10
    },
    "scoreWeight": 1,
    "topic": "Public health",
    "tags": [
      "public-health",
      "reading",
      "easy"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.72,
    "status": "published",
    "content": {
      "blanks": [
        {
          "index": 1,
          "answer": "consistent",
          "choices": [
            "consistent",
            "reluctant",
            "temporary",
            "hidden"
          ]
        }
      ],
      "wordBank": [
        "consistent",
        "reluctant",
        "temporary",
        "hidden"
      ]
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 105,
      "avgScore": 70,
      "correctRate": 0.64
    }
  },
  {
    "id": "qst_seed_reading_writing_fill_blanks_2",
    "module": "reading",
    "type": "reading_writing_fill_blanks",
    "difficulty": "hard",
    "title": "Reading and Writing Fill in the Blanks — Marine biology 2",
    "instructions": "A passage with blanks; the student selects the best word from a dropdown.",
    "prompt": "Select the word that best fits each blank.",
    "passage": "Behavioural researchers distinguish between habits, which are triggered by context, and intentions, which depend on deliberate attention. Programmes that rely only on information campaigns tend to fade once novelty passes, whereas those that redesign the surrounding environment produce changes that persist long after the intervention ends. Researchers describe this pattern as [[1]] and broadly [[2]].",
    "correctAnswer": "1: consistent; 2: predictable",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Reading and Writing Fill in the Blanks task format.",
    "scoringConfig": {
      "criteria": {
        "reading": 1,
        "writing": 1
      },
      "maxScore": 10
    },
    "scoreWeight": 1,
    "topic": "Marine biology",
    "tags": [
      "marine-biology",
      "reading",
      "hard"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.77,
    "status": "draft",
    "content": {
      "blanks": [
        {
          "index": 1,
          "answer": "consistent",
          "choices": [
            "consistent",
            "reluctant",
            "temporary",
            "hidden"
          ]
        },
        {
          "index": 2,
          "answer": "predictable",
          "choices": [
            "predictable",
            "invisible",
            "hostile",
            "random"
          ]
        }
      ],
      "wordBank": [
        "consistent",
        "reluctant",
        "temporary",
        "hidden",
        "predictable",
        "invisible",
        "hostile",
        "random"
      ]
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 112,
      "avgScore": 73,
      "correctRate": 0.72
    }
  },
  {
    "id": "qst_seed_reading_mcq_multiple_1",
    "module": "reading",
    "type": "reading_mcq_multiple",
    "difficulty": "hard",
    "title": "Multiple Choice Multiple Answers — Education technology 1",
    "instructions": "A passage with a question that has more than one correct option.",
    "prompt": "Which TWO statements are supported by the passage?",
    "passage": "Grid operators once treated demand as fixed and supply as the variable to manage. As household batteries and flexible appliances spread, that assumption reverses: consumption itself becomes schedulable, and the cheapest way to firm a renewable grid may be to shift when energy is used rather than to build additional generation.",
    "correctAnswer": "A, B",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Multiple Choice Multiple Answers task format.",
    "scoringConfig": {
      "criteria": {
        "reading": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Education technology",
    "tags": [
      "education-technology",
      "reading",
      "hard"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.82,
    "status": "published",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "Walkable design reduces reliance on cars.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "Local businesses benefit from steady foot traffic.",
        "isCorrect": true,
        "position": 2
      },
      {
        "label": "C",
        "content": "The passage recommends banning all vehicles.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "Footpaths are described as decorative only.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 119,
      "avgScore": 76,
      "correctRate": 0.8
    }
  },
  {
    "id": "qst_seed_reading_mcq_multiple_2",
    "module": "reading",
    "type": "reading_mcq_multiple",
    "difficulty": "intermediate",
    "title": "Multiple Choice Multiple Answers — Transport planning 2",
    "instructions": "A passage with a question that has more than one correct option.",
    "prompt": "Which TWO statements are supported by the passage?",
    "passage": "City planners increasingly treat footpaths as infrastructure rather than decoration. When a suburb is designed so that shops, schools and transport stops sit within a fifteen-minute walk, residents drive less and local businesses trade more consistently through the week.",
    "correctAnswer": "A, B",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Multiple Choice Multiple Answers task format.",
    "scoringConfig": {
      "criteria": {
        "reading": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Transport planning",
    "tags": [
      "transport-planning",
      "reading",
      "intermediate"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.87,
    "status": "approved",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "Walkable design reduces reliance on cars.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "Local businesses benefit from steady foot traffic.",
        "isCorrect": true,
        "position": 2
      },
      {
        "label": "C",
        "content": "The passage recommends banning all vehicles.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "Footpaths are described as decorative only.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 126,
      "avgScore": 79,
      "correctRate": 0.4
    }
  },
  {
    "id": "qst_seed_reorder_paragraphs_1",
    "module": "reading",
    "type": "reorder_paragraphs",
    "difficulty": "intermediate",
    "title": "Re-order Paragraphs — Food systems 1",
    "instructions": "The student arranges jumbled text blocks into a logical order.",
    "prompt": "Arrange the text blocks in the correct order.",
    "passage": "",
    "correctAnswer": "blk_1, blk_2, blk_3, blk_4",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Re-order Paragraphs task format.",
    "scoringConfig": {
      "criteria": {
        "reading": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Food systems",
    "tags": [
      "food-systems",
      "reading",
      "intermediate"
    ],
    "estimatedSeconds": 150,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.92,
    "status": "published",
    "content": {
      "ordering": [
        {
          "key": "blk_1",
          "content": "A council trial began with a single street closed to through traffic.",
          "correctPosition": 1
        },
        {
          "key": "blk_2",
          "content": "Shopkeepers were initially concerned that deliveries would become difficult.",
          "correctPosition": 2
        },
        {
          "key": "blk_3",
          "content": "After three months, pedestrian counts had risen and delivery windows had been agreed.",
          "correctPosition": 3
        },
        {
          "key": "blk_4",
          "content": "The council now plans to extend the approach to two nearby streets.",
          "correctPosition": 4
        }
      ]
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 133,
      "avgScore": 82,
      "correctRate": 0.48
    }
  },
  {
    "id": "qst_seed_reorder_paragraphs_2",
    "module": "reading",
    "type": "reorder_paragraphs",
    "difficulty": "easy",
    "title": "Re-order Paragraphs — Space research 2",
    "instructions": "The student arranges jumbled text blocks into a logical order.",
    "prompt": "Arrange the text blocks in the correct order.",
    "passage": "",
    "correctAnswer": "blk_1, blk_2, blk_3, blk_4",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Re-order Paragraphs task format.",
    "scoringConfig": {
      "criteria": {
        "reading": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Space research",
    "tags": [
      "space-research",
      "reading",
      "easy"
    ],
    "estimatedSeconds": 150,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.72,
    "status": "draft",
    "content": {
      "ordering": [
        {
          "key": "blk_1",
          "content": "A council trial began with a single street closed to through traffic.",
          "correctPosition": 1
        },
        {
          "key": "blk_2",
          "content": "Shopkeepers were initially concerned that deliveries would become difficult.",
          "correctPosition": 2
        },
        {
          "key": "blk_3",
          "content": "After three months, pedestrian counts had risen and delivery windows had been agreed.",
          "correctPosition": 3
        },
        {
          "key": "blk_4",
          "content": "The council now plans to extend the approach to two nearby streets.",
          "correctPosition": 4
        }
      ]
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 0,
      "avgScore": 55,
      "correctRate": 0.56
    }
  },
  {
    "id": "qst_seed_reading_fill_blanks_1",
    "module": "reading",
    "type": "reading_fill_blanks",
    "difficulty": "easy",
    "title": "Reading Fill in the Blanks — Behavioural science 1",
    "instructions": "The student drags words from a word bank into the blanks in a passage.",
    "prompt": "Select the word that best fits each blank.",
    "passage": "Coastal wetlands store carbon at a rate far higher than most forests, yet they are cleared [[1]] because their value is easy to overlook. Restoring even a narrow strip of mangrove can protect a shoreline during storms while returning habitat to juvenile fish.",
    "correctAnswer": "1: consistent",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Reading Fill in the Blanks task format.",
    "scoringConfig": {
      "criteria": {
        "reading": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Behavioural science",
    "tags": [
      "behavioural-science",
      "reading",
      "easy"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.77,
    "status": "published",
    "content": {
      "blanks": [
        {
          "index": 1,
          "answer": "consistent",
          "choices": [
            "consistent",
            "reluctant",
            "temporary",
            "hidden"
          ]
        }
      ],
      "wordBank": [
        "consistent",
        "reluctant",
        "temporary",
        "hidden"
      ]
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 7,
      "avgScore": 58,
      "correctRate": 0.64
    }
  },
  {
    "id": "qst_seed_reading_fill_blanks_2",
    "module": "reading",
    "type": "reading_fill_blanks",
    "difficulty": "hard",
    "title": "Reading Fill in the Blanks — Water management 2",
    "instructions": "The student drags words from a word bank into the blanks in a passage.",
    "prompt": "Select the word that best fits each blank.",
    "passage": "Behavioural researchers distinguish between habits, which are triggered by context, and intentions, which depend on deliberate attention. Programmes that rely only on information campaigns tend to fade once novelty passes, whereas those that redesign the surrounding environment produce changes that persist long after the intervention ends. Researchers describe this pattern as [[1]] and broadly [[2]].",
    "correctAnswer": "1: consistent; 2: predictable",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Reading Fill in the Blanks task format.",
    "scoringConfig": {
      "criteria": {
        "reading": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Water management",
    "tags": [
      "water-management",
      "reading",
      "hard"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.82,
    "status": "approved",
    "content": {
      "blanks": [
        {
          "index": 1,
          "answer": "consistent",
          "choices": [
            "consistent",
            "reluctant",
            "temporary",
            "hidden"
          ]
        },
        {
          "index": 2,
          "answer": "predictable",
          "choices": [
            "predictable",
            "invisible",
            "hostile",
            "random"
          ]
        }
      ],
      "wordBank": [
        "consistent",
        "reluctant",
        "temporary",
        "hidden",
        "predictable",
        "invisible",
        "hostile",
        "random"
      ]
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 14,
      "avgScore": 61,
      "correctRate": 0.72
    }
  },
  {
    "id": "qst_seed_reading_mcq_single_1",
    "module": "reading",
    "type": "reading_mcq_single",
    "difficulty": "hard",
    "title": "Multiple Choice Single Answer — Digital privacy 1",
    "instructions": "A passage with a question that has exactly one correct option.",
    "prompt": "What is the writer's main point?",
    "passage": "Grid operators once treated demand as fixed and supply as the variable to manage. As household batteries and flexible appliances spread, that assumption reverses: consumption itself becomes schedulable, and the cheapest way to firm a renewable grid may be to shift when energy is used rather than to build additional generation.",
    "correctAnswer": "A",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Multiple Choice Single Answer task format.",
    "scoringConfig": {
      "criteria": {
        "reading": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Digital privacy",
    "tags": [
      "digital-privacy",
      "reading",
      "hard"
    ],
    "estimatedSeconds": 90,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.87,
    "status": "published",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "Everyday infrastructure shapes everyday behaviour.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "Planning decisions rarely affect residents.",
        "isCorrect": false,
        "position": 2
      },
      {
        "label": "C",
        "content": "Retail trade depends mostly on advertising.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "Car ownership is increasing everywhere.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 21,
      "avgScore": 64,
      "correctRate": 0.8
    }
  },
  {
    "id": "qst_seed_reading_mcq_single_2",
    "module": "reading",
    "type": "reading_mcq_single",
    "difficulty": "intermediate",
    "title": "Multiple Choice Single Answer — Urban living 2",
    "instructions": "A passage with a question that has exactly one correct option.",
    "prompt": "What is the writer's main point?",
    "passage": "City planners increasingly treat footpaths as infrastructure rather than decoration. When a suburb is designed so that shops, schools and transport stops sit within a fifteen-minute walk, residents drive less and local businesses trade more consistently through the week.",
    "correctAnswer": "A",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Multiple Choice Single Answer task format.",
    "scoringConfig": {
      "criteria": {
        "reading": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Urban living",
    "tags": [
      "urban-living",
      "reading",
      "intermediate"
    ],
    "estimatedSeconds": 90,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.92,
    "status": "draft",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "Everyday infrastructure shapes everyday behaviour.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "Planning decisions rarely affect residents.",
        "isCorrect": false,
        "position": 2
      },
      {
        "label": "C",
        "content": "Retail trade depends mostly on advertising.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "Car ownership is increasing everywhere.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 28,
      "avgScore": 67,
      "correctRate": 0.4
    }
  },
  {
    "id": "qst_seed_summarize_written_text_1",
    "module": "writing",
    "type": "summarize_written_text",
    "difficulty": "intermediate",
    "title": "Summarize Written Text — Renewable energy 1",
    "instructions": "The student summarises a passage in a single sentence of 5–75 words.",
    "prompt": "Summarise the passage in one sentence of 5 to 75 words.",
    "passage": "Coastal wetlands store carbon at a rate far higher than most forests, yet they are cleared quickly because their value is easy to overlook. Restoring even a narrow strip of mangrove can protect a shoreline during storms while returning habitat to juvenile fish.",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "The passage argues that designing suburbs around short walking distances lowers car use while supporting steadier trade for local businesses.",
    "explanation": "Sample item written for this platform to demonstrate the Summarize Written Text task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "form": 1,
        "grammar": 1,
        "vocabulary": 1
      },
      "maxScore": 20
    },
    "scoreWeight": 1,
    "topic": "Renewable energy",
    "tags": [
      "renewable-energy",
      "writing",
      "intermediate"
    ],
    "estimatedSeconds": 600,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.72,
    "status": "published",
    "content": {
      "wordLimit": {
        "min": 5,
        "max": 75
      }
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 35,
      "avgScore": 70,
      "correctRate": 0.48
    }
  },
  {
    "id": "qst_seed_summarize_written_text_2",
    "module": "writing",
    "type": "summarize_written_text",
    "difficulty": "easy",
    "title": "Summarize Written Text — Remote work 2",
    "instructions": "The student summarises a passage in a single sentence of 5–75 words.",
    "prompt": "Summarise the passage in one sentence of 5 to 75 words.",
    "passage": "City planners increasingly treat footpaths as infrastructure rather than decoration. When a suburb is designed so that shops, schools and transport stops sit within a fifteen-minute walk, residents drive less and local businesses trade more consistently through the week.",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "The passage argues that designing suburbs around short walking distances lowers car use while supporting steadier trade for local businesses.",
    "explanation": "Sample item written for this platform to demonstrate the Summarize Written Text task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "form": 1,
        "grammar": 1,
        "vocabulary": 1
      },
      "maxScore": 20
    },
    "scoreWeight": 1,
    "topic": "Remote work",
    "tags": [
      "remote-work",
      "writing",
      "easy"
    ],
    "estimatedSeconds": 600,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.77,
    "status": "approved",
    "content": {
      "wordLimit": {
        "min": 5,
        "max": 75
      }
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 42,
      "avgScore": 73,
      "correctRate": 0.56
    }
  },
  {
    "id": "qst_seed_write_essay_1",
    "module": "writing",
    "type": "write_essay",
    "difficulty": "easy",
    "title": "Write Essay — Public health 1",
    "instructions": "The student writes a 200–300 word argumentative essay on the given prompt.",
    "prompt": "Governments increasingly fund preventative health programmes instead of hospital treatment. Is this a positive development? Give reasons for your answer.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "A strong response states a clear position in the introduction, develops two or three supported reasons in separate paragraphs, acknowledges the opposing view, and closes with a concise restatement.",
    "explanation": "Sample item written for this platform to demonstrate the Write Essay task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "form": 1,
        "development_structure_coherence": 1,
        "grammar": 1,
        "vocabulary": 1,
        "spelling": 1
      },
      "maxScore": 30
    },
    "scoreWeight": 1,
    "topic": "Public health",
    "tags": [
      "public-health",
      "writing",
      "easy"
    ],
    "estimatedSeconds": 1200,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.82,
    "status": "published",
    "content": {
      "wordLimit": {
        "min": 200,
        "max": 300
      }
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 49,
      "avgScore": 76,
      "correctRate": 0.64
    }
  },
  {
    "id": "qst_seed_write_essay_2",
    "module": "writing",
    "type": "write_essay",
    "difficulty": "hard",
    "title": "Write Essay — Marine biology 2",
    "instructions": "The student writes a 200–300 word argumentative essay on the given prompt.",
    "prompt": "Some people believe universities should focus on employable skills, while others argue their purpose is broad intellectual development. Discuss both views and give your own opinion.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "A strong response states a clear position in the introduction, develops two or three supported reasons in separate paragraphs, acknowledges the opposing view, and closes with a concise restatement.",
    "explanation": "Sample item written for this platform to demonstrate the Write Essay task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "form": 1,
        "development_structure_coherence": 1,
        "grammar": 1,
        "vocabulary": 1,
        "spelling": 1
      },
      "maxScore": 30
    },
    "scoreWeight": 1,
    "topic": "Marine biology",
    "tags": [
      "marine-biology",
      "writing",
      "hard"
    ],
    "estimatedSeconds": 1200,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.87,
    "status": "draft",
    "content": {
      "wordLimit": {
        "min": 200,
        "max": 300
      }
    },
    "options": [],
    "audio": null,
    "image": null,
    "usage": {
      "attempts": 56,
      "avgScore": 79,
      "correctRate": 0.72
    }
  },
  {
    "id": "qst_seed_summarize_spoken_text_1",
    "module": "listening",
    "type": "summarize_spoken_text",
    "difficulty": "hard",
    "title": "Summarize Spoken Text — Education technology 1",
    "instructions": "The student writes a 50–70 word summary of a recording.",
    "prompt": "Write a 50 to 70 word summary of the recording.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "The speaker explains why the topic matters, gives one example, and notes the practical consequence for decision makers.",
    "explanation": "Sample item written for this platform to demonstrate the Summarize Spoken Text task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "form": 1,
        "grammar": 1,
        "vocabulary": 1,
        "spelling": 1
      },
      "maxScore": 25
    },
    "scoreWeight": 1,
    "topic": "Education technology",
    "tags": [
      "education-technology",
      "listening",
      "hard"
    ],
    "estimatedSeconds": 600,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.92,
    "status": "published",
    "content": {
      "wordLimit": {
        "min": 50,
        "max": 70
      }
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/summarize_spoken_text-1.mp3",
      "transcript": "Grid operators once treated demand as fixed and supply as the variable to manage. As household batteries and flexible appliances spread, that assumption reverses: consumption itself becomes schedulable, and the cheapest way to firm a renewable grid may be to shift when energy is used rather than to build additional generation.",
      "durationSeconds": 23
    },
    "image": null,
    "usage": {
      "attempts": 63,
      "avgScore": 82,
      "correctRate": 0.8
    }
  },
  {
    "id": "qst_seed_summarize_spoken_text_2",
    "module": "listening",
    "type": "summarize_spoken_text",
    "difficulty": "intermediate",
    "title": "Summarize Spoken Text — Transport planning 2",
    "instructions": "The student writes a 50–70 word summary of a recording.",
    "prompt": "Write a 50 to 70 word summary of the recording.",
    "passage": "",
    "correctAnswer": "",
    "alternativeAnswers": [],
    "modelAnswer": "The speaker explains why the topic matters, gives one example, and notes the practical consequence for decision makers.",
    "explanation": "Sample item written for this platform to demonstrate the Summarize Spoken Text task format.",
    "scoringConfig": {
      "criteria": {
        "content": 1,
        "form": 1,
        "grammar": 1,
        "vocabulary": 1,
        "spelling": 1
      },
      "maxScore": 25
    },
    "scoreWeight": 1,
    "topic": "Transport planning",
    "tags": [
      "transport-planning",
      "listening",
      "intermediate"
    ],
    "estimatedSeconds": 600,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.72,
    "status": "approved",
    "content": {
      "wordLimit": {
        "min": 50,
        "max": 70
      }
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/summarize_spoken_text-2.mp3",
      "transcript": "City planners increasingly treat footpaths as infrastructure rather than decoration. When a suburb is designed so that shops, schools and transport stops sit within a fifteen-minute walk, residents drive less and local businesses trade more consistently through the week.",
      "durationSeconds": 19
    },
    "image": null,
    "usage": {
      "attempts": 70,
      "avgScore": 55,
      "correctRate": 0.4
    }
  },
  {
    "id": "qst_seed_listening_mcq_multiple_1",
    "module": "listening",
    "type": "listening_mcq_multiple",
    "difficulty": "intermediate",
    "title": "Multiple Choice Multiple Answers — Food systems 1",
    "instructions": "A recording followed by a question with more than one correct option.",
    "prompt": "Which TWO points does the speaker make?",
    "passage": "",
    "correctAnswer": "A, B",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Multiple Choice Multiple Answers task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Food systems",
    "tags": [
      "food-systems",
      "listening",
      "intermediate"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.77,
    "status": "published",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "The effect is easier to overlook than to measure.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "Small restored areas still deliver benefits.",
        "isCorrect": true,
        "position": 2
      },
      {
        "label": "C",
        "content": "The speaker rejects all restoration work.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "Storms have no effect on shorelines.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": {
      "url": "https://assets.example.com/pte-samples/listening_mcq_multiple-1.mp3",
      "transcript": "The conference has been moved to the lecture theatre on the ground floor.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 77,
      "avgScore": 58,
      "correctRate": 0.48
    }
  },
  {
    "id": "qst_seed_listening_mcq_multiple_2",
    "module": "listening",
    "type": "listening_mcq_multiple",
    "difficulty": "easy",
    "title": "Multiple Choice Multiple Answers — Space research 2",
    "instructions": "A recording followed by a question with more than one correct option.",
    "prompt": "Which TWO points does the speaker make?",
    "passage": "",
    "correctAnswer": "A, B",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Multiple Choice Multiple Answers task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Space research",
    "tags": [
      "space-research",
      "listening",
      "easy"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.82,
    "status": "draft",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "The effect is easier to overlook than to measure.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "Small restored areas still deliver benefits.",
        "isCorrect": true,
        "position": 2
      },
      {
        "label": "C",
        "content": "The speaker rejects all restoration work.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "Storms have no effect on shorelines.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": {
      "url": "https://assets.example.com/pte-samples/listening_mcq_multiple-2.mp3",
      "transcript": "The library extension will open before the start of the second semester.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 84,
      "avgScore": 61,
      "correctRate": 0.56
    }
  },
  {
    "id": "qst_seed_listening_fill_blanks_1",
    "module": "listening",
    "type": "listening_fill_blanks",
    "difficulty": "easy",
    "title": "Listening Fill in the Blanks — Behavioural science 1",
    "instructions": "The student types the missing words in a transcript while listening.",
    "prompt": "Type the missing word you hear.",
    "passage": "[[1]] submit your laboratory report to the coordinator by Friday afternoon.",
    "correctAnswer": "1: extension",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Listening Fill in the Blanks task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1,
        "writing": 1
      },
      "maxScore": 10
    },
    "scoreWeight": 1,
    "topic": "Behavioural science",
    "tags": [
      "behavioural-science",
      "listening",
      "easy"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.87,
    "status": "published",
    "content": {
      "blanks": [
        {
          "index": 1,
          "answer": "extension",
          "choices": []
        }
      ]
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/listening_fill_blanks-1.mp3",
      "transcript": "Please submit your laboratory report to the coordinator by Friday afternoon.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 91,
      "avgScore": 64,
      "correctRate": 0.64
    }
  },
  {
    "id": "qst_seed_listening_fill_blanks_2",
    "module": "listening",
    "type": "listening_fill_blanks",
    "difficulty": "hard",
    "title": "Listening Fill in the Blanks — Water management 2",
    "instructions": "The student types the missing words in a transcript while listening.",
    "prompt": "Type the missing word you hear.",
    "passage": "Most [[1]] reported clearer results after the second round of testing.",
    "correctAnswer": "1: extension",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Listening Fill in the Blanks task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1,
        "writing": 1
      },
      "maxScore": 10
    },
    "scoreWeight": 1,
    "topic": "Water management",
    "tags": [
      "water-management",
      "listening",
      "hard"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.92,
    "status": "approved",
    "content": {
      "blanks": [
        {
          "index": 1,
          "answer": "extension",
          "choices": []
        }
      ]
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/listening_fill_blanks-2.mp3",
      "transcript": "Most participants reported clearer results after the second round of testing.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 98,
      "avgScore": 67,
      "correctRate": 0.72
    }
  },
  {
    "id": "qst_seed_highlight_correct_summary_1",
    "module": "listening",
    "type": "highlight_correct_summary",
    "difficulty": "hard",
    "title": "Highlight Correct Summary — Digital privacy 1",
    "instructions": "The student selects the paragraph that best summarises the recording.",
    "prompt": "Select the paragraph that best summarises the recording.",
    "passage": "",
    "correctAnswer": "A",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Highlight Correct Summary task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1,
        "reading": 1
      },
      "maxScore": 10
    },
    "scoreWeight": 1,
    "topic": "Digital privacy",
    "tags": [
      "digital-privacy",
      "listening",
      "hard"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.72,
    "status": "published",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "The recording explains the main idea and its practical consequence with one supporting example.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "The recording lists unrelated statistics without a conclusion.",
        "isCorrect": false,
        "position": 2
      },
      {
        "label": "C",
        "content": "The recording describes a personal anecdote about travel.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "The recording argues against all forms of measurement.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": {
      "url": "https://assets.example.com/pte-samples/highlight_correct_summary-1.mp3",
      "transcript": "The conference has been moved to the lecture theatre on the ground floor.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 105,
      "avgScore": 70,
      "correctRate": 0.8
    }
  },
  {
    "id": "qst_seed_highlight_correct_summary_2",
    "module": "listening",
    "type": "highlight_correct_summary",
    "difficulty": "intermediate",
    "title": "Highlight Correct Summary — Urban living 2",
    "instructions": "The student selects the paragraph that best summarises the recording.",
    "prompt": "Select the paragraph that best summarises the recording.",
    "passage": "",
    "correctAnswer": "A",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Highlight Correct Summary task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1,
        "reading": 1
      },
      "maxScore": 10
    },
    "scoreWeight": 1,
    "topic": "Urban living",
    "tags": [
      "urban-living",
      "listening",
      "intermediate"
    ],
    "estimatedSeconds": 120,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.77,
    "status": "draft",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "The recording explains the main idea and its practical consequence with one supporting example.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "The recording lists unrelated statistics without a conclusion.",
        "isCorrect": false,
        "position": 2
      },
      {
        "label": "C",
        "content": "The recording describes a personal anecdote about travel.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "The recording argues against all forms of measurement.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": {
      "url": "https://assets.example.com/pte-samples/highlight_correct_summary-2.mp3",
      "transcript": "The library extension will open before the start of the second semester.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 112,
      "avgScore": 73,
      "correctRate": 0.4
    }
  },
  {
    "id": "qst_seed_listening_mcq_single_1",
    "module": "listening",
    "type": "listening_mcq_single",
    "difficulty": "intermediate",
    "title": "Multiple Choice Single Answer — Renewable energy 1",
    "instructions": "A recording followed by a question with exactly one correct option.",
    "prompt": "What is the speaker's main purpose?",
    "passage": "",
    "correctAnswer": "A",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Multiple Choice Single Answer task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Renewable energy",
    "tags": [
      "renewable-energy",
      "listening",
      "intermediate"
    ],
    "estimatedSeconds": 90,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.82,
    "status": "published",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "To explain why a small change has a large effect.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "To advertise a commercial product.",
        "isCorrect": false,
        "position": 2
      },
      {
        "label": "C",
        "content": "To describe a personal holiday.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "To criticise a colleague.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": {
      "url": "https://assets.example.com/pte-samples/listening_mcq_single-1.mp3",
      "transcript": "Please submit your laboratory report to the coordinator by Friday afternoon.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 119,
      "avgScore": 76,
      "correctRate": 0.48
    }
  },
  {
    "id": "qst_seed_listening_mcq_single_2",
    "module": "listening",
    "type": "listening_mcq_single",
    "difficulty": "easy",
    "title": "Multiple Choice Single Answer — Remote work 2",
    "instructions": "A recording followed by a question with exactly one correct option.",
    "prompt": "What is the speaker's main purpose?",
    "passage": "",
    "correctAnswer": "A",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Multiple Choice Single Answer task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Remote work",
    "tags": [
      "remote-work",
      "listening",
      "easy"
    ],
    "estimatedSeconds": 90,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.87,
    "status": "approved",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "To explain why a small change has a large effect.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "To advertise a commercial product.",
        "isCorrect": false,
        "position": 2
      },
      {
        "label": "C",
        "content": "To describe a personal holiday.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "To criticise a colleague.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": {
      "url": "https://assets.example.com/pte-samples/listening_mcq_single-2.mp3",
      "transcript": "Most participants reported clearer results after the second round of testing.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 126,
      "avgScore": 79,
      "correctRate": 0.56
    }
  },
  {
    "id": "qst_seed_select_missing_word_1",
    "module": "listening",
    "type": "select_missing_word",
    "difficulty": "easy",
    "title": "Select Missing Word — Public health 1",
    "instructions": "The recording is beeped at the end; the student selects the missing words.",
    "prompt": "Select the option that best completes the recording.",
    "passage": "",
    "correctAnswer": "A",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Select Missing Word task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Public health",
    "tags": [
      "public-health",
      "listening",
      "easy"
    ],
    "estimatedSeconds": 70,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.92,
    "status": "published",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "before the semester begins.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "after the building is demolished.",
        "isCorrect": false,
        "position": 2
      },
      {
        "label": "C",
        "content": "unless the weather improves.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "while the results were rejected.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": {
      "url": "https://assets.example.com/pte-samples/select_missing_word-1.mp3",
      "transcript": "The conference has been moved to the lecture theatre on the ground floor.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 133,
      "avgScore": 82,
      "correctRate": 0.64
    }
  },
  {
    "id": "qst_seed_select_missing_word_2",
    "module": "listening",
    "type": "select_missing_word",
    "difficulty": "hard",
    "title": "Select Missing Word — Marine biology 2",
    "instructions": "The recording is beeped at the end; the student selects the missing words.",
    "prompt": "Select the option that best completes the recording.",
    "passage": "",
    "correctAnswer": "A",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Select Missing Word task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1
      },
      "maxScore": 5
    },
    "scoreWeight": 1,
    "topic": "Marine biology",
    "tags": [
      "marine-biology",
      "listening",
      "hard"
    ],
    "estimatedSeconds": 70,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.72,
    "status": "draft",
    "content": {},
    "options": [
      {
        "label": "A",
        "content": "before the semester begins.",
        "isCorrect": true,
        "position": 1
      },
      {
        "label": "B",
        "content": "after the building is demolished.",
        "isCorrect": false,
        "position": 2
      },
      {
        "label": "C",
        "content": "unless the weather improves.",
        "isCorrect": false,
        "position": 3
      },
      {
        "label": "D",
        "content": "while the results were rejected.",
        "isCorrect": false,
        "position": 4
      }
    ],
    "audio": {
      "url": "https://assets.example.com/pte-samples/select_missing_word-2.mp3",
      "transcript": "The library extension will open before the start of the second semester.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 0,
      "avgScore": 55,
      "correctRate": 0.72
    }
  },
  {
    "id": "qst_seed_highlight_incorrect_words_1",
    "module": "listening",
    "type": "highlight_incorrect_words",
    "difficulty": "hard",
    "title": "Highlight Incorrect Words — Education technology 1",
    "instructions": "The student highlights transcript words that differ from the recording.",
    "prompt": "Highlight the words in the transcript that differ from the recording.",
    "passage": "Please submit your laboratory report to the coordinator by Friday afternoon.",
    "correctAnswer": "laboratory, resorts",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Highlight Incorrect Words task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1,
        "reading": 1
      },
      "maxScore": 10
    },
    "scoreWeight": 1,
    "topic": "Education technology",
    "tags": [
      "education-technology",
      "listening",
      "hard"
    ],
    "estimatedSeconds": 110,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.77,
    "status": "published",
    "content": {
      "incorrectWords": [
        "laboratory",
        "resorts"
      ]
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/highlight_incorrect_words-1.mp3",
      "transcript": "Please submit your laboratory report to the coordinator by Friday afternoon.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 7,
      "avgScore": 58,
      "correctRate": 0.8
    }
  },
  {
    "id": "qst_seed_highlight_incorrect_words_2",
    "module": "listening",
    "type": "highlight_incorrect_words",
    "difficulty": "intermediate",
    "title": "Highlight Incorrect Words — Transport planning 2",
    "instructions": "The student highlights transcript words that differ from the recording.",
    "prompt": "Highlight the words in the transcript that differ from the recording.",
    "passage": "Most participants reported clearer resorts after the second round of testing.",
    "correctAnswer": "laboratory, resorts",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Highlight Incorrect Words task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1,
        "reading": 1
      },
      "maxScore": 10
    },
    "scoreWeight": 1,
    "topic": "Transport planning",
    "tags": [
      "transport-planning",
      "listening",
      "intermediate"
    ],
    "estimatedSeconds": 110,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.82,
    "status": "approved",
    "content": {
      "incorrectWords": [
        "laboratory",
        "resorts"
      ]
    },
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/highlight_incorrect_words-2.mp3",
      "transcript": "Most participants reported clearer results after the second round of testing.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 14,
      "avgScore": 61,
      "correctRate": 0.4
    }
  },
  {
    "id": "qst_seed_write_from_dictation_1",
    "module": "listening",
    "type": "write_from_dictation",
    "difficulty": "intermediate",
    "title": "Write from Dictation — Food systems 1",
    "instructions": "The student types the sentence they hear, word for word.",
    "prompt": "Type the sentence exactly as you hear it.",
    "passage": "",
    "correctAnswer": "The conference has been moved to the lecture theatre on the ground floor.",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Write from Dictation task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1,
        "writing": 1
      },
      "maxScore": 10
    },
    "scoreWeight": 1,
    "topic": "Food systems",
    "tags": [
      "food-systems",
      "listening",
      "intermediate"
    ],
    "estimatedSeconds": 60,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.87,
    "status": "published",
    "content": {},
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/write_from_dictation-1.mp3",
      "transcript": "The conference has been moved to the lecture theatre on the ground floor.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 21,
      "avgScore": 64,
      "correctRate": 0.48
    }
  },
  {
    "id": "qst_seed_write_from_dictation_2",
    "module": "listening",
    "type": "write_from_dictation",
    "difficulty": "easy",
    "title": "Write from Dictation — Space research 2",
    "instructions": "The student types the sentence they hear, word for word.",
    "prompt": "Type the sentence exactly as you hear it.",
    "passage": "",
    "correctAnswer": "The library extension will open before the start of the second semester.",
    "alternativeAnswers": [],
    "modelAnswer": "",
    "explanation": "Sample item written for this platform to demonstrate the Write from Dictation task format.",
    "scoringConfig": {
      "criteria": {
        "listening": 1,
        "writing": 1
      },
      "maxScore": 10
    },
    "scoreWeight": 1,
    "topic": "Space research",
    "tags": [
      "space-research",
      "listening",
      "easy"
    ],
    "estimatedSeconds": 60,
    "sourceReference": "Original sample content authored in-house.",
    "adminNotes": "Seed example. Replace with reviewed production content before launch.",
    "aiConfidence": 0.92,
    "status": "draft",
    "content": {},
    "options": [],
    "audio": {
      "url": "https://assets.example.com/pte-samples/write_from_dictation-2.mp3",
      "transcript": "The library extension will open before the start of the second semester.",
      "durationSeconds": 8
    },
    "image": null,
    "usage": {
      "attempts": 28,
      "avgScore": 67,
      "correctRate": 0.56
    }
  }
] as SeedQuestion[];
