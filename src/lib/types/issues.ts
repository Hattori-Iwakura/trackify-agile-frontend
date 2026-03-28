/** Khớp IssueStatus Prisma / Nest */
export type IssueStatusBE =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELLED";

export type IssueTypeBE = "EPIC" | "STORY" | "TASK" | "BUG" | "SUBTASK";

export type IssuePriorityBE = "LOWEST" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";

export interface ProjectSummary {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { members?: number; labels?: number };
}

export interface BoardIssue {
  id: string;
  issueKey: string;
  title: string;
  status: IssueStatusBE;
  type: IssueTypeBE;
  priority: IssuePriorityBE;
  position?: number;
  updatedAt?: string;
  assignee?: { id: string; fullName: string; avatarUrl?: string | null } | null;
  labels?: { label: { id: string; name: string; color: string } }[];
}

export type BoardData = Record<IssueStatusBE, BoardIssue[]>;

export interface IssueCommentAuthor {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface IssueComment {
  id: string;
  content: string;
  createdAt: string;
  author: IssueCommentAuthor;
  authorId?: string;
  replies?: IssueComment[];
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

/** Khớp Prisma Attachment — BE dùng `filename`, không có `originalName` */
export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  uploader?: { id: string; fullName: string; avatarUrl?: string | null };
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  projectId: string;
  issues?: BoardIssue[];
}

/** Khớp Prisma Notification — nội dung là `message` */
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  /** Một số bản cũ / proxy có thể trả `content` */
  content?: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown> | null;
}
