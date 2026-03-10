import fs from 'fs';

const API_KEY = 'AIzaSyDGHXHuPiHAfJGin_c2-LF4FZ5IBMYLNK4';
const MAX_SHORTS_PER_CHANNEL = 20;
const SHORTS_MAX_DURATION = 70;

const channels = [
  { id: 'UCZ8yT-EnZneKIlJX7SgxzLQ', name: 'Channel 1', icon: '🎬' },
  { id: 'UC-i0Rvr1-JtE2A8Z5RuVatg', name: 'Channel 2', icon: '🎥' }
];

async function getChannelUploadsPlaylistId(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
}

async function getPlaylistVideos(playlistId, maxResults = 50) {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items || [];
}

async function getVideoDetails(videoIds) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items || [];
}

function parseDuration(duration) {
  const match = duration.match(/PT(\d+M)?(\d+S)?/);
  let seconds = 0;
  if (match) {
    if (match[1]) seconds += parseInt(match[1]) * 60;
    if (match[2]) seconds += parseInt(match[2]);
  }
  return seconds;
}

async function main() {
  const allVideos = [];
  for (const channel of channels) {
    console.log(`Processing channel: ${channel.name}`);
    const uploadsId = await getChannelUploadsPlaylistId(channel.id);
    if (!uploadsId) continue;
    const playlistItems = await getPlaylistVideos(uploadsId);
    const videoIds = playlistItems.map(item => item.snippet.resourceId.videoId);
    const details = await getVideoDetails(videoIds);
    const shorts = details
      .filter(video => parseDuration(video.contentDetails.duration) <= SHORTS_MAX_DURATION)
      .slice(0, MAX_SHORTS_PER_CHANNEL)
      .map(video => ({
        videoId: video.id,
        channelName: channel.name,
        channelIcon: channel.icon
      }));
    allVideos.push(...shorts);
  }
  allVideos.sort(() => Math.random() - 0.5);
  fs.writeFileSync('videos.json', JSON.stringify(allVideos, null, 2));
  console.log(`✅ videos.json created with ${allVideos.length} shorts.`);
}

main().catch(console.error);
