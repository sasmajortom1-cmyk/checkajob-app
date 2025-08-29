"use client";

import { useState } from 'react';

interface AssessmentResult {
  decision: string;
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

export default function HomePage() {
  const [description, setDescription] = useState('');
  const [skillLevel, setSkillLevel] = useState<'novice' | 'intermediate' | 'advanced'>('novice');
  const [tags, setTags] = useState('');
  const [postcode, setPostcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          skillLevel,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          postcode: postcode.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to assess job');
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto max-w-3xl p-4">
      <h1 className="text-3xl font-bold mb-4">CheckaJob</h1>
      <p className="mb-6 text-gray-700">
        Enter a brief description of your DIY project, pick your skill level and get a risk
        assessment, guidance and whether you should tackle it yourself or call in a professional.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1" htmlFor="description">
            Job description
          </label>
          <textarea
            id="description"
            required
            rows={3}
            className="w-full rounded-md border border-gray-300 p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="skill">
            Your skill level
          </label>
          <select
            id="skill"
            className="w-full rounded-md border border-gray-300 p-2"
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value as any)}
          >
            <option value="novice">Novice</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="tags">
            Tags (optional, comma separated)
          </label>
          <input
            id="tags"
            type="text"
            className="w-full rounded-md border border-gray-300 p-2"
            placeholder="plasterboard, bracket"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="postcode">
            Postcode (optional)
          </label>
          <input
            id="postcode"
            type="text"
            className="w-full rounded-md border border-gray-300 p-2"
            placeholder="e.g. RG14 1AA"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Assessing…' : 'Assess job'}
        </button>
      </form>
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-200 text-red-800 rounded-md">
          {error}
        </div>
      )}
      {result && (
        <div className="mt-6">
          <div className="mb-4">
            <span className="px-3 py-1 rounded-full text-sm font-semibold text-white bg-green-600">
              {result.decision}
            </span>
            <span className="ml-2 text-gray-600">Difficulty score: {result.score}</span>
          </div>
          <div className="space-y-4">
            <section>
              <h2 className="font-semibold">Rationale</h2>
              <ul className="list-disc list-inside">
                {result.rationale.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-semibold">Steps</h2>
              <ol className="list-decimal list-inside">
                {result.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>
            <section>
              <h2 className="font-semibold">Tools</h2>
              <ul className="list-disc list-inside">
                {result.tools.map((tool, i) => (
                  <li key={i}>{tool}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-semibold">Materials</h2>
              <ul className="list-disc list-inside">
                {result.materials.map((mat, i) => (
                  <li key={i}>{mat}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-semibold">Safety notes</h2>
              <ul className="list-disc list-inside">
                {result.safety.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </section>
            {typeof result.durationMin !== 'undefined' && (
              <section>
                <h2 className="font-semibold">Estimated duration</h2>
                <p>{result.durationMin} minutes</p>
              </section>
            )}
            {typeof result.costLow !== 'undefined' && typeof result.costHigh !== 'undefined' && (
              <section>
                <h2 className="font-semibold">Estimated cost</h2>
                <p>
                  £{result.costLow} – £{result.costHigh}
                </p>
              </section>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
