// confirmationStore.ts
import { create } from "zustand";
// confirmationStore.ts
type ConfirmationState = {
  prompt: null | {
    message: string;
    args: any;
    resolve: (result: boolean) => void;
  };
  showPrompt: (message: string, args: Record<string, any>) => Promise<boolean>;
  confirm: () => void;
  cancel: () => void;
};

export const useConfirmationStore = create<ConfirmationState>((set) => ({
  prompt: null,
  showPrompt: (message, args) => {
    return new Promise((resolve) => {
      set({ prompt: { message, args, resolve } });
    });
  },
  confirm: () => {
    set((state) => {
      state.prompt?.resolve(true);
      return { prompt: null };
    });
  },
  cancel: () => {
    set((state) => {
      state.prompt?.resolve(false);
      return { prompt: null };
    });
  },
}));
