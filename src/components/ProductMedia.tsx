import Image from "next/image";
import { BottleArt } from "@/components/BottleArt";

type Props = {
  src?: string | null;
  alt: string;
  bottleVariant: string;
  sizes: string;
  priority?: boolean;
};

/** Uploaded photo if there is one, otherwise the illustrated bottle. Never a grey box. */
export function ProductMedia({ src, alt, bottleVariant, sizes, priority }: Props) {
  if (src) {
    return (
      <span className="photo" style={{ position: "relative", display: "block", width: "100%", height: "100%" }}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: "contain" }} />
      </span>
    );
  }
  return <BottleArt variant={bottleVariant} label={alt} />;
}
