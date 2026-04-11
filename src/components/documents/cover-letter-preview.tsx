import type { CoverLetterContent } from "@/types/documents";

interface Props {
  content: CoverLetterContent;
}

export function CoverLetterPreview({ content }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-8 py-10 text-gray-900 font-sans text-sm leading-relaxed">
      <header className="mb-6">
        <div className="text-sm text-gray-700">
          {content.signature.name && (
            <p className="font-semibold">{content.signature.name}</p>
          )}
          {content.signature.email && <p>{content.signature.email}</p>}
          {content.signature.phone && <p>{content.signature.phone}</p>}
        </div>
        <div className="mt-4 text-sm">
          <p>{new Date().toLocaleDateString()}</p>
          {content.recipient.company && (
            <p className="mt-2 font-semibold">{content.recipient.company}</p>
          )}
          {content.recipient.role && (
            <p className="text-gray-700">Re: {content.recipient.role}</p>
          )}
        </div>
      </header>

      <div className="space-y-4">
        <p>{content.greeting}</p>
        <p>{content.opening}</p>
        {content.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
        <p>{content.closing}</p>
        <p className="pt-2">
          Sincerely,
          <br />
          {content.signature.name}
        </p>
      </div>
    </div>
  );
}
