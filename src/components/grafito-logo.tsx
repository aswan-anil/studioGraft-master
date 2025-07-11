import { cn } from "@/lib/utils";

const GrafitoLogo = ({ className }: { className?: string }) => (
  <img
    src="/grafito_innovations_logo_only-removebg-preview.png"
    alt="Grafito Innovations Logo"
    className={cn("h-16 w-16", className)}
    style={{ objectFit: 'contain' }}
  />
);

export default GrafitoLogo;
