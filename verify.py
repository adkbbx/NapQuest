"""Run full autonomous days against the real local Laya service."""
import argparse,json,time,uuid
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError

GOALS=[
 'Bring home a huge lunch without spending any money.',
 'Become the king of the woods. Get a crown and become a famous local legend.',
 'Make as many friends as possible. Help others, be kind, and avoid causing trouble.',
 'Take as many naps as possible. Avoid work and come home thoroughly rested.',
 'Steal the best sandwich in the woods, spend nothing, and get away with it.',
 'Be a sneaky thief. Steal food and escape without getting caught.',
]
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:8788');args=parser.parse_args()
    def req(path,data=None):
        request=Request(args.url+path,data=None if data is None else json.dumps(data).encode(),headers={'Content-Type':'application/json'})
        with urlopen(request,timeout=90) as response:return json.load(response)
    status=req('/api/status')
    assert status['status']=='ready',status
    results=[]
    for goal in GOALS:
        g=req('/api/adventures',{'goal':goal,'seed':41})
        assert g['revision']==0 and g['history']==[]
        print('\nGOAL:',goal,'MISSION:',g['mission'],flush=True)
        while g['phase']=='running':
            path='/api/adventures/'+g['id']+'/step'
            body={'revision':g['revision'],'request_id':uuid.uuid4().hex}
            result=req(path,body)
            duplicate=req(path,body)
            assert result==duplicate,'Repeated request played another action'
            assert len(result['history'])==len(g['history'])+1
            assert all(result[k]>=0 for k in ('energy','food','coins','fame','trouble','naps'))
            assert result['energy']<=8
            event=result['history'][-1]
            assert event['evidence']['usage']['truncated'] is False
            assert event['action'] in event['evidence']['question']['criteria']
            print(f"  {event['turn']}. {event['key']} -> {event['action']} | {event['quip']}",flush=True)
            g=result
        assert len(g['history'])==7 and g['ending']
        results.append(g)
    traces={tuple(e['key']+':'+e['action'] for e in g['history']) for g in results}
    missions={g['mission'] for g in results}
    summary={'model':status,'goals':len(results),'unique_missions':len(missions),'unique_traces':len(traces),
             'decisions':sum(len(g['history']) for g in results),'runs':results}
    root=Path(__file__).parent/'evidence';root.mkdir(exist_ok=True)
    (root/'autonomous-evaluation.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    print('\n',json.dumps({k:v for k,v in summary.items() if k not in ('runs','model')},indent=2))
    assert len(missions)==4,'Goal interpretation did not distinguish the four ambitions.'
    assert len(traces)>=3,'The different goals did not produce different adventures.'
    assert any(e['key']=='chase' for g in results for e in g['history']),'No actual Laya run reached the theft consequence.'

if __name__=='__main__':main()
