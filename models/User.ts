// models/User.ts
import mongoose, { Schema, model, models, InferSchemaType } from 'mongoose';

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    demographics: {
        major: { type: String },
        grad_year: { type: Number }
    },
    wallet: {
        total_points: { type: Number, default: 0 },
        legendaries_caught: { type: Number, default: 0 }
    },
    // Array of references linking to the ScanEvents collection
    pokedex: [{ type: Schema.Types.ObjectId, ref: 'ScanEvent' }]
}, { timestamps: true });

// Extracts the pure TypeScript type for your frontend team to use
export type UserType = InferSchemaType<typeof userSchema>;

// Prevents the Next.js OverwriteModelError during hot-reloads
export const User = models.User || model('User', userSchema);