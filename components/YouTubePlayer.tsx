"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

// YouTube IFrame Player API types
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export interface PlayerState {
    currentTime: number;
    playbackRate: number;
    muted: boolean;
}

export interface YouTubePlayerProps {
    videoId: string;
    initialState?: Partial<PlayerState>;
    onReady?: () => void;
    onStateChange?: (state: number, currentState: PlayerState) => void;
    onError?: (errorCode: number) => void;
}

export interface YouTubePlayerRef {
    seekTo: (seconds: number) => void;
    getCurrentTime: () => number;
    getPlaybackRate: () => number;
    setPlaybackRate: (rate: number) => void;
    isMuted: () => boolean;
    mute: () => void;
    unMute: () => void;
    getPlayerState: () => number;
    getDuration: () => number;
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
    ({ videoId, initialState, onReady, onStateChange, onError }, ref) => {
        const playerRef = useRef<any>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const hasRestoredStateRef = useRef(false);

        // 🔴 FIX 1: Idempotent YouTube IFrame API loader (prevents callback overwrite)
        useEffect(() => {
            if (window.YT && window.YT.Player) return;

            if (!document.getElementById("youtube-iframe-api")) {
                const tag = document.createElement("script");
                tag.id = "youtube-iframe-api";
                tag.src = "https://www.youtube.com/iframe_api";
                document.body.appendChild(tag);
            }
        }, []);

        // Create player when API is ready
        useEffect(() => {
            if (!containerRef.current || !videoId) return;

            const initPlayer = () => {
                if (!window.YT || !window.YT.Player) {
                    // API not ready yet, wait
                    setTimeout(initPlayer, 100);
                    return;
                }

                // Destroy existing player if any
                if (playerRef.current) {
                    playerRef.current.destroy();
                }

                // Create new player
                playerRef.current = new window.YT.Player(containerRef.current, {
                    videoId: videoId,
                    width: "100%",
                    height: "100%",
                    playerVars: {
                        autoplay: 0, // 🟠 FIX 2: Let user click play (better UX, no forced mute)
                        controls: 1,
                        rel: 0, // Disable related videos from other channels
                        modestbranding: 1,
                        playsinline: 1,
                    },
                    events: {
                        onReady: handlePlayerReady,
                        onStateChange: handleStateChange,
                        onError: handleError,
                    },
                });
            };

            initPlayer();

            return () => {
                if (playerRef.current) {
                    playerRef.current.destroy();
                    playerRef.current = null;
                }
                hasRestoredStateRef.current = false;
            };
        }, [videoId]);

        const handlePlayerReady = (event: any) => {
            // Restore state when player is ready
            if (initialState && !hasRestoredStateRef.current) {
                try {
                    // Restore playback rate
                    if (initialState.playbackRate && initialState.playbackRate !== 1.0) {
                        event.target.setPlaybackRate(initialState.playbackRate);
                    }

                    // Restore mute state
                    if (initialState.muted === true) {
                        event.target.mute();
                    } else if (initialState.muted === false) {
                        event.target.unMute();
                    }

                    // Restore currentTime (seek position)
                    if (initialState.currentTime && initialState.currentTime > 0) {
                        event.target.seekTo(initialState.currentTime, true);
                    }

                    hasRestoredStateRef.current = true;
                } catch (error) {
                    console.error("Failed to restore player state:", error);
                }
            }

            onReady?.();
        };

        const handleStateChange = (event: any) => {
            const state = event.data;

            // 🟠 FIX 3: Re-assert state on first PLAYING (prevents YouTube reset)
            if (state === YT_PLAYER_STATE.PLAYING && initialState && !hasRestoredStateRef.current) {
                try {
                    // YouTube sometimes resets playbackRate on first play
                    if (initialState.playbackRate && initialState.playbackRate !== 1.0) {
                        event.target.setPlaybackRate(initialState.playbackRate);
                    }

                    // Re-assert mute state
                    if (initialState.muted === true) {
                        event.target.mute();
                    } else if (initialState.muted === false) {
                        event.target.unMute();
                    }

                    hasRestoredStateRef.current = true;
                } catch (error) {
                    console.error("Failed to re-assert player state:", error);
                }
            }

            // Get current player state
            const currentState: PlayerState = {
                currentTime: playerRef.current?.getCurrentTime() || 0,
                playbackRate: playerRef.current?.getPlaybackRate() || 1.0,
                muted: playerRef.current?.isMuted() || false,
            };

            onStateChange?.(state, currentState);
        };

        const handleError = (event: any) => {
            const errorCode = event.data;
            console.error("YouTube Player Error:", errorCode);
            onError?.(errorCode);
        };

        // Expose imperative methods to parent via ref
        useImperativeHandle(ref, () => ({
            seekTo: (seconds: number) => {
                try {
                    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                        playerRef.current.seekTo(seconds, true);
                    }
                } catch (error) {
                    console.error('seekTo error:', error);
                }
            },
            getCurrentTime: () => {
                try {
                    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                        return playerRef.current.getCurrentTime();
                    }
                } catch (error) {
                    console.error('getCurrentTime error:', error);
                }
                return 0;
            },
            getPlaybackRate: () => {
                try {
                    if (playerRef.current && typeof playerRef.current.getPlaybackRate === 'function') {
                        return playerRef.current.getPlaybackRate();
                    }
                } catch (error) {
                    console.error('getPlaybackRate error:', error);
                }
                return 1.0;
            },
            setPlaybackRate: (rate: number) => {
                try {
                    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
                        playerRef.current.setPlaybackRate(rate);
                    }
                } catch (error) {
                    console.error('setPlaybackRate error:', error);
                }
            },
            isMuted: () => {
                try {
                    if (playerRef.current && typeof playerRef.current.isMuted === 'function') {
                        return playerRef.current.isMuted();
                    }
                } catch (error) {
                    console.error('isMuted error:', error);
                }
                return false;
            },
            mute: () => {
                try {
                    if (playerRef.current && typeof playerRef.current.mute === 'function') {
                        playerRef.current.mute();
                    }
                } catch (error) {
                    console.error('mute error:', error);
                }
            },
            unMute: () => {
                try {
                    if (playerRef.current && typeof playerRef.current.unMute === 'function') {
                        playerRef.current.unMute();
                    }
                } catch (error) {
                    console.error('unMute error:', error);
                }
            },
            getPlayerState: () => {
                try {
                    if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
                        return playerRef.current.getPlayerState();
                    }
                } catch (error) {
                    console.error('getPlayerState error:', error);
                }
                return -1;
            },
            getDuration: () => {
                try {
                    if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
                        return playerRef.current.getDuration();
                    }
                } catch (error) {
                    console.error('getDuration error:', error);
                }
                return 0;
            },
        }));

        return (
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{ aspectRatio: "16 / 9" }}
            />
        );
    }
);

YouTubePlayer.displayName = "YouTubePlayer";

export default YouTubePlayer;

// YouTube Player States for reference
export const YT_PLAYER_STATE = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
};
