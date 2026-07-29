import { z } from "zod";
import { ROLES, STATUSES } from "@/lib/types";
import { normalizeDriveImageLink, normalizeDriveLink } from "@/lib/links";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Identificador inválido");
const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === "" || /^(https?:\/\/|\/)/.test(value), {
    message: "Informe uma URL válida",
  })
  .optional()
  .or(z.literal(""));

/** Same as optionalUrl, but rewrites Drive sharing links so iframes can embed them. */
const embeddableUrl = optionalUrl.transform((value) =>
  value ? normalizeDriveLink(value) : value
);

/** Same as optionalUrl, but rewrites Drive links to a URL that serves image bytes. */
const imageUrl = optionalUrl.transform((value) =>
  value ? normalizeDriveImageLink(value) : value
);

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Informe o usuário"),
  password: z.string().min(1, "Informe a senha"),
  /**
   * Each sign-in page is role-specific. Sending the expected role lets the
   * server refuse the mismatch without ever issuing a session cookie, which the
   * old client-side check could not do.
   */
  expectedRole: z.enum(ROLES).optional(),
});

const userBase = {
  name: z.string().trim().min(1, "Informe o nome"),
  lastName: z.string().trim().max(120).optional().default(""),
  username: z.string().trim().min(3, "O usuário precisa ter ao menos 3 caracteres"),
  role: z.enum(ROLES),
  status: z.enum(STATUSES).default("active"),
  classes: z.array(objectId).default([]),
};

/**
 * The definition gives students a single class, teachers a list, and admins
 * none, so cardinality is validated here instead of in each route handler.
 */
function checkClassCardinality(
  value: { role: string; classes: string[] },
  ctx: z.RefinementCtx
) {
  if (value.role === "student" && value.classes.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["classes"],
      message: "Alunos devem estar em exatamente uma turma",
    });
  }
  if (value.role === "admin" && value.classes.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["classes"],
      message: "Administradores não pertencem a turmas",
    });
  }
}

export const createUserSchema = z
  .object({
    ...userBase,
    password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres"),
  })
  .superRefine(checkClassCardinality);

export const updateUserSchema = z
  .object({
    ...userBase,
    password: z
      .string()
      .min(6, "A senha precisa ter ao menos 6 caracteres")
      .optional()
      .or(z.literal("")),
  })
  .superRefine(checkClassCardinality);

export const classSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da turma"),
  grade: z.string().trim().min(1, "Informe o ano/série"),
  institution: z.string().trim().min(1, "Informe a instituição"),
  status: z.enum(STATUSES).default("active"),
  users: z.array(objectId).default([]),
});

export const classMembersSchema = z.object({
  userId: objectId,
});

/** Body of the status-only endpoints, which the list toggles use. */
export const statusSchema = z.object({
  status: z.enum(STATUSES),
});

export const activitySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da atividade"),
  cover: imageUrl,
  // `extra` opens in a new tab, where the original sharing link works best.
  extra: optionalUrl,
  guide: embeddableUrl,
  activityBook: embeddableUrl,
  teacherGuide: embeddableUrl,
  classes: z.array(objectId).default([]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;
