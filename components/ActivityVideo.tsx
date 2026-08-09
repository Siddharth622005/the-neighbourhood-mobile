import React from "react";
import { useEffect } from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import { Platform, StyleSheet, View } from "react-native";
import { colors, radius } from "../lib/theme";

const reachForItVideo = require("../assets/activity-video/reach-for-it.mp4");

/**
 * PROTOTYPE. One hand-mapped clip (Firefly-generated, unedited) wired to a
 * single activity so the real card layout can be judged with real motion in
 * it, before spending time generating and cutting all 56.
 *
 * Known issues with this specific clip, left as-is on purpose so they're
 * visible in review rather than papered over:
 *   - loop seam is visible (frame 1 ≠ last frame) — needs a Premiere trim
 *     to the nearest matching pose before this is loop-clean
 *   - line weight is heavier/looser than the app's uniform 2px SVG icons
 *   - background is close to but not exactly `colors.cream`
 *
 * Swap the require() below for a lookup map keyed by activity slug once
 * more than one clip exists — do not scale this file's shape as-is past
 * one asset.
 */
export function ActivityVideo({ style }: { style?: object }) {
  if (Platform.OS === "web") {
    return (
      <View style={[styles.wrap, style]}>
        {React.createElement("video", {
          src: reachForItVideo,
          autoPlay: true,
          muted: true,
          loop: true,
          playsInline: true,
          preload: "auto",
          controls: false,
          style: styles.webVideo,
        })}
      </View>
    );
  }

  return <NativeActivityVideo style={style} />;
}

function NativeActivityVideo({ style }: { style?: object }) {
  const player = useVideoPlayer(reachForItVideo, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Re-issuing play() on the readyToPlay transition covers a cold native
  // load; the synchronous status check covers remounts where the asset is
  // already cached and the transition event has already fired.
  useEffect(() => {
    if (player.status === "readyToPlay") player.play();
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") player.play();
    });
    return () => sub.remove();
  }, [player]);

  return (
    <View style={[styles.wrap, style]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.cream,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  webVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
});
