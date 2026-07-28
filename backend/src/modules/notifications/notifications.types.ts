export interface CreateNotificationDTO {
  userId: string;
  type: string;
  payload: Record<string, any>;
}
