import { Schema, model, models, type Model } from "mongoose";

export interface UserDoc {
  username: string;
  email: string;
  password?: string;
  avatar: string;
  createdAt: Date;
}

const userSchema = new Schema<UserDoc>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { 
    type: String, 
    default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" 
  },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel: Model<UserDoc> =
  (models.User as Model<UserDoc> | undefined) ??
  model<UserDoc>("User", userSchema);
