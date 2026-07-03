// Projects that aren't built yet. Shared by the home page and the /projects
// page so this list only has to be updated in one place. When one of these
// ships, move it out of here and add it as a live item on both pages.

export type ComingSoonItem = {
  tag: string;
  title: string;
  desc: string;
};

export const COMING_SOON: ComingSoonItem[] = [
  {
    tag: "Agents",
    title: "A task-running agent",
    desc: "Runs multi-step tasks and takes actions on its own.",
  },
  {
    tag: "Extraction",
    title: "Smart extractor",
    desc: "Turns messy text into clean, structured data.",
  },
];
