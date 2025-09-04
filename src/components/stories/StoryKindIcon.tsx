import { IoLogoYoutube, IoMic, IoDocumentText, IoLogoTwitter, IoLogoReddit, IoNewspaper, IoCodeSlash, IoBusiness } from 'react-icons/io5';

import type { EmbedKind } from '@/features/stories';

export function StoryKindIcon({ kind, className }: { kind: EmbedKind | string; className?: string }) {
  const common = className ?? 'h-4 w-4';
  switch (kind) {
    case 'youtube':
      return <IoLogoYoutube className={common} />;
    case 'podcast':
      return <IoMic className={common} />;
    case 'twitter':
      return <IoLogoTwitter className={common} />;
    case 'reddit':
      return <IoLogoReddit className={common} />;
    case 'arxiv':
      return <IoDocumentText className={common} />;
    case 'hn':
      return <IoCodeSlash className={common} />;
    case 'industry':
      return <IoBusiness className={common} />;
    case 'company':
      return <IoBusiness className={common} />;
    case 'article':
    default:
      return <IoNewspaper className={common} />;
  }
}
