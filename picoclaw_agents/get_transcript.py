from youtube_transcript_api import YouTubeTranscriptApi
import sys

video_id = "dxeCH2duhMo"
try:
    transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US', 'en-GB'])
    text = " ".join([t['text'] for t in transcript])
    with open('transcript.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Transcript saved successfully.")
except Exception as e:
    print(f"Error: {e}")
