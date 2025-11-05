import mongoose, { Schema, Document } from "mongoose";

// Define the structure for a single transcript entry
const TranscriptSchema = new Schema({
  speaker: { type: String, enum: ["AI", "User"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Define the structure for the interview feedback
const FeedbackSchema = new Schema({
  technicalScore: { type: Number, min: 0, max: 10 },
  communicationScore: { type: Number, min: 0, max: 10 },
  problemSolvingScore: { type: Number, min: 0, max: 10 },
  overallFeedback: { type: String },
  strengths: { type: String },
  areasForImprovement: { type: String },
});

// Define the main interview document interface
export interface IInterview extends Document {
  userId: string;
  jobRole: string;
  skills: string;
  experience: string;
  resumeText: string | null;
  transcript: { speaker: string; text: string; timestamp?: Date }[];
  feedback: {
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    overallFeedback: string;
    strengths: string;
    areasForImprovement: string;
  } | null;
  codingQuestionPlan: number[];
  projectQuestionPlan: number[]; // <-- ADD THIS LINE
  createdAt: Date;
}

// Define the main interview schema
const InterviewSchema: Schema = new Schema({
  userId: { type: String, required: true },
  jobRole: { type: String, required: true },
  skills: { type: String, required: true },
  experience: { type: String, required: true },
  resumeText: { type: String, default: null },
  transcript: [TranscriptSchema],
  feedback: { type: FeedbackSchema, default: null },
  codingQuestionPlan: { type: [Number], default: [] },
  projectQuestionPlan: { type: [Number], default: [] }, // <-- ADD THIS LINE
  createdAt: { type: Date, default: Date.now },
});

const Interview =
  mongoose.models.Interview ||
  mongoose.model<IInterview>("Interview", InterviewSchema);

export default Interview;