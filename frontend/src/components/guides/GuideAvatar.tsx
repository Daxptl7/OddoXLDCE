import clsx from "clsx";
import { UserIcon } from "@/components/ui/Icons";

/** Photo when there is one, initials when there isn't — never a broken image. */
export function GuideAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={clsx("rounded-full object-cover", className ?? "h-12 w-12")}
      />
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full bg-[#222222] text-sm font-bold text-white",
        className ?? "h-12 w-12",
      )}
    >
      {initials || <UserIcon className="h-5 w-5" />}
    </span>
  );
}
