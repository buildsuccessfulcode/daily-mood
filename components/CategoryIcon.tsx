import {
  Bell,
  BookOpen,
  Brain,
  CloudRain,
  Coffee,
  Dumbbell,
  Flame,
  Frown,
  Ghost,
  HandHeart,
  Heart,
  Laugh,
  Leaf,
  Lightbulb,
  MessageCircle,
  Moon,
  Music,
  PartyPopper,
  Rocket,
  Smile,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "cloud-rain": CloudRain,
  laugh: Laugh,
  zap: Lightbulb,
  lightbulb: Lightbulb,
  heart: Heart,
  flame: Flame,
  sparkles: Sparkles,
  moon: Moon,
  star: Star,
  ghost: Ghost,
  coffee: Coffee,
  brain: Brain,
  rocket: Rocket,
  "hand-heart": HandHeart,
  "message-circle": MessageCircle,
  smile: Smile,
  frown: Frown,
  "party-popper": PartyPopper,
  dumbbell: Dumbbell,
  "book-open": BookOpen,
  music: Music,
  sun: Sun,
  snowflake: Snowflake,
  leaf: Leaf,
  bell: Bell,
  "thumbs-up": ThumbsUp,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? CloudRain;
  return <Icon className={className} aria-hidden />;
}
