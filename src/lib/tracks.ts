import type { FeaturedTrack } from "./types";

export const FEATURED_TRACKS: FeaturedTrack[] = [
  {
    id: "python",
    subject: "Python Programming",
    tagline: "From variables to writing real programs that solve problems.",
    goal: "Become comfortable writing small Python programs on my own",
    accent: "#3D7A6B",
    glyph: "{ }",
  },
  {
    id: "algebra",
    subject: "Algebra",
    tagline: "Equations, functions, and the language of relationships.",
    goal: "Confidently solve and reason about algebra problems",
    accent: "#B86B3A",
    glyph: "x²",
  },
];

/** Suggestions shown under the custom-subject field. Anything works — these
 * just nudge the learner. The whole path is generated live by Claude. */
export const SUBJECT_SUGGESTIONS = [
  "Machine Learning",
  "Music Theory",
  "Spanish Grammar",
  "Statistics",
  "Microeconomics",
  "Chess Tactics",
  "Organic Chemistry",
  "SQL & Databases",
];
