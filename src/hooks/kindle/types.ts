
export interface KindleSettings {
  firstName: string;
  lastName: string;
  kindleEmail: string;
}

export type KindleSettingsUpdateResult = {
  success: boolean;
  errors?: { message: string }[];
};
