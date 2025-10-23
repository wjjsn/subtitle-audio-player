import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, LinearProgress } from '@mui/material';

export default function SubtitleAudioPlayer() {
    const [audioUrl, setAudioUrl] = useState(null);
    const [subtitles, setSubtitles] = useState([]);
    const [currentLine, setCurrentLine] = useState(0);
    const [revealedIndex, setRevealedIndex] = useState(null);
    const [segmentEnd, setSegmentEnd] = useState(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const parseSRT = (srtText) => {
        const blocks = srtText.split(/\n\n+/);
        return blocks.map((block) => {
            const lines = block.split('\n');
            if (lines.length >= 3) {
                const timeMatch = lines[1].match(/(\d+:\d+:\d+,\d+) --> (\d+:\d+:\d+,\d+)/);
                const start = srtTimeToSeconds(timeMatch[1]);
                const end = srtTimeToSeconds(timeMatch[2]);
                const text = lines.slice(2).join('\n');
                return { start, end, text };
            }
            return null;
        }).filter(Boolean);
    };

    const srtTimeToSeconds = (time) => {
        const [h, m, s] = time.split(':');
        const [sec, ms] = s.split(',');
        return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(sec) + parseInt(ms) / 1000;
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.name.endsWith('.zip')) {
            const JSZip = await import('jszip');
            const zip = await JSZip.loadAsync(file);
            let audioFile, subtitleFile;

            zip.forEach((relativePath, zipEntry) => {
                if (zipEntry.name.endsWith('.srt')) subtitleFile = zipEntry;
                if (zipEntry.name.match(/\.(mp3|wav|ogg)$/)) audioFile = zipEntry;
            });

            if (subtitleFile && audioFile) {
                const subtitleText = await subtitleFile.async('string');
                const audioBlob = await audioFile.async('blob');
                setAudioUrl(URL.createObjectURL(audioBlob));
                setSubtitles(parseSRT(subtitleText));
            }
        } else {
            const files = event.target.files;
            let audioBlob, subtitleText;

            for (let f of files) {
                if (f.name.endsWith('.srt')) subtitleText = await f.text();
                if (f.name.match(/\.(mp3|wav|ogg)$/)) audioBlob = f;
            }

            if (subtitleText && audioBlob) {
                setAudioUrl(URL.createObjectURL(audioBlob));
                setSubtitles(parseSRT(subtitleText));
            }
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => {
            const currentTime = audio.currentTime;
            if (segmentEnd != null && currentTime >= segmentEnd) {
                audio.pause();
                setSegmentEnd(null);
                return;
            }
            const activeLine = subtitles.findIndex(
                (line) => currentTime >= line.start && currentTime <= line.end
            );
            if (activeLine !== -1 && activeLine !== currentLine) setCurrentLine(activeLine);
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        return () => audio.removeEventListener('timeupdate', onTimeUpdate);
    }, [subtitles, currentLine, segmentEnd]);

    const maskText = (t) => (t ? t.replace(/\S/g, '•') : '');

    return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
                字幕音频播放器
            </Typography>

            <Button variant="contained" component="label">
                上传文件夹或压缩包
                <input
                    type="file"
                    hidden
                    multiple
                    webkitdirectory="true"
                    onChange={handleFileUpload}
                />
            </Button>

            {audioUrl && (
                <Box sx={{ mt: 4 }}>
                    <audio ref={audioRef} src={audioUrl} controls style={{ width: '100%' }} />

                    {subtitles.length > 0 && (
                        <>
                            {/* 当前字幕卡片，带显示/隐藏按钮 */}
                            <Box sx={{ mt: 3, border: '1px solid #ccc', borderRadius: 2, p: 2, bgcolor: '#fafafa' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="h6">当前字幕：</Typography>
                                    <Button size="small" onClick={() => setRevealedIndex(revealedIndex === 'current' ? null : 'current')}>
                                        {revealedIndex === 'current' ? '隐藏' : '显示'}
                                    </Button>
                                </Box>
                                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                                    {revealedIndex === 'current'
                                        ? subtitles[currentLine]?.text || '等待播放...'
                                        : maskText(subtitles[currentLine]?.text)}
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={
                                        ((audioRef.current?.currentTime - (subtitles[currentLine]?.start || 0)) /
                                            ((subtitles[currentLine]?.end || 1) - (subtitles[currentLine]?.start || 0))) *
                                        100
                                    }
                                    sx={{ mt: 2 }}
                                />
                            </Box>

                            {/* 全部字幕列表 */}
                            <Box sx={{ mt: 3, textAlign: 'left' }}>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>全部字幕</Typography>
                                <Box sx={{ display: 'grid', gap: 1 }}>
                                    {subtitles.map((line, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                p: 1.2,
                                                borderRadius: 1,
                                                border: '1px solid #eee',
                                                bgcolor: i === currentLine ? '#e3f2fd' : 'white',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => {
                                                const a = audioRef.current;
                                                if (a) {
                                                    a.currentTime = Math.max(0, line.start + 0.01);
                                                    setSegmentEnd(line.end);
                                                    a.play();
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                                    {new Date(line.start * 1000).toISOString().substring(11, 19)} → {new Date(line.end * 1000).toISOString().substring(11, 19)}
                                                </Typography>
                                                <Button size="small" onClick={(e) => { e.stopPropagation(); setRevealedIndex(revealedIndex === i ? null : i); }}>
                                                    {revealedIndex === i ? '隐藏' : '显示'}
                                                </Button>
                                            </Box>
                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                                {revealedIndex === i ? line.text : maskText(line.text)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </>
                    )}
                </Box>
            )}
        </Box>
    );
}
