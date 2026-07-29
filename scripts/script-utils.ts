import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Next.js loads .env.local automatically but plain tsx runs do not, so the
 * migration scripts read it themselves before touching process.env.
 */
export function loadEnv(files = [".env.local", ".env"]) {
  for (const file of files) {
    let contents: string;
    try {
      contents = readFileSync(resolve(process.cwd(), file), "utf8");
    } catch {
      continue;
    }

    for (const line of contents.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!match) continue;
      const [, key, rawValue = ""] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
    }
  }
}

/**
 * Class names reproduce the headings from the old hardcoded pages so the class
 * page keeps rendering exactly the same title it does today.
 */
const GRADE_TITLES: Record<string, string> = {
  "3": "3º Ano: Montagens iniciais",
  "4": "4º Ano: Montagens iniciais",
  "5": "5º Ano: Montagens iniciais",
  "6": "6º Ano: Práticas iniciais",
  "7": "7º Ano: Robótica em ação",
  "8": "8º Ano: Robótica em ação",
  "10": "Life Projects: Sementes da Educação 2",
};

export function classTitleForGrade(grade: string) {
  return GRADE_TITLES[grade] ?? `${grade}º Ano`;
}
