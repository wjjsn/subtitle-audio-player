import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, List, ListItem } from '@mui/material';

export default function SubtitleAudioPlayer() {
    const [audioUrl, setAudioUrl] = useState(null);
    const [subtitles, setSubtitles] = useState([]);
    const [currentLine, setCurrentLine] = useState(0);
    const [revealedIndex, setRevealedIndex] = useState(null);
    const [segmentEnd, setSegmentEnd] = useState(null);
    const audioRef = useRef(null);

    // 解析 SRT 字幕
    const parseSRT = (srtText) => {
        const blocks = srtText.trim().split(/\r?\n\r?\n/);
        return blocks.map((block) => {
            const lines = block.split(/\r?\n/);
            if (lines.length >= 3) {
                const timeMatch = lines[1].match(/(\d+:\d+:\d+,\d+) --> (\d+:\d+:\d+,\d+)/);
                if (!timeMatch) return null;
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
        const files = Array.from(event.target.files);
        if (!files.length) return;

        let mediaBlob = null;
        let subtitleText = "";

        for (let f of files) {
            const fileName = f.name.toLowerCase();
            // 匹配字幕
            if (fileName.endsWith('.srt')) {
                subtitleText = await f.text();
            }
            // 匹配音频或视频 (mp4, mp3, wav, ogg, m4a)
            // 逻辑：如果是 mp4，直接当作音频源使用
            if (fileName.match(/\.(mp3|wav|ogg|m4a|mp4)$/i)) {
                mediaBlob = f;
            }
        }

        if (subtitleText && mediaBlob) {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
            
            setAudioUrl(URL.createObjectURL(mediaBlob));
            setSubtitles(parseSRT(subtitleText));
            setCurrentLine(0);
            setRevealedIndex(null);
        } else {
            alert("未找到匹配的文件！请确保文件夹内包含：\n1. .srt 字幕文件\n2. 音频文件或 .mp4 视频文件");
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => {
            const currentTime = audio.currentTime;
            
            // 单句过完自动暂停逻辑
            if (segmentEnd != null && currentTime >= segmentEnd) {
                audio.pause();
                setSegmentEnd(null);
            }

            const activeLine = subtitles.findIndex(
                (line) => currentTime >= line.start && currentTime <= line.end
            );
            if (activeLine !== -1 && activeLine !== currentLine) {
                setCurrentLine(activeLine);
            }
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        return () => audio.removeEventListener('timeupdate', onTimeUpdate);
    }, [subtitles, currentLine, segmentEnd]);

    const maskText = (t) => (t ? t.replace(/\S/g, '•') : '...');

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, margin: 'auto', fontFamily: 'sans-serif' }}>
            <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                🎧 听力精学工具 (支持 MP4/音频)
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', mb: 4, bgcolor: '#f0f4f8', borderStyle: 'dashed', borderWidth: 2 }}>
                <Button variant="contained" component="label" size="large" sx={{ px: 4 }}>
                    选择包含文件的文件夹
                    <input
                        type="file"
                        hidden
                        // @ts-ignore
                        webkitdirectory=""
                        directory=""
                        onChange={handleFileUpload}
                    />
                </Button>
                <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                    会自动识别文件夹内的 <b>SRT</b> 与 <b>MP3/MP4</b> 文件
                </Typography>
            </Paper>

            {audioUrl && (
                <Box>
                    <Paper elevation={4} sx={{ p: 2, mb: 3, position: 'sticky', top: 10, zIndex: 10, borderRadius: 3 }}>
                        <audio 
                            ref={audioRef} 
                            src={audioUrl} 
                            controls 
                            style={{ width: '100%' }}
                        />
                        
                        <Box sx={{ mt: 2, p: 1, bgcolor: '#fffde7', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#f57c00' }}>当前播放内容：</Typography>
                                <Button size="small" variant="contained" color="warning" onClick={() => setRevealedIndex(revealedIndex === 'current' ? null : 'current')}>
                                    {revealedIndex === 'current' ? '遮盖原文' : '查看原文'}
                                </Button>
                            </Box>
                            <Typography variant="h6" sx={{ minHeight: '2.5em', textAlign: 'center' }}>
                                {revealedIndex === 'current' 
                                    ? subtitles[currentLine]?.text 
                                    : maskText(subtitles[currentLine]?.text)}
                            </Typography>
                        </Box>
                    </Paper>

                    <Typography variant="subtitle1" gutterBottom sx={{ pl: 1, fontWeight: 'bold' }}>句子列表：</Typography>
                    <List sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
                        {subtitles.map((line, i) => (
                            <ListItem
                                key={i}
                                divider
                                sx={{
                                    flexDirection: 'column',
                                    alignItems: 'stretch',
                                    bgcolor: i === currentLine ? '#e3f2fd' : 'transparent',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: '#f5f5f5' }
                                }}
                                onClick={() => {
                                    if (audioRef.current) {
                                        audioRef.current.currentTime = line.start;
                                        setSegmentEnd(line.end); 
                                        audioRef.current.play();
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <Typography variant="caption" color="text.disabled">
                                        #{i + 1} | {line.start.toFixed(1)}s
                                    </Typography>
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            color: revealedIndex === i ? 'primary.main' : 'text.secondary',
                                            textDecoration: 'underline'
                                        }}
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setRevealedIndex(revealedIndex === i ? null : i); 
                                        }}
                                    >
                                        {revealedIndex === i ? '隐藏' : '提示'}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ mt: 0.5, color: i === currentLine ? '#0d47a1' : 'text.primary' }}>
                                    {revealedIndex === i ? line.text : maskText(line.text)}
                                </Typography>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </Box>
    );
}