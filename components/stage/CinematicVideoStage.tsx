"use client";

import { useEffect, useRef, useState } from "react";
import { smashProgress } from "@/lib/smashProgress";

interface CinematicVideoStageProps {
  inView: boolean;
  active: boolean;
  reducedMotion: boolean;
  onReady?: () => void;
}

const TOTAL_FRAMES = 80;
const HERO_IMAGE_SRC = "/images/sindhu-phase-1.jpg";

export default function CinematicVideoStage({
  inView,
  active,
  reducedMotion,
  onReady,
}: CinematicVideoStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useDirectVideo, setUseDirectVideo] = useState(false);
  const [framesLoaded, setFramesLoaded] = useState(0);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const heroImageRef = useRef<HTMLImageElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const currentProgressRef = useRef<number>(0);
  const isReadyNotified = useRef(false);

  // 1. Check if user provided an MP4 video at /videos/smash.mp4
  useEffect(() => {
    const testVideo = document.createElement("video");
    testVideo.src = "/videos/smash.mp4";
    testVideo.onloadedmetadata = () => {
      if (testVideo.duration > 0) {
        setUseDirectVideo(true);
      }
    };
    testVideo.onerror = () => {
      setUseDirectVideo(false);
    };
  }, []);

  // 2. Preload Hero Image & 60-frame Apple-style image sequence
  useEffect(() => {
    let loadedCount = 0;
    const hero = new Image();
    hero.src = HERO_IMAGE_SRC;
    hero.onload = () => {
      heroImageRef.current = hero;
      if (!isReadyNotified.current) {
        isReadyNotified.current = true;
        onReady?.();
      }
    };

    const loadedFrames: HTMLImageElement[] = [];
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/images/smash-frames/frame_${String(i).padStart(2, "0")}.jpg`;
      img.onload = () => {
        loadedCount++;
        setFramesLoaded(loadedCount);
        if (loadedCount >= 10 && !isReadyNotified.current) {
          isReadyNotified.current = true;
          onReady?.();
        }
      };
      loadedFrames.push(img);
    }
    framesRef.current = loadedFrames;
  }, [onReady]);

  // 3. Apple-style 60fps render loop with lerp smoothing
  useEffect(() => {
    if (useDirectVideo || !active || reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.016;
      const targetProgress = smashProgress.progress;
      // Smooth lerp catching up to scroll target
      currentProgressRef.current += (targetProgress - currentProgressRef.current) * 0.28;
      const p = currentProgressRef.current;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Determine active frame
      const frameIdx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(p * (TOTAL_FRAMES - 1))));
      const currentImg = framesRef.current[frameIdx] && framesRef.current[frameIdx].complete
        ? framesRef.current[frameIdx]
        : heroImageRef.current;

      if (currentImg && currentImg.naturalWidth > 0) {
        const imgRatio = currentImg.naturalWidth / currentImg.naturalHeight;
        const canvasRatio = width / height;
        let renderW = width;
        let renderH = height;
        let offsetX = 0;
        let offsetY = 0;

        // Slight ambient breathing zoom in hero (p ~ 0), scaling up on explosive leap (p: 0.3 -> 0.7)
        const zoom = 1 + (p < 0.05 ? Math.sin(time * 0.8) * 0.015 : p * 0.08);

        if (canvasRatio > imgRatio) {
          renderH = width / imgRatio;
          offsetY = (height - renderH) * 0.32;
        } else {
          renderW = height * imgRatio;
          offsetX = (width - renderW) * 0.5;
        }

        renderW *= zoom;
        renderH *= zoom;
        offsetX -= (renderW - (canvasRatio > imgRatio ? width : height * imgRatio)) * 0.5;
        offsetY -= (renderH - (canvasRatio > imgRatio ? width / imgRatio : height)) * 0.32;

        ctx.drawImage(currentImg, offsetX, offsetY, renderW, renderH);

        // Flash bloom at apex smash contact (progress ~0.6)
        if (p > 0.54 && p < 0.68) {
          const flashIntensity = 1 - Math.abs(p - 0.61) / 0.07;
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, flashIntensity * 0.45)})`;
          ctx.fillRect(0, 0, width, height);
        }
      } else {
        // Fallback charcoal background while loading
        ctx.fillStyle = "#0A0A0A";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();
      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [useDirectVideo, active, reducedMotion, framesLoaded]);

  // 4. Direct video scrub synchronization if /videos/smash.mp4 is used
  useEffect(() => {
    if (!useDirectVideo || !active || reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;
    const syncVideo = () => {
      if (video.duration && !isNaN(video.duration)) {
        const targetTime = smashProgress.progress * video.duration;
        if (Math.abs(video.currentTime - targetTime) > 0.03) {
          video.currentTime = targetTime;
        }
      }
      rafId = requestAnimationFrame(syncVideo);
    };
    rafId = requestAnimationFrame(syncVideo);
    return () => cancelAnimationFrame(rafId);
  }, [useDirectVideo, active, reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-lvh w-full overflow-hidden transition-opacity duration-700 motion-reduce:duration-0"
      style={{ opacity: inView ? 1 : 0 }}
    >
      {useDirectVideo ? (
        <video
          ref={videoRef}
          src="/videos/smash.mp4"
          playsInline
          muted
          preload="auto"
          className="h-full w-full object-cover object-[center_35%]"
        />
      ) : (
        <canvas
          ref={canvasRef}
          className="h-full w-full object-cover will-change-transform"
        />
      )}

      {/* Cinematic stadium dark vignette & contrast gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,10,10,0.85)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-charcoal via-charcoal/80 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-charcoal/90 via-charcoal/40 to-transparent" />
    </div>
  );
}
