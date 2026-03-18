export declare const sendResetPasswordEmail: (email: string, token: string) => Promise<void>;
export declare const sendInvoiceReminderEmail: (email: string, invoiceMonth: string, amount: number, dueDate: Date) => Promise<void>;
export declare const sendIncidentUpdateEmail: (email: string, incidentTitle: string, status: string) => Promise<void>;
//# sourceMappingURL=email.d.ts.map