import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/auth";

/**
 * Wraps a route handler so guards and validation failures become predictable
 * JSON responses instead of 500s, and so internal errors never leak details.
 */
export async function handleRoute<T>(work: () => Promise<T>) {
  try {
    const data = await work();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }
    if (error instanceof Error && error.message.includes("E11000")) {
      return NextResponse.json(
        { message: "Já existe um registro com esses dados" },
        { status: 409 }
      );
    }

    console.error("Unhandled API error:", error);
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
