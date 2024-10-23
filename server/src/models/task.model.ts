// models/task.model.ts
import { Schema, model, Document } from 'mongoose';

interface ITask extends Document {
  title: string;
  description: string;
  status: string;
  assignedTo?: string;
  dueDate?: Date;
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: false },
  description: { type: String, required: false },
  status: { type: String, required: false },
  assignedTo: { type: String },
  dueDate: { type: Date },
}, { timestamps: true });

const TaskModel = model<ITask>('Task', taskSchema);

export default TaskModel;
export { ITask };
