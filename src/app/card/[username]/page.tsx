import { Metadata } from 'next';
import Link from 'next/link';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitgravity.vercel.app';
  const imageUrl = `${origin}/api/admin/card-image?username=${username}`;

  return {
    title: `@${username}'s GitGravity Card`,
    description: `Check out @${username}'s coding orbit and stats on GitGravity!`,
    openGraph: {
      title: `@${username}'s GitGravity Card`,
      description: `Check out @${username}'s coding orbit and stats on GitGravity!`,
      images: [
        {
          url: imageUrl,
          width: 600,
          height: 1080,
          alt: `${username}'s GitGravity Wrapped Card`,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${username}'s GitGravity Card`,
      description: `Check out @${username}'s coding orbit and stats on GitGravity!`,
      images: [imageUrl],
    }
  };
}

export default async function CardPage({ params }: Props) {
  const { username } = await params;
  const imageUrl = `/api/admin/card-image?username=${username}`;

  return (
    <div className="bg-[#050508] min-h-screen text-white flex flex-col items-center justify-center p-6 font-mono">
      <div className="max-w-xs w-full flex flex-col items-center gap-6">
        <h1 className="text-sm font-bold uppercase tracking-widest text-[#39d353]">@{username}&apos;s ORBIT CARD</h1>
        
        {/* Render the saved image directly */}
        <div className="w-full aspect-[1/1.8] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={`${username}'s card`} className="w-full h-full object-cover" />
        </div>

        <Link href="/" className="px-6 py-3 rounded-full border border-zinc-800 hover:bg-zinc-900 transition-all text-xs font-bold uppercase tracking-wider text-green-500 cursor-pointer">
          Create Your Own Wrapped
        </Link>
      </div>
    </div>
  );
}
