import {
  Bus,
  Clapperboard,
  Ellipsis,
  HeartPulse,
  Receipt,
  ShoppingBag,
  ShoppingBasket,
  Utensils,
  type LucideIcon,
} from "lucide-react";

// Icon names come from the API as lucide kebab-case strings.
const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  "shopping-basket": ShoppingBasket,
  bus: Bus,
  "shopping-bag": ShoppingBag,
  receipt: Receipt,
  "heart-pulse": HeartPulse,
  clapperboard: Clapperboard,
  ellipsis: Ellipsis,
};

function hueOf(name: string) {
  let h = 0;
  for (const c of name.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/**
 * A merchant's initial on a colour that is always the same for that merchant,
 * with a small dot in the category colour. Lists read as "who", not "what kind",
 * like the merchant logos in Monzo and Brex.
 */
export function MerchantAvatar({
  name,
  categoryColor,
  size = 42,
}: {
  name: string;
  categoryColor?: string;
  size?: number;
}) {
  const h = hueOf(name);
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <span
        className="grid h-full w-full place-items-center rounded-full font-bold"
        style={{
          fontSize: size * 0.4,
          background: `hsl(${h} 55% 52% / 0.15)`,
          color: `hsl(${h} 62% 48%)`,
        }}
      >
        {name.trim()[0]?.toUpperCase() ?? "?"}
      </span>
      {categoryColor && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-surface"
          style={{ width: size * 0.34, height: size * 0.34, background: categoryColor }}
        />
      )}
    </span>
  );
}

/** Rounded square with a tinted background, as in the Monzo/Origin lists. */
export function CategoryIcon({
  icon,
  color,
  size = 40,
}: {
  icon: string;
  color: string;
  size?: number;
}) {
  const Icon = ICONS[icon] ?? Ellipsis;
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl"
      style={{
        width: size,
        height: size,
        background: `${color}1f`,
        color,
      }}
      aria-hidden="true"
    >
      <Icon style={{ width: size * 0.48, height: size * 0.48 }} strokeWidth={2} />
    </span>
  );
}
