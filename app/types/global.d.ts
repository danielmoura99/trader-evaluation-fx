/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "@/app/types";
import { NelogicaAccount } from "@/app/(dashboard)/accounts/_actions";

declare global {
  interface Window {
    editClient: (client: Client) => void;
    deleteClient: (id: string) => void;
    startEvaluation: (id: string) => void;
    openFinishEvaluation: (client: Client) => void;
    contactClient: (client: Client) => void;
    editRiskProfile: (profile: any) => void;
    viewSubscriptionDetails: (subscription: any) => void;
    viewAccountDetails?: (account: NelogicaAccount) => void;
  }
}
