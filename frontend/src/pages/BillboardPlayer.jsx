import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const BillboardPlayer = () => {
    const { id } = useParams();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTimeInHour, setCurrentTimeInHour] = useState(0);
    const [activeAd, setActiveAd] = useState(null);
    const [billboard, setBillboard] = useState(null);

    // 1. Fetch data
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch billboard details for name/branding
                const bbRes = await api.get(`billboards/detail/${id}/`);
                setBillboard(bbRes.data);

                // Fetch active ads for today
                const adsRes = await api.get(`billboards/${id}/active-ads/`);
                setAds(adsRes.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load player data", err);
                setLoading(false);
            }
        };
        fetchData();

        // Refresh ad list every 5 minutes to catch new approvals
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [id]);

    // 2. The Deterministic Clock
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const seconds = now.getSeconds();
            const minutes = now.getMinutes();
            const totalSecondsInHour = (minutes * 60) + seconds;
            setCurrentTimeInHour(totalSecondsInHour);
        };

        updateClock();
        const ticker = setInterval(updateClock, 1000);
        return () => clearInterval(ticker);
    }, []);

    // 3. Playlist Generation (Interleaved / Round Robin)
    const [playlist, setPlaylist] = useState([]);

    useEffect(() => {
        if (!ads || ads.length === 0) {
            setPlaylist([]);
            return;
        }

        // Flatten all ad occurrences into a single list of slots
        let allSlots = [];
        ads.forEach(ad => {
            const freq = ad.frequency_per_hour || 1;
            const interval = 3600 / freq;
            for (let i = 0; i < freq; i++) {
                allSlots.push({
                    ad: ad,
                    idealStart: i * interval,
                    baseIndex: i,
                    // Unique key for stability
                    id: `${ad.id}_${i}`
                });
            }
        });

        // Sort by ideal start time to interleave them
        allSlots.sort((a, b) => a.idealStart - b.idealStart);

        // Resolve overlaps (Greedy scheduling)
        // If an ad's ideal time is blocked, push it forward (sequence preserved)
        let scheduledSlots = [];
        let nextAvailableTime = 0;

        allSlots.forEach(slot => {
            // We want to start at ideal time, but cannot overlap previous opacity
            // So start is max(ideal, nextAvailable)
            let start = Math.max(slot.idealStart, nextAvailableTime);

            // Limit: If it pushes beyond the hour, we can either drop it or clip it.
            // For now, we schedule it. The player just won't reach it if hour resets.

            let duration = slot.ad.slot_duration_seconds;
            let end = start + duration;

            scheduledSlots.push({
                ad: slot.ad,
                start: start,
                end: end
            });

            nextAvailableTime = end;
        });

        setPlaylist(scheduledSlots);
        console.log("Generated Playlist:", scheduledSlots);

    }, [ads]);

    // 4. Real-time Ad Seeker
    useEffect(() => {
        if (!playlist || playlist.length === 0) {
            setActiveAd(null);
            return;
        }

        // Find the slot that covers the current second
        const currentSlot = playlist.find(slot =>
            currentTimeInHour >= slot.start && currentTimeInHour < slot.end
        );

        if (currentSlot) {
            // Only update if it's a DIFFERENT ad ID to avoid re-renders or state triggers
            // This ensures we don't call setActiveAd(same_ad) every single second
            if (activeAd?.id !== currentSlot.ad.id) {
                setActiveAd(currentSlot.ad);
            }
        } else {
            if (activeAd !== null) setActiveAd(null);
        }
    }, [playlist, currentTimeInHour, activeAd]);

    if (loading) return <div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Initializing Billboard #{id}...</div>;

    return activeAd ? (
        <AdPlayer activeAd={activeAd} currentTimeInHour={currentTimeInHour} />
    ) : (
        <FallbackScreen billboard={billboard} />
    );
};

// --- STABLE SUB-COMPONENTS (Defined outside to prevent remounts) ---

const FallbackScreen = ({ billboard }) => (
    <div style={{
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: "'Outfit', sans-serif",
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '120px', marginBottom: '20px' }}>📷</div>
        <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '10px' }}>{billboard?.title}</h1>
        <p style={{ fontSize: '24px', opacity: 0.8, maxWidth: '800px', margin: '0 20px' }}>
            Your Brand Deserves This Spot.
        </p>
        <div style={{
            marginTop: '40px',
            padding: '20px 40px',
            border: '2px solid #667B68',
            borderRadius: '50px',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#667B68'
        }}>
            SCAN TO PLACE AN AD
        </div>
        <div style={{ position: 'absolute', bottom: '40px', fontSize: '18px', opacity: 0.5 }}>
            BimbaSetu Digital Signage Network
        </div>
    </div>
);

const AdPlayer = ({ activeAd, currentTimeInHour }) => {
    const isVideo = activeAd?.creative_file?.match(/\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i);

    return (
        <div style={{ height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
            {activeAd?.creative_file ? (
                <div style={{ width: '100%', height: '100%' }}>
                    {isVideo ? (
                        <video
                            src={activeAd.creative_file}
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <img
                            src={activeAd.creative_file}
                            alt="advertisement"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    )}
                </div>
            ) : (
                <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px' }}>
                    Loading Creative for {activeAd?.advertiser_name}...
                </div>
            )}

            {/* Minimal Overlay Info (Owner/Diagnostic Only if needed) */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                {new Date().toLocaleTimeString()} | Sec: {currentTimeInHour}
            </div>
        </div>
    );
};

export default BillboardPlayer;
