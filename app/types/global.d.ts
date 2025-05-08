import { Client } from "@/app/types";

declare global {
  interface Window {
    editClient: (client: Client) => void;
    deleteClient: (id: string) => void;
    startEvaluation: (id: string) => void;
    openFinishEvaluation: (client: Client) => void;
    contactClient: (client: Client) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editRiskProfile: (profile: any) => void;
  }
}
