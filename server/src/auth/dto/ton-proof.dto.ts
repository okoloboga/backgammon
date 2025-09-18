import { z } from 'zod';

export const TonProofItemReplySuccessSchema = z.object({
  name: z.literal('ton_proof'),
  proof: z.object({
    timestamp: z.number(),
    domain: z.object({
      lengthBytes: z.number(),
      value: z.string(),
    }),
    signature: z.string(),
    payload: z.string(),
    state_init: z.string(),
  }),
});

export const CheckProofRequestSchema = z.object({
  address: z.string(),
  network: z.enum(['mainnet', 'testnet']),
  public_key: z.string(),
  proof: z.object({
    timestamp: z.number(),
    domain: z.object({
      lengthBytes: z.number(),
      value: z.string(),
    }),
    payload: z.string(),
    signature: z.string(),
    state_init: z.string(),
  }),
  payloadToken: z.string(),
});

export const GeneratePayloadResponseSchema = z.object({
  payloadToken: z.string(),
  payloadTokenHash: z.string(),
});

export const CheckProofResponseSchema = z.object({
  token: z.string(),
});

export type TonProofItemReplySuccess = z.infer<
  typeof TonProofItemReplySuccessSchema
>;
export type CheckProofRequestDto = z.infer<typeof CheckProofRequestSchema>;
export type GeneratePayloadResponseDto = z.infer<
  typeof GeneratePayloadResponseSchema
>;
export type CheckProofResponseDto = z.infer<typeof CheckProofResponseSchema>;
