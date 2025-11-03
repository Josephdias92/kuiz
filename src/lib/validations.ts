import { z } from "zod";

// Auth schemas
export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Template schemas
export const createTemplateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  isPublic: z.boolean().default(false),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// Question schemas
export const questionSchema = z.object({
  type: z.enum([
    "MULTIPLE_CHOICE",
    "CHECKBOX",
    "TRUE_FALSE",
    "IMAGE_CHOICE",
    "TEXT_INPUT",
  ]),
  text: z.string().min(1, "Question text is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  options: z.array(z.string()).min(2, "At least 2 options are required"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  points: z.number().int().positive().default(10),
  timeLimit: z.number().int().positive().optional(),
});

export const createQuestionSchema = questionSchema.extend({
  templateId: z.string(),
  order: z.number().int().nonnegative(),
});

// Session schemas
export const createSessionSchema = z.object({
  templateId: z.string(),
  mode: z.enum(["FREE_PLAY", "HOST_CONTROLLED"]).default("FREE_PLAY"),
});

export const joinSessionSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
});

// Response schema
export const submitResponseSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  participantId: z.string(),
  answer: z.string(),
  timedOut: z.boolean().optional(), // Flag to indicate timeout
});

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type JoinSessionInput = z.infer<typeof joinSessionSchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
