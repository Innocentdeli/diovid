export interface Subtitle {
    id: string;
    startTime: number; // milliseconds
    endTime: number;   // milliseconds
    text: string;
    speaker?: string;
    confidence?: number;
}

export function generateSRTSubtitles(subtitles: Subtitle[]): string {
    return subtitles
        .map((sub, index) => {
            const start = formatSRTTimestamp(sub.startTime);
            const end = formatSRTTimestamp(sub.endTime);
            return `${index + 1}\n${start} --> ${end}\n${sub.text}\n`;
        })
        .join('\n');
}

export function generateVTTSubtitles(subtitles: Subtitle[]): string {
    let vtt = 'WEBVTT\n\n';
    vtt += subtitles
        .map((sub) => {
            const start = formatVTTTimestamp(sub.startTime);
            const end = formatVTTTimestamp(sub.endTime);
            return `${start} --> ${end}\n${sub.text}\n`;
        })
        .join('\n');
    return vtt;
}

function formatSRTTimestamp(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const pad = (n: number, d = 2) => String(n).padStart(d, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

function formatVTTTimestamp(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const pad = (n: number, d = 2) => String(n).padStart(d, '0');
    return `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
}
