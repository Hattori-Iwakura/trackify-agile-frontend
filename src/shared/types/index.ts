// Enums mirroring backend Prisma schema
export enum GlobalRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum ProjectRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum IssueStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  LOWEST = 'LOWEST',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  HIGHEST = 'HIGHEST',
}

export enum IssueType {
  EPIC = 'EPIC',
  STORY = 'STORY',
  TASK = 'TASK',
  BUG = 'BUG',
  SUBTASK = 'SUBTASK',
}

export enum SprintStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum NotificationType {
  ISSUE_ASSIGNED = 'ISSUE_ASSIGNED',
  ISSUE_STATUS_CHANGED = 'ISSUE_STATUS_CHANGED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  MENTIONED = 'MENTIONED',
  SPRINT_STARTED = 'SPRINT_STARTED',
  SPRINT_COMPLETED = 'SPRINT_COMPLETED',
  MEMBER_INVITED = 'MEMBER_INVITED',
}

// API Response wrappers
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Models
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: GlobalRole;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  joinedAt: string;
  user?: User;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  issueKey: string;
  issueNumber: number;
  status: IssueStatus;
  priority: Priority;
  type: IssueType;
  position: number;
  projectId: string;
  assigneeId: string | null;
  reporterId: string;
  sprintId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  reporter?: User;
  labels?: Label[];
}

export interface BoardData {
  [status: string]: Issue[];
}

export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  issues?: Issue[];
}

export interface Comment {
  id: string;
  content: string;
  issueId: string;
  authorId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  author?: User;
  replies?: Comment[];
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  issueId: string;
  uploaderId: string;
  createdAt: string;
  uploader?: User;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  userId: string;
  createdAt: string;
}
