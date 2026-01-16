
export enum BookingStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SCHEDULED = 'SCHEDULED'
}

export interface Player {
  id: string;
  name: string;
}

export interface BookingLog {
  id: string;
  timestamp: Date;
  course: 'Woodmead' | 'Rocklands';
  targetDate: string;
  status: BookingStatus;
  details: string;
}

export interface AutomationConfig {
  username: string;
  targetCourses: string[];
  preferredStartTime: string;
  preferredEndTime: string;
  notificationEmail: string;
  players: Player[];
}
