import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import OpenAI from 'openai';

/**
 * Simple knowledge base representing common DIY jobs. This is used
 * whenever an OpenAI API key is not provided. It is intentionally minimal
 * and can be extended easily. Each job includes a baseDifficulty (1–10),
 * a risk profile and typical guidance.
 */
const KB = {
  hang_shelf: {
    name: 'Hang a Wall Shelf',
    baseDifficulty: 4,
    risk: { electrical: false, plumbing: false, structural: false, workingAtHeight: false },
    steps: [
      'Locate studs or use appropriate wall anchors for your wall type.',
      'Measure and mark level bracket positions.',
      'Pre‑drill pilot holes.',
      'Fix brackets securely.',
      'Place shelf and secure per instructions.',
      'Load gradually and check for level.',
    ],
    tools: ['Drill/driver', 'Level', 'Tape measure', 'Stud finder (or tapping method)', 'Screwdriver'],
    materials: ['Wall plugs/anchors', 'Screws', 'Shelf + brackets'],
    safety: ['Wear eye protection when drilling.', 'Use anchors that match wall type and load.'],
  },
  replace_tap_washer: {
    name: 'Replace a Tap Washer',
    baseDifficulty: 5,
    risk: { electrical: false, plumbing: true, structural: false, workingAtHeight: false },
    steps: [
 
      
      'Isolate water supply (shut‑off valve).',
      'Open tap to relieve pressure.',
      'Disassemble tap handle and bonnet.',
      'Replace washer/O‑ring with matching size.',
      'Reassemble and restore water.',
      'Check for leaks.',
    ],
    tools: ['Adjustable spanner', 'Screwdrivers', 'Plumber’s grease', 'Allen keys'],
    materials: ['Correct size washer/O‑ring'],
    safety: ['Double‑check isolation valves.', 'Protect chrome surfaces to avoid scratching.'],
  },
  paint_wall: {
    name: 'Paint an Interior Wall',
    baseDifficulty: 3,
    risk: { electrical: false, plumbing: false, structural: false, workingAtHeight: false },
    steps: [
      'Fill holes and sand smooth; dust off.',
      'Mask edges and cover floors/furniture.',
      'Cut in edges with brush.',
      'Roll first coat top‑to‑bottom.',
      'Allow to dry; apply second coat.',
      'Remove tape before fully dry for clean lines.',
    ],
    tools: ['Roller + tray', 'Brush (2")', 'Filler + sanding block', 'Dust sheet', 'Masking tape'],
    materials: ['Emulsion paint', 'Filler'],
    safety: ['Ventilate the room.', 'Use a stable step if needed; don’t overreach.'],
  },
  fit_light_fixture: {
    name: 'Fit a New Ceiling Light Fixture',
    baseDifficulty: 7,
    risk: { electrical: true, plumbing: false, structural: false, workingAtHeight: true },
    steps: [
      'Isolate circuit at consumer unit and verify dead.',
      'Note existing wiring configuration.',
      'Connect live/neutral/earth per manufacturer and local regs.',
      'Mount fixture securely.',
      'Restore power and test.',
    ],
    tools: ['Voltage tester', 'Screwdrivers', 'Wire strippers', 'Step ladder'],
    materials: ['Connector blocks/Wago', 'Light fixture', 'Fixings'],
    safety: [
      'If unsure about wiring identification or regs, use a qualified electrician.',
      'Always prove dead before touching conductors.',
    ],
  },
;

type JobKey = keyof typeof KB;

interface AssessmentInput {
  description: string;
  skillLevel: 'novice' | 'intermediate' | 'advanced';
  tags?: string[];
  postcode?: string;
}

interface AssessmentOutput {
  decision: 'DIY' | 'Get a Pro';
  score: number;
  rationale: string[];
  steps: string[];
  tools: string[];
  materials: string[];
  safety: string[];
  durationMin?: number;
  costLow?: number;
  costHigh?: number;
}

/**
 * Infer a job from a description and optional tags by simple keyword matching.
 */
function inferJob(input: AssessmentInput): JobKey | null {
  const text = `${input.description} ${(input.tags || []).join(' ')}`.toLowerCase();
  if (text.match(/(shelf|bracket|wall anchor)/)) return 'hang_shelf';
  if (text.match(/(tap|washer|o\s?ring)/)) return 'replace_tap_washer';
  if (text.match(/(paint|roller|brush)/)) return 'paint_wall';
  if (text.match(/(light|fixture|ceiling)/)) return 'fit_light_fixture';
  return null;
}

/**
 * Generate a simple risk assessment using our knowledge base. Scores are
 * computed as (baseDifficulty * 10) + (penalty based on risk vs skill).
 */
function assessFromKB(input: AssessmentInput, jobKey: JobKey): AssessmentOutput {
  const job = KB[jobKey];
  // convert skill to numeric (novice=1, intermediate=2, advanced=3)
  const skillNum = { novice: 1, intermediate: 2, advanced: 3 }[input.skillLevel];
  let score = job.baseDifficulty * 10;
  const rationale: string[] = [];
  // add penalties for risks vs skill
  if (job.risk.electrical) {
    score += 20;
    rationale.push('Electrical work can be dangerous and may require certification.');
    if (skillNum < 3) rationale.push('You indicated you are not advanced; electrical tasks are high risk.');
  }
  if (job.risk.plumbing) {
    score += 10;
    rationale.push('Plumbing jobs risk leaks and water damage if done incorrectly.');
  }
  if (job.risk.workingAtHeight) {
    score += 10;
    rationale.push('Working at height increases the chance of falls.');
  }
  // skill reduces overall score slightly
  score = Math.min(100, Math.max(1, score - (skillNum - 1) * 10));
  const decision: 'DIY' | 'Get a Pro' = score > 60 ? 'Get a Pro' : 'DIY';
  if (decision === 'DIY') {
    rationale.unshift('This task appears feasible for your skill level.');
  } else {
    rationale.unshift('This task may be too challenging or risky for you.');
  }
  return {
    decision,
    score,
    rationale,
    steps: job.steps,
    tools: job.tools,
    materials: job.materials,
    safety: job.safety,
  };
}

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const input: AssessmentInput = {
    description: body.description || '',
    skillLevel: body.skillLevel || 'novice',
    tags: Array.isArray(body.tags) ? body.tags : [],
    postcode: body.postcode,
  };
  // If the environment variable exists, attempt to call OpenAI for a real assessment
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const systemPrompt =
        'You are CheckaJob, a cautious UK DIY assessor. You must be practical and risk‑aware. Prefer safety and clarity over bravado. Output strict JSON with the exact keys: decision, score, rationale, steps, tools, materials, safety, durationMin, costLow, costHigh.';
      const userPrompt = `Description: ${input.description}\nSkill level: ${input.skillLevel}\nPhoto tags (if any): ${(input.tags || [])
        .filter(Boolean)
        .join(', ')}\nConstraints: UK terminology, metric units, cautious tone.\nScoring: 0 (trivial) to 100 (expert). DIY only if appropriate for the provided skill level.`;
      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      });
      const content = chatResponse.choices?.[0]?.message?.content;
      if (content) {
        try {
          const json = JSON.parse(content);
          return NextResponse.json(json);
        } catch {
          // fallback to knowledge base
        }
      }
    } catch (err) {
      // ignore and fall back
    }
  }
  // fallback to simple knowledge base
  const jobKey = inferJob(input);
  if (jobKey) {
    const assessment = assessFromKB(input, jobKey);
    return NextResponse.json(assessment);
  }
  // unknown job
  return NextResponse.json(
    {
      decision: 'Get a Pro',
      score: 75,
      rationale: [
        'Unable to match your description to our known jobs.',
        'For ambiguous or unknown tasks, we err on the side of caution.',
      ],
      steps: [],
      tools: [],
      materials: [],
      safety: [
        'Please consult a professional or provide more details to get specific advice.',
      ],
    },
    { status: 200 }
  );
}
