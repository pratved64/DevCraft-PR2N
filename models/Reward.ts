// models/Reward.ts
import mongoose, { Schema, model, models, InferSchemaType } from 'mongoose';

const rewardSchema = new Schema({
    item_name: { type: String, required: true },
    category: { type: String, required: true },
    cost_in_points: { type: Number, required: true },
    requires_legendary: { type: Boolean, default: false },
    stock_remaining: { type: Number, required: true, min: 0 }
}, { timestamps: true });

export type RewardType = InferSchemaType<typeof rewardSchema>;
export const Reward = models.Reward || model('Reward', rewardSchema);