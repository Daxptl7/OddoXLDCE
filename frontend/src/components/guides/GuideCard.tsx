"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GuideAvatar } from "@/components/guides/GuideAvatar";
import { BadgeCheckIcon, MapPinIcon, StarIcon, WalletIcon } from "@/components/ui/Icons";
import { formatMoney } from "@/lib/format";
import type { SerializedGuide } from "@/lib/types";

export function GuideCard({
  guide,
  onHire,
}: {
  guide: SerializedGuide;
  onHire?: (guide: SerializedGuide) => void;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <GuideAvatar name={guide.name} photoUrl={guide.photoUrl} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-bold text-foreground">{guide.name}</p>
            {guide.isVerified ? <BadgeCheckIcon className="h-4 w-4 shrink-0 text-primary" /> : null}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPinIcon className="h-4 w-4" />
            {guide.city ? `${guide.city.name}, ${guide.city.country}` : "—"}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-foreground">
          <StarIcon className="h-4 w-4 fill-current text-primary" />
          {guide.rating.toFixed(1)}
        </span>
      </div>

      {guide.headline ? (
        <p className="line-clamp-2 text-sm font-medium text-foreground">{guide.headline}</p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {guide.languages.slice(0, 3).map((language) => (
          <Badge key={language}>{language}</Badge>
        ))}
        {guide.specialties.slice(0, 2).map((specialty) => (
          <Badge key={specialty} tone="info">
            {specialty}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
        <div>
          <p className="flex items-center gap-1.5 text-lg font-bold text-foreground">
            <WalletIcon className="h-4 w-4 text-muted" />
            {formatMoney(guide.dailyRate)}
            <span className="text-sm font-normal text-muted">/ day</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {guide.experienceYears} yrs guiding
            {guide.tripsGuided ? ` · ${guide.tripsGuided} trips` : ""}
          </p>
        </div>
        {onHire ? (
          <Button size="sm" onClick={() => onHire(guide)}>
            Hire guide
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
