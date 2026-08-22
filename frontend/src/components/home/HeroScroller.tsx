import Image from "next/image";

const images = [
  { src: "/Hot-Air-Balloon-Flights_Cappadocia_Adventure_Balloon-Safety_Travel-Atelier-Luxury-DMC_Balloon-Tour-1.jpg", alt: "Hot air balloons over Cappadocia" },
  { src: "/tropical-island-aerial-view.jpg", alt: "Aerial view of a tropical island" },
];

/** Both hero photos endlessly auto-scroll left, completing one loop every 4s. */
export function HeroScroller() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="flex h-full w-fit animate-hero-scroll">
        {[...images, ...images].map((image, index) => (
          <div key={`${image.src}-${index}`} className="relative h-full w-screen shrink-0">
            <Image src={image.src} alt={image.alt} fill priority={index === 0} sizes="100vw" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
    </div>
  );
}
