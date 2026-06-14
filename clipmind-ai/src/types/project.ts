export interface Project {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export const INBOX_PROJECT_ID = 'inbox';

export const DEFAULT_PROJECT: Project = {
  id: INBOX_PROJECT_ID,
  name: 'Inbox',
  color: '#7c6ff7',
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};
