// models/Sponsor.ts
import mongoose, { Schema, model, models, InferSchemaType } from 'mongoose';

const sponsorSchema = new Schema({
    company_name: { type: String, required: true },
    category: { type: String, required: true },
    map_location: {
        x_coord: { type: Number, required: true },
        y_coord: { type: Number, required: true }
    },
    sponsorship_package_cost: { type: Number, required: true },
    current_pokemon_spawn: {
        name: { type: String, required: true },
        rarity: { type: String, enum: ['Normal', 'Rare', 'Legendary'], default: 'Normal' },
        active_until: { type: Date }
    }
}, { timestamps: true });

export type SponsorType = InferSchemaType<typeof sponsorSchema>;
export const Sponsor = models.Sponsor || model('Sponsor', sponsorSchema);