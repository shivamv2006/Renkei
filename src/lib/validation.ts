import { z } from 'zod';

export const normalizeUsername = (raw: string): string => {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/^@+/, '').toLowerCase();
};

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password cannot exceed 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const usernameSchema = z
  .string()
  .transform((val) => normalizeUsername(val))
  .pipe(
    z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  );

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required')
  .max(50, 'Display name cannot exceed 50 characters');

export const signupSchema = z
  .object({
    email: emailSchema,
    displayName: displayNameSchema,
    username: z.string().optional().or(z.literal('')),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const createMessageSchema = z
  .object({
    conversationId: z.string().uuid('Invalid conversation ID'),
    content: z.string().max(4000, 'Message cannot exceed 4000 characters').default(''),
    messageType: z.enum(['text', 'image', 'video', 'audio', 'document', 'call']).default('text'),
    replyToId: z.string().uuid().nullable().optional(),
    attachments: z.array(z.any()).optional().default([]),
  })
  .refine(
    (data) => (data.content && data.content.trim().length > 0) || (data.attachments && data.attachments.length > 0),
    {
      message: 'Message cannot be completely empty without attachments',
      path: ['content'],
    }
  );

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(60, 'Group name cannot exceed 60 characters'),
  description: z.string().max(300, 'Description cannot exceed 300 characters').optional().default(''),
  memberIds: z.array(z.string().min(1)).min(1, 'Please select at least one member for the group'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
