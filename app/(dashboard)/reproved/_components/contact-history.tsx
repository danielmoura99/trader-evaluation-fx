// app/(dashboard)/reproved/_components/contact-history.tsx
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contact {
  id: string;
  status: string;
  date: Date;
  notes: string;
  createdAt: Date;
}

interface ContactHistoryProps {
  contacts: Contact[];
}

export function ContactHistory({ contacts }: ContactHistoryProps) {
  return (
    <div className="space-y-4 max-h-[300px] overflow-y-auto">
      {contacts.map((contact) => (
        <div key={contact.id} className="p-4 border border-zinc-800 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span
                className={`inline-block px-2 py-1 rounded text-sm ${
                  contact.status === "Convertido"
                    ? "bg-green-500/10 text-green-500"
                    : contact.status === "Não Interessado"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-blue-500/10 text-blue-500"
                }`}
              >
                {contact.status}
              </span>
            </div>
            <span className="text-sm text-zinc-500">
              {format(new Date(contact.date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">
            {contact.notes}
          </p>
        </div>
      ))}
    </div>
  );
}
