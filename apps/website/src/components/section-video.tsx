"use client";

import { Button } from "@zeke/ui/button";
import { Icons } from "@zeke/ui/icons";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

const ReactHlsPlayer = dynamic(() => import("react-hls-player"), {
  ssr: false,
});

export function SectionVideo() {
  const playerRef = useRef(undefined);
  const [isPlaying, setPlaying] = useState(false);
  const [isMuted, setMuted] = useState(true);

  const togglePlay = () => {
    if (isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }

    setPlaying((prev) => !prev);
  };

  const toggleMute = () => {
    setMuted((prev) => !prev);
  };

  return (
    <motion.div
      className="flex flex-col justify-center container pb-20"
      onViewportLeave={() => {
        playerRef.current?.pause();
        setPlaying(false);
      }}
    >
      <div className="text-center mb-8">
        <h3 className="text-3xl md:text-4xl font-medium mb-3">
          See Zeke turn a 3-hour podcast into a cited playbook
        </h3>
        <p className="text-sm md:text-base text-[#878787] max-w-[720px] mx-auto">
          Watch the 90-second run: ingest the source, surface the signal, map it
          to your goals, and ship a campaign brief with receipts the team can
          trust immediately.
        </p>
      </div>

      <div className="relative">
        {isPlaying && (
          <div className="absolute md:top-12 md:right-12 top-4 right-4 space-x-4 items-center justify-center z-30 transition-all">
            <Button
              size="icon"
              className="rounded-full size-10 md:size-14 transition ease-in-out hover:scale-110 hover:bg-white bg-white"
              onClick={toggleMute}
            >
              {isMuted ? (
                <Icons.Mute size={24} className="text-black" />
              ) : (
                <Icons.UnMute size={24} className="text-black" />
              )}
            </Button>
          </div>
        )}

        {!isPlaying && (
          <div className="absolute md:top-12 md:right-12 top-4 right-4 space-x-4 items-center justify-center z-30 transition-all">
            <Button
              size="icon"
              className="rounded-full size-10 md:size-14 transition ease-in-out hover:scale-110 hover:bg-white bg-white"
              onClick={togglePlay}
            >
              <Icons.Play size={24} className="text-black" />
            </Button>
          </div>
        )}

        <ReactHlsPlayer
          onEnded={() => playerRef.current?.load()}
          onClick={togglePlay}
          src="https://customer-oh6t55xltlgrfayh.cloudflarestream.com/306702a5d5efbba0e9bcdd7cb17e9c5a/manifest/video.m3u8"
          autoPlay={false}
          poster="https://cdn.zekehq.com/poster.webp"
          playerRef={playerRef}
          className="w-full"
          muted={isMuted}
        />
      </div>
    </motion.div>
  );
}
