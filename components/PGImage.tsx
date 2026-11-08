import { BedDouble } from "lucide-react";

// Shows the listing photo, or a neutral placeholder when none has been uploaded yet.
export default function PGImage({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-soft text-brand/50 ${className}`} role="img" aria-label={alt}>
        <BedDouble className="h-10 w-10" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}
