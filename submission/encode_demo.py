"""Encode native browser screenshots as selected gameplay excerpts, without inventing frames."""
import json, subprocess, sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE/'.tools'))
import imageio_ffmpeg

frames=json.loads((HERE/'frames/earn-timing.json').read_text())
lines=[]
for i,frame in enumerate(frames):
    duration=(frames[i+1]['at']-frame['at'])/1000 if i+1<len(frames) else .35
    lines.extend([f"file '{(HERE/'frames'/frame['name']).as_posix()}'",f'duration {duration:.3f}'])
# The final result was recorded later. This is an explicit excerpt, not an uncut run.
final=(HERE/'media/laya-ten-coins.png').as_posix()
lines.extend([f"file '{final}'",'duration 4',f"file '{final}'"])
concat=HERE/'frames/demo-concat.txt';concat.write_text('\n'.join(lines),encoding='utf-8')
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
video=HERE/'media/laya-gameplay.mp4'
subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-vf','fps=12','-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(video)],check=True)
subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(video),'-vf','fps=4,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer','-loop','0',str(HERE/'media/laya-gameplay.gif')],check=True)
(HERE/'media/recording-notes.json').write_text(json.dumps({'source':'Actual browser screenshots captured through the UI','scenario':'Explicitly supplied defense=5 practice world; separate player save','segments':[{'description':'First 24 seconds after submitting Earn 10 coins','frames':len(frames)},{'description':'Four-second hold on later actual 10/10 completion screenshot'}],'editing':'Selected excerpts; silent video; 12 FPS MP4 and 4 FPS GIF; source screenshots are unchanged','not_claimed':'Uncut real-time recording or an earned level-five village'},indent=2))
print(f'Encoded {len(frames)} actual screenshots and the verified final result.')

siege=json.loads((HERE/'frames/siege-timing.json').read_text())
siege_lines=[]
for i,frame in enumerate(siege):
    duration=(siege[i+1]['at']-frame['at'])/1000 if i+1<len(siege) else .35
    siege_lines.extend([f"file '{(HERE/'frames'/frame['name']).as_posix()}'",f'duration {duration:.3f}'])
siege_lines.append(f"file '{(HERE/'media/captain-victory.png').as_posix()}'")
siege_concat=HERE/'frames/siege-concat.txt';siege_concat.write_text('\n'.join(siege_lines),encoding='utf-8')
siege_video=HERE/'media/captain-siege.mp4'
subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(siege_concat),'-vf','fps=12','-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(siege_video)],check=True)
subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(siege_video),'-vf','fps=4,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer','-loop','0',str(HERE/'media/captain-siege.gif')],check=True)
for clip in [video,siege_video]:
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-i',str(clip),'-f','null','-'],check=True)
print(f'Encoded {len(siege)} actual siege screenshots; both MP4s decode without errors.')
