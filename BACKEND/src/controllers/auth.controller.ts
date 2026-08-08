import mongoose from "mongoose";
import type { NextFunction, Request, Response } from "express";
import { UserModel } from "../models/user.model";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function wrap(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

// In-memory fallback database for local development offline mode
interface MockUser {
  _id: string;
  username: string;
  email: string;
  password?: string;
  avatar: string;
}
const mockUsers: MockUser[] = [
  {
    _id: "mock-amanda",
    username: "amanda",
    email: "amanda@example.com",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
  }
];

export const authController = {
  register: wrap(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ success: false, error: "Please enter all fields." });
      return;
    }

    // Check if MongoDB is connected
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      console.warn("MongoDB not connected. Registering user in mock memory database.");
      const existing = mockUsers.find(u => u.username === username || u.email === email);
      if (existing) {
        res.status(400).json({ success: false, error: "User already exists with that email or username." });
        return;
      }
      const newUser = {
        _id: "mock-" + Date.now(),
        username,
        email,
        password,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
      };
      mockUsers.push(newUser);
      res.status(201).json({
        success: true,
        data: {
          userId: newUser._id,
          username: newUser.username,
          email: newUser.email,
          avatar: newUser.avatar
        }
      });
      return;
    }

    // Check if user already exists in MongoDB
    const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ success: false, error: "User already exists with that email or username." });
      return;
    }

    const newUser = new UserModel({
      username,
      email,
      password // Plaintext password as requested/kept simple for development
    });

    const savedUser = await newUser.save();
    res.status(201).json({
      success: true,
      data: {
        userId: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        avatar: savedUser.avatar
      }
    });
  }),

  login: wrap(async (req, res) => {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      res.status(400).json({ success: false, error: "Please enter all fields." });
      return;
    }

    // Check if MongoDB is connected
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      console.warn("MongoDB not connected. Validating user in mock memory database.");
      const user = mockUsers.find(u => 
        (u.username === emailOrUsername || u.email === emailOrUsername) && 
        u.password === password
      );

      if (!user) {
        res.status(400).json({ success: false, error: "Invalid credentials (Mock Database)." });
        return;
      }

      res.json({
        success: true,
        data: {
          userId: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar
        }
      });
      return;
    }

    // Find user in MongoDB
    const user = await UserModel.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user || user.password !== password) {
      res.status(400).json({ success: false, error: "Invalid credentials." });
      return;
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  })
};
