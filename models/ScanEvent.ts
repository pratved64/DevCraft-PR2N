// models/ScanEvent.ts
import mongoose, { Schema, model, models, InferSchemaType } from 'mongoose';

const scanEventSchema = new Schema({
    student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sponsor_id: { type: Schema.Types.ObjectId, ref: 'Sponsor', required: true },
    timestamp: { type: Date, default: Date.now },
    pokemon_caught: {
        name: { type: String, required: true },
        type: { type: String, required: true },
        rarity: { type: String, enum: ['Normal', 'Rare', 'Legendary'], required: true }
    },
    points_awarded: { type: Number, required: true },
    sync_status: { type: Boolean, default: true } // Handles offline-sync states
});

// Compound index for lightning-fast dashboard aggregations
scanEventSchema.index({ sponsor_id: 1, timestamp: -1 });

export type ScanEventType = InferSchemaType<typeof scanEventSchema>;
export const ScanEvent = models.ScanEvent || model('ScanEvent', scanEventSchema);